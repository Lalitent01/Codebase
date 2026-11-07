import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EmbeddingService } from '../ai/embedding.service';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 1. Find or create a chat session and increment character popularity accurately
   */
    async findOrCreateChat(userId: string, characterId: string) {
    const existing = await this.prisma.chat.findUnique({
      where: { userId_characterId: { userId, characterId } },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (existing) {
      return { chat: existing, messages: existing.messages };
    }

    try {
      // New conversation initiation: create chat and increment chatCount
      const newChat = await this.prisma.$transaction(async (tx) => {
        const chat = await tx.chat.create({
          data: { userId, characterId },
        });

        await tx.character.update({
          where: { id: characterId },
          data: { chatCount: { increment: 1 } },
        });

        return chat;
      });

      // Populate default greeting if character has one configured
      const character = await this.prisma.character.findUnique({
        where: { id: characterId },
      });

      let messages: any[] = [];
      if (character?.greeting) {
        const greetingMsg = await this.prisma.message.create({
          data: {
            chatId: newChat.id,
            role: 'ASSISTANT',
            content: character.greeting,
          },
        });
        messages = [greetingMsg];
      }

      return { chat: newChat, messages };
    } catch (error: any) {
      // If a concurrent request created the chat at the exact same moment (P2002), return it
      if (error?.code === 'P2002') {
        const concurrentChat = await this.prisma.chat.findUnique({
          where: { userId_characterId: { userId, characterId } },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        });

        if (concurrentChat) {
          return { chat: concurrentChat, messages: concurrentChat.messages };
        }
      }

      throw error;
    }
  }
  /**
   * 2. Fetch history
   */
  async getMessages(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 3. Save a message to DB
   */
  async saveMessage(chatId: string, content: string, role: 'USER' | 'ASSISTANT') {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return this.prisma.message.create({
      data: { chatId, content, role },
    });
  }

  /**
   * 4. Get Character Data with Redis Caching
   */
  async getChatWithCharacter(chatId: string) {
    const cacheKey = `chat_char_${chatId}`;
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { character: true },
    });

    if (chat) {
      await this.cacheService.set(cacheKey, chat, 1800); // 30 min TTL
    }

    return chat;
  }

  async invalidateChatCache(chatId: string) {
    await this.cacheService.del(`chat_char_${chatId}`);
  }

  /**
   * 5. Long-term Memory: Save meaningful conversational facts only
   */
  async saveToLongTermMemory(userId: string, characterId: string, content: string) {
    const clean = content.trim();
    // Filter out trivial filler messages to prevent DB bloat
    if (clean.length < 15 || /^(hi|hey|hello|ok|yes|no|bye|lol|sure)$/i.test(clean)) {
      return null;
    }

    return this.prisma.memory.create({
      data: { content: clean, userId, characterId },
    });
  }

  /**
   * 6. Sidebar History
   */
  async getRecentChatsSidebar(userId: string) {
    try {
      const chats = await this.prisma.chat.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          character: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });
      return chats.filter((c) => c.character !== null);
    } catch (error: any) {
      this.logger.error(`Failed to fetch sidebar chats: ${error.message}`);
      return [];
    }
  }

  /**
   * 7. Race-Condition Proof Credit Deduction Waterfall
   */
  async deductCredit(userId: string): Promise<{ success: boolean; fidelity: 'STANDARD' | 'ENHANCED' }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, fidelity: 'STANDARD' };

    const now = new Date();

    // 1. Time Pass Holder: Unlimited standard, limited enhanced
    if (user.passExpiry && new Date(user.passExpiry) > now) {
      const enhancedUpdate = await this.prisma.user.updateMany({
        where: { id: userId, passEnhancedLimit: { gt: 0 } },
        data: { passEnhancedLimit: { decrement: 1 } },
      });

      if (enhancedUpdate.count > 0) {
        return { success: true, fidelity: 'ENHANCED' };
      }
      return { success: true, fidelity: 'STANDARD' };
    }

    // 2. Daily Free Energy Allowance (Atomic)
    const dailyUpdate = await this.prisma.user.updateMany({
      where: { id: userId, walletDaily: { gt: 0 } },
      data: { walletDaily: { decrement: 1 } },
    });
    if (dailyUpdate.count > 0) {
      return { success: true, fidelity: 'STANDARD' };
    }

    // 3. Bonus Reward Credits (Atomic)
    const bonusUpdate = await this.prisma.user.updateMany({
      where: { id: userId, walletBonus: { gt: 0 } },
      data: { walletBonus: { decrement: 1 } },
    });
    if (bonusUpdate.count > 0) {
      return { success: true, fidelity: 'STANDARD' };
    }

    // 4. Enhanced Purchased Wallet (Atomic)
    const enhancedWalletUpdate = await this.prisma.user.updateMany({
      where: { id: userId, walletEnhanced: { gt: 0 } },
      data: { walletEnhanced: { decrement: 1 } },
    });
    if (enhancedWalletUpdate.count > 0) {
      return { success: true, fidelity: 'ENHANCED' };
    }

    return { success: false, fidelity: 'STANDARD' };
  }

  /**
   * 8. Delete Chat Session
   */
  async deleteChatSession(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) throw new NotFoundException('Chat not found');

    await this.invalidateChatCache(chatId);

    return this.prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({ where: { chatId } });
      return tx.chat.delete({ where: { id: chatId } });
    });
  }

  async retrieveRelevantMemories(
    userId: string,
    characterId: string,
    _queryText: string,
    limit: number = 3,
  ) {
    const memories = await this.prisma.memory.findMany({
      where: { userId, characterId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return memories.map((m) => m.content).join('\n');
  }
}