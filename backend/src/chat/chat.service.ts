import { Injectable, NotFoundException } from '@nestjs/common';
import { EmbeddingService } from '../ai/embedding.service';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
    private cacheService: CacheService,
  ) {}

  /**
   * 1. Find or create a chat session
   */
  async findOrCreateChat(userId: string, characterId: string) {
    const chat = await this.prisma.chat.upsert({
      where: {
        userId_characterId: {
          userId,
          characterId,
        },
      },
      update: {},
      create: {
        userId,
        characterId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    let messages = chat.messages;

    // Auto-greeting logic if newly created
    if (messages.length === 0) {
      const character = await this.prisma.character.findUnique({
        where: { id: characterId },
      });

      if (character?.greeting) {
        const greetingMsg = await this.prisma.message.create({
          data: {
            chatId: chat.id,
            role: 'ASSISTANT',
            content: character.greeting,
          },
        });
        messages = [greetingMsg];
      }
    }

    return { chat, messages };
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
      await this.cacheService.set(cacheKey, chat, 3600);
    }

    return chat;
  }

  /**
   * Invalidate cached character/chat data when mood/affection/summary changes
   */
  async invalidateChatCache(chatId: string) {
    await this.cacheService.del(`chat_char_${chatId}`);
  }

  /**
   * 5. Long-term Memory: Save Facts
   */
  async saveToLongTermMemory(userId: string, characterId: string, content: string) {
    return this.prisma.memory.create({
      data: {
        content,
        userId,
        characterId,
      },
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
        distinct: ['characterId'],
        take: 7,
        include: {
          character: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
      return chats.filter((c) => c.character !== null);
    } catch (error) {
      console.error('Database error in Sidebar fetch:', error);
      return [];
    }
  }

  /**
   * 7. The Unified Deduction Waterfall
   */
  async deductCredit(userId: string): Promise<{ success: boolean; fidelity: 'STANDARD' | 'ENHANCED' }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, fidelity: 'STANDARD' };

    const now = new Date();

    // 1. Pass Expiry Check (Unlimited standard, smart enhanced quota)
    if (user.passExpiry && new Date(user.passExpiry) > now) {
      if ((user.passEnhancedLimit || 0) > 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { passEnhancedLimit: { decrement: 1 } },
        });
        return { success: true, fidelity: 'ENHANCED' };
      }
      return { success: true, fidelity: 'STANDARD' };
    }

    // 2. Daily Allowance (Standard)
    if ((user.walletDaily || 0) > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletDaily: { decrement: 1 } },
      });
      return { success: true, fidelity: 'STANDARD' };
    }

    // 3. Bonus Bank (Standard)
    if ((user.walletBonus || 0) > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletBonus: { decrement: 1 } },
      });
      return { success: true, fidelity: 'STANDARD' };
    }

    // 4. Enhanced Wallet (Enhanced)
    if ((user.walletEnhanced || 0) > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletEnhanced: { decrement: 1 } },
      });
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

  async retrieveRelevantMemories(userId: string, characterId: string, queryText: string, limit: number = 3) {
    const memories = await this.prisma.memory.findMany({
      where: { userId, characterId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return memories.map((m) => m.content).join('\n');
  }
}