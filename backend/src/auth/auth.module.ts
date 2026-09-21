import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    UsersModule,
    AnalyticsModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallbackSecret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    EmailService,
    PrismaService, // Required by AuthService
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}