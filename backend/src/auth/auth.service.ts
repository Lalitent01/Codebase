import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async signup(email: string, pass: string, username: string) {
    if (!email || !pass || !username) {
      throw new BadRequestException('Email, password, and username are required');
    }

    const exists = await this.usersService.findOneByEmail(email);
    if (exists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const verificationToken = randomBytes(32).toString('hex');

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          username,
          emailVerificationToken: verificationToken,
          isEmailVerified: false,
        },
      });

      await this.emailService.sendVerificationEmail(email, verificationToken);
      return this.login(user);
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new BadRequestException('Username or email is already taken');
      }
      throw err;
    }
  }

  async resetPassword(token: string, newPass: string) {
    if (!token || !newPass) {
      throw new BadRequestException('Token and new password are required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { success: true };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new BadRequestException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');

    const newToken = randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: newToken },
    });

    await this.emailService.sendVerificationEmail(user.email, newToken);
    return { success: true, message: 'New verification link sent to your inbox.' };
  }

  async googleLogin(req: any) {
    if (!req?.user?.email) {
      throw new BadRequestException('Google authentication failed: no email returned');
    }

    const { email, firstName } = req.user;
    let user = await this.usersService.findOneByEmail(email);

    if (!user) {
      const baseUsername = firstName || email.split('@')[0];
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${baseUsername}${randomSuffix}`;

      user = await this.usersService.create(email, null, username);
      await this.analyticsService.track('SIGNUP', user.id, { provider: 'google' });
    } else {
      await this.analyticsService.track('LOGIN', user.id, { provider: 'google' });
    }

    if (user && user.isBanned) {
      throw new UnauthorizedException('Account suspended.');
    }

    return this.login(user);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };

    await this.analyticsService.heartbeat(user.id);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Token is required');

    const user = await this.prisma.user.findFirst({ where: { emailVerificationToken: token } });
    if (!user) throw new BadRequestException('Invalid or expired token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerificationToken: null },
    });

    return { success: true };
  }

  async forgotPassword(email: string) {
    if (!email) throw new BadRequestException('Email is required');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return { message: 'If account exists, email sent.' };
    }

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expiry },
    });

    await this.emailService.sendPasswordResetEmail(email, token);
    return { message: 'Email sent.' };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    if (!email || !pass) return null;

    const user = await this.usersService.findOneByEmail(email);
    if (user && user.passwordHash && (await bcrypt.compare(pass, user.passwordHash))) {
      if (user.isBanned) {
        throw new UnauthorizedException(
          user.banReason ? `Account suspended: ${user.banReason}` : 'Your account has been suspended.',
        );
      }
      return user;
    }
    return null;
  }
}