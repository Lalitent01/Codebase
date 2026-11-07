import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma.service';
import { EmbeddingService } from '../ai/embedding.service';
import { CacheService } from '../cache/cache.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: {
            chat: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
            character: { findUnique: jest.fn(), update: jest.fn() },
            message: { create: jest.fn(), findMany: jest.fn() },
            user: { findUnique: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
            memory: { create: jest.fn(), findMany: jest.fn() },
            $transaction: jest.fn((cb) => cb({
              chat: { create: jest.fn().mockResolvedValue({ id: 'chat_1' }) },
              character: { update: jest.fn() },
              message: { deleteMany: jest.fn() },
            })),
          },
        },
        {
          provide: EmbeddingService,
          useValue: {
            generateEmbedding: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should atomically deduct credits', async () => {
    const result = await service.deductCredit('user_123');
    expect(result).toHaveProperty('success');
  });
});