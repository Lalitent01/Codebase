import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async updateBio(userId: string, bio: string) {
    const cleanBio = bio !== undefined ? bio.trim() : '';
    if (cleanBio.length > 300) {
      throw new BadRequestException('Bio must not exceed 300 characters.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { bio: cleanBio },
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
    const isGoogleAuth = passwordHash === null;

    return this.prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        username: username.trim(),
        isEmailVerified: isGoogleAuth, // Google OAuth accounts are pre-verified
      },
    });
  }
}