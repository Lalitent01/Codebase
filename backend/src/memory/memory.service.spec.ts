import { Test, TestingModule } from '@nestjs/testing';
import { MemoryService } from './memory.service';
import { PrismaService } from '../prisma.service';

describe('MemoryService', () => {
  let service: MemoryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryService,
        {
          provide: PrismaService,
          useValue: {
            memory: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mem_1', ...data })),
              findMany: jest.fn().mockResolvedValue([]),
              deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ignore empty or whitespace-only facts', async () => {
    const result = await service.saveFact('user_1', 'char_1', '   ');
    expect(result).toBeNull();
  });

  it('should save a valid non-duplicate fact', async () => {
    const result = await service.saveFact('user_1', 'char_1', 'User likes stargazing.');
    expect(result).toHaveProperty('content', 'User likes stargazing.');
    expect(prisma.memory.create).toHaveBeenCalled();
  });

  it('should not re-create if identical fact exists', async () => {
    jest.spyOn(prisma.memory, 'findFirst').mockResolvedValueOnce({
      id: 'existing_id',
      userId: 'user_1',
      characterId: 'char_1',
      content: 'User likes stargazing.',
      createdAt: new Date(),
    } as any);

    const result = await service.saveFact('user_1', 'char_1', 'User likes stargazing.');
    expect(result?.id).toBe('existing_id');
    expect(prisma.memory.create).not.toHaveBeenCalled();
  });
});