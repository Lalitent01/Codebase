import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findOneByEmail: jest.fn(), create: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'jwt_token') } },
        { provide: AnalyticsService, useValue: { track: jest.fn(), heartbeat: jest.fn() } },
        { provide: PrismaService, useValue: { user: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() } } },
        { provide: EmailService, useValue: { sendVerificationEmail: jest.fn(), sendPasswordResetEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});