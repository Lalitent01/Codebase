import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class LootService {
  private readonly logger = new Logger(LootService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AnalyticsService))
    private readonly analyticsService: AnalyticsService,
  ) {}

  async createLootBox(data: { name: string; color: string }) {
    return this.prisma.lootBox.upsert({
      where: { name: data.name },
      update: { color: data.color },
      create: {
        name: data.name,
        color: data.color,
      },
    });
  }

  async addLootItem(data: {
    boxId: string;
    label: string;
    type: string;
    value: number;
    weight: number;
    planId?: string;
  }) {
    return this.prisma.lootItem.create({
      data: {
        boxId: data.boxId,
        label: data.label,
        type: data.type,
        value: Number(data.value) || 0,
        weight: Number(data.weight) || 1,
        planId: data.planId || null,
      },
    });
  }

  async getAllBoxes() {
    return this.prisma.lootBox.findMany({
      include: {
        items: {
          include: { plan: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getUserInventory(userId: string) {
    return this.prisma.userInventory.findMany({
      where: {
        userId,
        count: { gt: 0 },
      },
      include: {
        box: {
          include: { items: true },
        },
      },
    });
  }

  async addChestToInventory(userId: string, boxId: string, count: number = 1, tx?: any) {
    const prisma = tx || this.prisma;
    return prisma.userInventory.upsert({
      where: { userId_boxId: { userId, boxId } },
      update: { count: { increment: count } },
      create: { userId, boxId, count },
    });
  }

  // Double-Spend Fixed: Atomic conditional check inside the transaction
  async openChest(userId: string, boxId: string) {
    const box = await this.prisma.lootBox.findUnique({
      where: { id: boxId },
      include: {
        items: {
          include: { plan: true },
        },
      },
    });

    if (!box || box.items.length === 0) {
      throw new BadRequestException('This chest is currently empty or does not exist.');
    }

    const totalWeight = box.items.reduce((sum, item) => sum + (item.weight || 0), 0);
    if (totalWeight <= 0) {
      throw new BadRequestException('Chest has no drop chances configured.');
    }

    let random = Math.floor(Math.random() * totalWeight);
    let winningItem = box.items[0];

    for (const item of box.items) {
      if (random < item.weight) {
        winningItem = item;
        break;
      }
      random -= item.weight;
    }

    return this.prisma.$transaction(async (tx) => {
      // Atomically decrement box count ONLY if count > 0
      const deductResult = await tx.userInventory.updateMany({
        where: {
          userId,
          boxId,
          count: { gt: 0 },
        },
        data: {
          count: { decrement: 1 },
        },
      });

      if (deductResult.count === 0) {
        throw new BadRequestException('No chests available in vault.');
      }

      let planName: string | null = null;

      if (winningItem.type === 'PLAN' && winningItem.planId) {
        await this.analyticsService.activatePlan(userId, winningItem.planId, true, tx);
        planName = winningItem.plan?.name || 'Time Pass';
      } else {
        const credits = Number(winningItem.value) || 0;
        await tx.user.update({
          where: { id: userId },
          data: { walletBonus: { increment: credits } },
        });
      }

      return {
        item: {
          ...winningItem,
          planName,
        },
        color: box.color,
      };
    });
  }

  async setLootItems(boxId: string, items: any[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.lootItem.deleteMany({ where: { boxId } });
      return tx.lootItem.createMany({
        data: items.map((item) => ({
          boxId,
          label: item.label || 'Reward',
          type: item.type,
          value: item.type === 'CREDITS' ? parseInt(item.value, 10) || 0 : 0,
          planId: item.type === 'PLAN' ? item.planId : null,
          weight: parseInt(item.weight, 10) || 1,
        })),
      });
    });
  }

  async deleteLootBox(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.quest.updateMany({
        where: { lootBoxId: id },
        data: { rewardType: 'CREDITS', lootBoxId: null, rewardValue: 50 },
      });
      await tx.rewardTier.updateMany({
        where: { lootBoxId: id },
        data: { rewardType: 'CREDITS', lootBoxId: null, creditsGiven: 50 },
      });
      await tx.userInventory.deleteMany({ where: { boxId: id } });
      await tx.lootItem.deleteMany({ where: { boxId: id } });
      return tx.lootBox.delete({ where: { id } });
    });
  }
}