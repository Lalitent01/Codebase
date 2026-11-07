import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Sse,
  MessageEvent,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { ModerationService } from '../moderation/moderation.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly aiService: AiService,
    private readonly moderationService: ModerationService,
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('init/:characterId')
  @UseGuards(AuthGuard('jwt'))
  async initChat(@Req() req: any, @Param('characterId') characterId: string) {
    await this.analyticsService.track('CHAT_START', req.user.id, { characterId });
    return this.chatService.findOrCreateChat(req.user.id, characterId);
  }

  @Get('recent-sidebar')
  @UseGuards(AuthGuard('jwt'))
  async getRecentSidebar(@Req() req: any) {
    return this.chatService.getRecentChatsSidebar(req.user.id);
  }

  @Post(':chatId/message')
  @UseGuards(AuthGuard('jwt'))
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() body: { content: string; role: 'USER' | 'ASSISTANT' },
    @Req() req: any,
  ) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId: req.user.id },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    if (body.role === 'USER') {
      // Local keyword check: strictly blocks minors and illegal content
      this.moderationService.validateMessage(body.content);
    }

    return this.chatService.saveMessage(chatId, body.content, body.role);
  }

  @Patch(':chatId/message/:messageId')
  @UseGuards(AuthGuard('jwt'))
  async editMessage(
    @Param('chatId') chatId: string,
    @Param('messageId') msgId: string,
    @Body() body: { content: string },
    @Req() req: any,
  ) {
    const msg = await this.prisma.message.findFirst({
      where: { id: msgId, chat: { id: chatId, userId: req.user.id } },
    });
    if (!msg) throw new NotFoundException('Message not found');

    this.moderationService.validateMessage(body.content);

    return this.prisma.$transaction(async (tx) => {
      await tx.message.update({ where: { id: msgId }, data: { content: body.content } });
      await tx.message.deleteMany({ where: { chatId, createdAt: { gt: msg.createdAt } } });
      await this.chatService.invalidateChatCache(chatId);
      return { success: true };
    });
  }

  @Delete(':chatId/regenerate')
  @UseGuards(AuthGuard('jwt'))
  async prepareRegen(@Param('chatId') chatId: string, @Req() req: any) {
    const chat = await this.prisma.chat.findFirst({ where: { id: chatId, userId: req.user.id } });
    if (!chat) throw new NotFoundException('Chat not found');

    const lastAi = await this.prisma.message.findFirst({
      where: { chatId, role: 'ASSISTANT' },
      orderBy: { createdAt: 'desc' },
    });

    if (lastAi) {
      await this.prisma.message.delete({ where: { id: lastAi.id } });
    }
    return { success: true };
  }

  @Delete(':chatId')
  @UseGuards(AuthGuard('jwt'))
  async deleteChat(@Param('chatId') chatId: string, @Req() req: any) {
    return this.chatService.deleteChatSession(chatId, req.user.id);
  }

  @Sse(':chatId/stream')
  @UseGuards(AuthGuard('jwt'))
  async streamAiResponse(
    @Param('chatId') chatId: string,
    @Req() req: any,
  ): Promise<Observable<MessageEvent>> {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { personas: { where: { isActive: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const chat = await this.chatService.getChatWithCharacter(chatId);
    if (!chat) throw new NotFoundException('Chat not found');

    if (chat.userId !== user.id) {
      throw new ForbiddenException('You do not own this chat session');
    }

    const activePersona = user.personas[0] || null;
    const isCharacterUnfiltered = Boolean(chat.character?.unfiltered);

    return new Observable((observer) => {
      let isCancelled = false;

      (async () => {
        try {
          const lastMsg = await this.prisma.message.findFirst({
            where: { chatId, role: 'USER' },
            orderBy: { createdAt: 'desc' },
          });

          if (lastMsg) {
            // Layer 1: Strict legal check (always runs to block minors / CSAM across both SFW and 18+)
            try {
              this.moderationService.validateMessage(lastMsg.content);
            } catch (err: any) {
              observer.next({ data: { content: `⚠️ POLICY VIOLATION: ${err.message || 'Prohibited content'}` } });
              return observer.complete();
            }

            // Layer 2: LLM check ONLY for SFW bots to prevent explicit anatomy/pornography
            // 18+ Unfiltered bots completely bypass this check!
            if (!isCharacterUnfiltered) {
              const modResult = await this.aiService.moderateContent(lastMsg.content, false);
              if (!modResult.safe) {
                observer.next({ data: { content: `⚠️ POLICY VIOLATION: ${modResult.reason || 'Content Flagged'}` } });
                return observer.complete();
              }
            }
          }

          if (isCancelled) return;

          // Deduct credit atomically
          const deduction = await this.chatService.deductCredit(user.id);
          if (!deduction.success) {
            observer.next({ data: { content: 'LIMIT_REACHED' } });
            return observer.complete();
          }

          const useEnhanced = deduction.fidelity === 'ENHANCED';

          // Emit updated wallet status
          const updatedUser = await this.prisma.user.findUnique({ where: { id: user.id } });
          const totalEnergy =
            (updatedUser?.walletDaily || 0) + (updatedUser?.walletBonus || 0) + (updatedUser?.walletEnhanced || 0);
          observer.next({ data: { usage: { total_credits: totalEnergy } } });

          // Fetch recent context window (sliding 10 turns)
          const history = await this.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

          const formattedHistory = history.reverse().map((m) => ({
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content,
          }));

          const lastUserMsg = formattedHistory[formattedHistory.length - 1]?.content || '';
          const memories = await this.chatService.retrieveRelevantMemories(
            user.id,
            chat.characterId,
            lastUserMsg,
            useEnhanced ? 8 : 3,
          );

          if (isCancelled) return;

          const stream = await this.aiService.getChatResponseStream(
            chat.character,
            user,
            activePersona,
            formattedHistory.slice(0, -1),
            lastUserMsg,
            chat.summary || '',
            memories,
            chat.mood || 'Neutral',
            chat.affection ?? 50,
            useEnhanced,
          );

          let fullResponse = '';
          let pendingBuffer = '';

          for await (const chunk of stream) {
            if (isCancelled) break;

            if ((chunk as any).usage) {
              observer.next({ data: { usage: (chunk as any).usage } });
            }

            const delta = chunk.choices[0]?.delta?.content || '';
            fullResponse += delta;
            pendingBuffer += delta;

            // Stream clean prose without leaking ###{...} trailers to the UI
            if (pendingBuffer.includes('###')) {
              const safePart = pendingBuffer.substring(0, pendingBuffer.indexOf('###'));
              if (safePart.length > 0) {
                observer.next({ data: { content: safePart } });
              }
              pendingBuffer = pendingBuffer.substring(pendingBuffer.indexOf('###'));
            } else if (!pendingBuffer.startsWith('#')) {
              observer.next({ data: { content: pendingBuffer } });
              pendingBuffer = '';
            }
          }

          // If stream ended without JSON trailer, emit whatever remained in buffer
          if (!fullResponse.includes('###') && pendingBuffer.length > 0 && !isCancelled) {
            observer.next({ data: { content: pendingBuffer } });
          }

          if (isCancelled) {
            return;
          }

          // Parse state update if present
          const statusRegex = /###\s*\{["']?mood["']?:\s*["']?(.*?)["']?,\s*["']?affection["']?:\s*(-?\d+)\}/i;
          const statusMatch = fullResponse.match(statusRegex);
          let cleanContent = fullResponse;

          if (statusMatch) {
            const newMood = statusMatch[1];
            const parsedAffection = Math.min(100, Math.max(0, parseInt(statusMatch[2], 10)));

            await this.prisma.chat.update({
              where: { id: chatId },
              data: { mood: newMood, affection: parsedAffection },
            });
            await this.chatService.invalidateChatCache(chatId);

            cleanContent = fullResponse.substring(0, statusMatch.index).trim();
          }

          // Persist the clean message and triggers
          await this.chatService.saveMessage(chatId, cleanContent.trim(), 'ASSISTANT');
          await this.chatService.saveToLongTermMemory(user.id, chat.characterId, lastUserMsg);
          await this.analyticsService.track('CHAT_MESSAGE', user.id, {
            characterId: chat.characterId,
            fidelity: useEnhanced ? 'ENHANCED' : 'STANDARD',
            rating: isCharacterUnfiltered ? '18+' : 'SFW',
          });
          await this.analyticsService.handleQuestTrigger(user.id, 'MESSAGE_COUNT', 1);

          // Summarize periodically every 20 messages
          const messageCount = await this.prisma.message.count({ where: { chatId } });
          if (messageCount > 0 && messageCount % 20 === 0) {
            const allMessages = await this.prisma.message.findMany({
              where: { chatId },
              orderBy: { createdAt: 'asc' },
              take: 20,
            });
            const audit = await this.aiService.summarizeHistory(
              allMessages.map((m) => ({
                role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
                content: m.content,
              })),
            );
            await this.prisma.chat.update({
              where: { id: chatId },
              data: { summary: audit.summary, mood: audit.mood, affection: audit.affection },
            });
            await this.chatService.invalidateChatCache(chatId);
          }

          observer.complete();
        } catch (err: any) {
          this.logger.error(`AI Stream Error: ${err.message}`, err.stack);
          observer.next({ data: { content: ' [Connection lost. Please click regenerate to continue]' } });
          observer.complete();
        }
      })();

      // RxJS teardown hook when client closes browser / tab
      return () => {
        isCancelled = true;
      };
    });
  }
}