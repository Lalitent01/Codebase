import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PersonasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all personas belonging to a specific user
   */
  async getPersonas(userId: string) {
    return this.prisma.userPersona.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Atomically creates a persona and enforces a strict cap of 5 per user
   */
  async createPersona(
    userId: string,
    data: { name: string; description?: string },
  ) {
    const cleanName = data.name?.trim();
    if (!cleanName) {
      throw new BadRequestException('Persona name is required.');
    }

    if (cleanName.length > 50) {
      throw new BadRequestException('Persona name must not exceed 50 characters.');
    }

    const cleanDescription = data.description?.trim() || '';
    if (cleanDescription.length > 500) {
      throw new BadRequestException('Persona description must not exceed 500 characters.');
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.userPersona.count({ where: { userId } });

      if (count >= 5) {
        throw new ForbiddenException('You can create a maximum of 5 personas.');
      }

      // First persona is automatically set to active
      const shouldBeActive = count === 0;

      return tx.userPersona.create({
        data: {
          name: cleanName,
          description: cleanDescription,
          userId,
          isActive: shouldBeActive,
        },
      });
    });
  }

  /**
   * Atomically sets a persona as active and deactivates all others for that user
   */
  async setActive(userId: string, personaId: string) {
    const persona = await this.prisma.userPersona.findFirst({
      where: { id: personaId, userId },
    });

    if (!persona) {
      throw new NotFoundException('Persona not found');
    }

    if (persona.isActive) {
      return persona; // Already active, no DB writes needed
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Deactivate all existing personas for this user
      await tx.userPersona.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      // 2. Activate target persona
      return tx.userPersona.update({
        where: { id: personaId },
        data: { isActive: true },
      });
    });
  }

  /**
   * Deletes a persona and seamlessly promotes another if the active one was deleted
   */
  async deletePersona(userId: string, personaId: string) {
    const persona = await this.prisma.userPersona.findFirst({
      where: { id: personaId, userId },
    });

    if (!persona) {
      throw new NotFoundException('Persona not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.userPersona.delete({ where: { id: personaId } });

      // If the deleted persona was active, activate the most recently created one
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

  /**
   * Updates an existing persona
   */
  async updatePersona(
    userId: string,
    personaId: string,
    data: { name?: string; description?: string },
  ) {
    const persona = await this.prisma.userPersona.findFirst({
      where: { id: personaId, userId },
    });

    if (!persona) {
      throw new NotFoundException('Persona not found');
    }

    const updateData: { name?: string; description?: string } = {};

    if (data.name !== undefined) {
      const cleanName = data.name.trim();
      if (!cleanName) throw new BadRequestException('Persona name cannot be empty.');
      if (cleanName.length > 50) throw new BadRequestException('Persona name must not exceed 50 characters.');
      updateData.name = cleanName;
    }

    if (data.description !== undefined) {
      const cleanDesc = data.description.trim();
      if (cleanDesc.length > 500) throw new BadRequestException('Persona description must not exceed 500 characters.');
      updateData.description = cleanDesc;
    }

    return this.prisma.userPersona.update({
      where: { id: personaId },
      data: updateData,
    });
  }
}