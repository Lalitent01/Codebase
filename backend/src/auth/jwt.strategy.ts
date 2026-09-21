import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallbackSecret',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOneByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        'Your account has been suspended. Reason: ' + (user.banReason || 'Policy Violation'),
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