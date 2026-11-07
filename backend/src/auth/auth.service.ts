import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await this.usersService.findOneByEmail(normalizedEmail);
    if (exists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const verificationToken = randomBytes(32).toString('hex');

    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: hashedPassword,
          username: username.trim(),
          emailVerificationToken: verificationToken,
          isEmailVerified: false,
        },
      });

      // Send verification email; log failure gracefully so signup still succeeds
      try {
        await this.emailService.sendVerificationEmail(normalizedEmail, verificationToken);
      } catch (err: any) {
        this.logger.warn(`Deferred email delivery failure during signup: ${err.message}`);
      }

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

    if (newPass.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
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

    return { success: true, message: 'Password has been reset successfully' };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new BadRequestException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email is already verified');

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

    const email = req.user.email.toLowerCase().trim();
    const { firstName } = req.user;
    let user = await this.usersService.findOneByEmail(email);

    if (!user) {
      const baseUsername = firstName || email.split('@')[0];
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${baseUsername}${randomSuffix}`;

      // Google email is pre-verified
      user = await this.prisma.user.create({
        data: {
          email,
          username,
          isEmailVerified: true,
        },
      });

      await this.analyticsService.track('SIGNUP', user.id, { provider: 'google' });
    } else {
      // If user signed up previously via password and now signs in with Google, mark verified
      if (!user.isEmailVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      }
      await this.analyticsService.track('LOGIN', user.id, { provider: 'google' });
    }

    if (user.isBanned) {
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
    if (!user) throw new BadRequestException('Invalid or expired verification token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerificationToken: null },
    });

    return { success: true, message: 'Email successfully verified' };
  }

  async forgotPassword(email: string) {
    if (!email) throw new BadRequestException('Email is required');

    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    // Mitigate account enumeration by returning identical message if user doesn't exist
    if (!user || !user.passwordHash) {
      return { message: 'If an account exists with that email, a password reset link has been sent.' };
    }

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expiry },
    });

    try {
      await this.emailService.sendPasswordResetEmail(normalizedEmail, token);
    } catch (err: any) {
      this.logger.error(`Failed to send password reset: ${err.message}`);
    }

    return { message: 'If an account exists with that email, a password reset link has been sent.' };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    if (!email || !pass) return null;

    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findOneByEmail(normalizedEmail);
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