import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    ConfigModule,
    UsersModule,
    AnalyticsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('CRITICAL: JWT_SECRET environment variable is missing.');
        }
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    EmailService,
    PrismaService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}