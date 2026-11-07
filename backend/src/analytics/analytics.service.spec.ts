import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { LootService } from './loot.service';
import { PrismaService } from '../prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn(), update: jest.fn() },
            analyticsEvent: { create: jest.fn(), count: jest.fn() },
            quest: { findMany: jest.fn() },
            userQuestProgress: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
            $transaction: jest.fn((cb) => cb({
              userQuestProgress: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
              user: { update: jest.fn() },
            })),
          },
        },
        {
          provide: LootService,
          useValue: {
            addChestToInventory: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});