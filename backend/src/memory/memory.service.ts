import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MemoryService {
  constructor(private prisma: PrismaService) {}

  async saveFact(userId: string, characterId: string, fact: string) {
    if (!fact || !fact.trim()) {
      return null;
    }

    return this.prisma.memory.create({
      data: {
        userId,
        characterId,
        content: fact.trim(),
      },
    });
  }

  async getRelevantMemories(userId: string, characterId: string, limit: number = 5) {
    return this.prisma.memory.findMany({
      where: { userId, characterId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}