import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user by id', async () => {
    const mockUser = { id: 'u_1', email: 'test@suroor.cc' };
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

    const result = await service.findById('u_1');
    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u_1' } });
  });

  it('should reject bio exceeding 300 characters', async () => {
    const longBio = 'a'.repeat(301);
    await expect(service.updateBio('u_1', longBio)).rejects.toThrow();
  });
});