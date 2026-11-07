import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET must be defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // Lookup by primary key ID (payload.sub) for better indexing and performance
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        user.banReason ? `Account suspended: ${user.banReason}` : 'Your account has been suspended.',
      );
    }

    const walletDaily = user.walletDaily || 0;
    const walletBonus = user.walletBonus || 0;
    const walletEnhanced = user.walletEnhanced || 0;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      walletDaily,
      walletBonus,
      walletEnhanced,
      passExpiry: user.passExpiry,
      passEnhancedLimit: user.passEnhancedLimit,
      credits: walletDaily + walletBonus + walletEnhanced,
    };
  }
}