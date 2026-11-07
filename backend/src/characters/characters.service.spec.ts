import { Test, TestingModule } from '@nestjs/testing';
import { CharactersService } from './characters.service';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';

describe('CharactersService', () => {
  let service: CharactersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        {
          provide: PrismaService,
          useValue: {
            character: {
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(0),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            analyticsEvent: { findMany: jest.fn().mockResolvedValue([]) },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
            delByPattern: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});