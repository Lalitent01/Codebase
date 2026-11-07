import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { ModerationService } from '../moderation/moderation.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma.service';

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: {
            findOrCreateChat: jest.fn(),
            getRecentChatsSidebar: jest.fn(),
            saveMessage: jest.fn(),
            deleteChatSession: jest.fn(),
            getChatWithCharacter: jest.fn(),
            deductCredit: jest.fn(),
            retrieveRelevantMemories: jest.fn(),
            saveToLongTermMemory: jest.fn(),
            invalidateChatCache: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            moderateContent: jest.fn().mockResolvedValue({ safe: true }),
            getChatResponseStream: jest.fn(),
            summarizeHistory: jest.fn(),
          },
        },
        {
          provide: ModerationService,
          useValue: {
            validateMessage: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            track: jest.fn(),
            handleQuestTrigger: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            chat: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
            user: { findUnique: jest.fn() },
            message: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
            $transaction: jest.fn((cb) => cb({
              message: { update: jest.fn(), deleteMany: jest.fn() },
            })),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});