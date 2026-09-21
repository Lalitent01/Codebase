import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PersonasService {
  constructor(private prisma: PrismaService) {}

  async getPersonas(userId: string) {
    return this.prisma.userPersona.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPersona(userId: string, data: { name: string; description: string }) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Persona name is required');
    }

    const count = await this.prisma.userPersona.count({ where: { userId } });

    // Limit set to 5 personas per user
    if (count >= 5) {
      throw new ForbiddenException('You can create a maximum of 5 personas.');
    }

    // First persona is automatically set to active
    const shouldBeActive = count === 0;

    return this.prisma.userPersona.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        userId,
        isActive: shouldBeActive,
      },
    });
  }

  async updateBio(userId: string, bio: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { bio },
    });
  }

  async setActive(userId: string, personaId: string) {
    const persona = await this.prisma.userPersona.findFirst({
      where: { id: personaId, userId },
    });
    if (!persona) throw new NotFoundException('Persona not found');

    // Run atomically in transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.userPersona.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      return tx.userPersona.update({
        where: { id: personaId },
        data: { isActive: true },
      });
    });
  }

  async deletePersona(userId: string, personaId: string) {
    const persona = await this.prisma.userPersona.findFirst({
      where: { id: personaId, userId },
    });

    if (!persona) throw new NotFoundException('Persona not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.userPersona.delete({ where: { id: personaId } });

      // If deleted persona was active, promote the newest remaining persona to active
      if (persona.isActive) {
        const remaining = await tx.userPersona.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (remaining) {
          await tx.userPersona.update({
            where: { id: remaining.id },
            data: { isActive: true },
          });
        }
      }

      return { success: true };
    });
  }

  async updatePersona(userId: string, personaId: string, data: { name?: string; description?: string }) {
    const persona = await this.prisma.userPersona.findFirst({
      where: { id: personaId, userId },
    });
    if (!persona) throw new NotFoundException('Persona not found');

    return this.prisma.userPersona.update({
      where: { id: personaId },
      data: {
        name: data.name !== undefined ? data.name.trim() : persona.name,
        description: data.description !== undefined ? data.description.trim() : persona.description,
      },
    });
  }
}