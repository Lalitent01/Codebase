import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateBio(userId: string, bio: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { bio },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: { characters: { where: { status: 'PUBLIC' } } },
        },
      },
    });
  }

  async create(email: string, passwordHash: string | null, username: string) {
    // If passwordHash is null, user signed up via Google OAuth (already verified)
    const isGoogleAuth = passwordHash === null;

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        isEmailVerified: isGoogleAuth, // Google users are verified by default
      },
    });
  }
}