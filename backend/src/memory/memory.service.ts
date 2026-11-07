import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists a distinct memory fact, avoiding duplicates.
   */
  async saveFact(userId: string, characterId: string, fact: string) {
    const cleanFact = fact?.trim();
    if (!cleanFact || cleanFact.length < 5) {
      return null;
    }

    // Check for duplicate memory already saved for this character
    const existing = await this.prisma.memory.findFirst({
      where: {
        userId,
        characterId,
        content: { equals: cleanFact, mode: 'insensitive' },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.memory.create({
      data: {
        userId,
        characterId,
        content: cleanFact,
      },
    });
  }

  /**
   * Retrieves chronological long-term memories for a conversation pair.
   */
  async getRelevantMemories(userId: string, characterId: string, limit: number = 5) {
    return this.prisma.memory.findMany({
      where: { userId, characterId },
      take: Math.min(Math.max(1, limit), 20),
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deletes all memories between a user and a character (used when resetting a bot).
   */
  async clearMemories(userId: string, characterId: string) {
    return this.prisma.memory.deleteMany({
      where: { userId, characterId },
    });
  }
}