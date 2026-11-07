import { Test, TestingModule } from '@nestjs/testing';
import { PersonasService } from './personas.service';
import { PrismaService } from '../prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('PersonasService', () => {
  let service: PersonasService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonasService,
        {
          provide: PrismaService,
          useValue: {
            userPersona: {
              findMany: jest.fn().mockResolvedValue([]),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              updateMany: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn((cb) => cb({
              userPersona: {
                count: jest.fn().mockResolvedValue(0),
                create: jest.fn().mockResolvedValue({ id: 'p_1', name: 'Adventurer', isActive: true }),
                updateMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                findFirst: jest.fn(),
              },
            })),
          },
        },
      ],
    }).compile();

    service = module.get<PersonasService>(PersonasService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject persona creation without a name', async () => {
    await expect(service.createPersona('u_1', { name: '   ' })).rejects.toThrow(BadRequestException);
  });

  it('should enforce 5 persona limit', async () => {
    jest.spyOn(prisma, '$transaction').mockImplementationOnce(async (cb: any) => {
      return cb({
        userPersona: {
          count: jest.fn().mockResolvedValue(5),
        },
      });
    });

    await expect(service.createPersona('u_1', { name: 'Test Persona' })).rejects.toThrow(ForbiddenException);
  });
});