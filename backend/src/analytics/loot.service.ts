import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class LootService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AnalyticsService))
    private analyticsService: AnalyticsService,
  ) {}

  // 1. ADMIN: Create or Update a Box
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

  // 2. ADMIN: Add a single drop item
  async addLootItem(data: { boxId: string; label: string; type: string; value: number; weight: number; planId?: string }) {
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

  // 3. ADMIN: Get all boxes for the UI
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

  // 4. USER: Get personal inventory (The Vault)
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

  // 5. SYSTEM: Add chest to user inventory
  async addChestToInventory(userId: string, boxId: string, count: number = 1, tx?: any) {
    const prisma = tx || this.prisma;
    return prisma.userInventory.upsert({
      where: { userId_boxId: { userId, boxId } },
      update: { count: { increment: count } },
      create: { userId, boxId, count },
    });
  }

  // 6. USER: The Weighted "Roll" Logic (Updated)
  async openChest(userId: string, boxId: string) {
    const inv = await this.prisma.userInventory.findUnique({
      where: { userId_boxId: { userId, boxId } },
    });

    if (!inv || inv.count <= 0) throw new BadRequestException('No chests in vault.');

    // Fetch box and include Plan relations so we know the plan name and duration
    const box = await this.prisma.lootBox.findUnique({
      where: { id: boxId },
      include: {
        items: {
          include: { plan: true },
        },
      },
    });

    if (!box || box.items.length === 0) throw new BadRequestException('This chest is currently empty.');

    // Weighted Probability Math
    const totalWeight = box.items.reduce((sum, item) => sum + (item.weight || 0), 0);
    if (totalWeight <= 0) throw new BadRequestException('Chest has no drop chances configured.');

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
      // Deduct 1 Box from vault
      await tx.userInventory.update({
        where: { id: inv.id },
        data: { count: { decrement: 1 } },
      });

      let planName: string | null = null;

      // Dispatch Reward
      if (winningItem.type === 'PLAN' && winningItem.planId) {
        await this.analyticsService.activatePlan(userId, winningItem.planId, true, tx);
        planName = winningItem.plan?.name || 'Time Pass';
        console.log(`🎁 [CHEST DECRYPTED] User ${userId} opened "${box.name}" and received PLAN: "${planName}"`);
      } else {
        const credits = Number(winningItem.value) || 0;
        await tx.user.update({
          where: { id: userId },
          data: { walletBonus: { increment: credits } },
        });
        console.log(`🎁 [CHEST DECRYPTED] User ${userId} opened "${box.name}" and received +${credits} CREDITS`);
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

  // 7. ADMIN: Bulk update drop items
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

  // 8. ADMIN: Safe Delete
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