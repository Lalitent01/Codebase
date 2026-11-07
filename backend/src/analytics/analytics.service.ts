import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { LootService } from './loot.service';
import { PrismaService } from '../prisma.service';
import { QuestTrigger } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => LootService))
    private readonly lootService: LootService,
  ) {}

  // 1. GENERIC TRACKING
  async track(eventType: string, userId?: string, metadata?: any) {
    try {
      await this.prisma.analyticsEvent.create({
        data: { eventType, userId: userId || null, metadata },
      });
    } catch (e: any) {
      this.logger.error(`Analytics tracking failed: ${e.message}`);
    }
  }

  // 2. ECONOMY HEARTBEAT
  async heartbeat(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const now = new Date();
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
    const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : new Date(0);

    const isNewDay = now.toDateString() !== lastReset.toDateString();

    let dailyAllowanceUpdate = {};
    if (isNewDay) {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key: 'DAILY_FREE_LIMIT' },
      });
      const limit = config && !isNaN(parseInt(config.value, 10)) ? parseInt(config.value, 10) : 30;

      dailyAllowanceUpdate = {
        walletDaily: limit,
        lastDailyReset: now,
      };
    }

    const isYesterday = (date: Date) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    };

    let newStreak = user.currentStreak || 0;
    if (lastActive && isYesterday(lastActive)) {
      newStreak += 1;
    } else if (!lastActive || now.toDateString() !== lastActive.toDateString()) {
      newStreak = 1;
    }

    let passQueueUpdate = {};
    if (user.passExpiry && user.passExpiry < now && (user.queuedPassHours || 0) > 0) {
      const newExpiry = new Date(now.getTime() + user.queuedPassHours * 60 * 60 * 1000);
      passQueueUpdate = {
        passExpiry: newExpiry,
        passEnhancedLimit: user.queuedEnhancedMsgs || 0,
        queuedPassHours: 0,
        queuedEnhancedMsgs: 0,
      };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: now,
        currentStreak: newStreak,
        ...dailyAllowanceUpdate,
        ...passQueueUpdate,
      },
    });

    if (!lastActive || (now.getTime() - lastActive.getTime()) / 60000 > 30) {
      await this.track('SESSION_START', userId);
    }
  }

  // 3. QUEST ENGINE (Atomic Increment to Avoid Race Conditions)
  async handleQuestTrigger(userId: string, trigger: QuestTrigger, increment: number = 1) {
    const activeQuests = await this.prisma.quest.findMany({
      where: { trigger, isActive: true },
    });

    for (const quest of activeQuests) {
      let progress = await this.prisma.userQuestProgress.findFirst({
        where: { userId, questId: quest.id },
      });

      if (!progress) {
        try {
          progress = await this.prisma.userQuestProgress.create({
            data: { userId, questId: quest.id, currentValue: 0 },
          });
        } catch {
          progress = await this.prisma.userQuestProgress.findFirst({
            where: { userId, questId: quest.id },
          });
        }
      }

      if (!progress || progress.isCompleted) continue;

      const updated = await this.prisma.userQuestProgress.update({
        where: { id: progress.id },
        data: {
          currentValue: { increment },
        },
      });

      if (!updated.isCompleted && updated.currentValue >= quest.goalValue) {
        await this.prisma.userQuestProgress.update({
          where: { id: progress.id },
          data: { isCompleted: true },
        });
      }
    }
  }

  // 4. QUEST CLAIMING (Atomic Check & Claim)
  async claimQuestReward(userId: string, progressIdOrQuestId: string) {
    let progress = await this.prisma.userQuestProgress.findUnique({
      where: { id: progressIdOrQuestId },
      include: { quest: true },
    });

    if (!progress) {
      progress = await this.prisma.userQuestProgress.findFirst({
        where: { questId: progressIdOrQuestId, userId },
        include: { quest: true },
      });
    }

    if (!progress || progress.userId !== userId) {
      throw new BadRequestException('Progress record not found.');
    }

    if (!progress.isCompleted) {
      throw new BadRequestException('Quest objective has not been reached yet.');
    }

    if (progress.isClaimed) {
      throw new BadRequestException('Reward already claimed.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Atomic condition: will fail if another concurrent request marked it claimed
      const claimResult = await tx.userQuestProgress.updateMany({
        where: {
          id: progress.id,
          isClaimed: false,
          isCompleted: true,
        },
        data: { isClaimed: true },
      });

      if (claimResult.count === 0) {
        throw new BadRequestException('Reward has already been claimed.');
      }

      if (progress.quest.rewardType === 'CREDITS') {
        const creditReward = Number(progress.quest.rewardValue) || 10;
        await tx.user.update({
          where: { id: userId },
          data: { walletBonus: { increment: creditReward } },
        });
        return { success: true, reward: creditReward, type: 'CREDITS' };
      } else {
        if (!progress.quest.lootBoxId) {
          throw new BadRequestException('Loot box is not configured for this quest.');
        }

        const box = await tx.lootBox.findUnique({ where: { id: progress.quest.lootBoxId } });
        if (!box) {
          throw new BadRequestException('Configured loot box does not exist.');
        }

        const count = Number(progress.quest.rewardValue) || 1;
        await this.lootService.addChestToInventory(userId, progress.quest.lootBoxId, count, tx);
        return { success: true, reward: count, type: 'CHEST', boxName: box.name };
      }
    });
  }

  // 5. STREAK STATUS
  async getStreakStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { streakClaims: true },
    });
    if (!user) return null;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - user.createdAt.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      isEligible: diffDays <= 7,
      currentDay: diffDays,
      claims: user.streakClaims,
      isClaimedToday: user.streakClaims.some((c) => c.dayNumber === diffDays),
    };
  }

  // 6. STREAK CLAIMING (Concurrent Duplicate Protected)
  async claimStreakReward(userId: string, dayNumber: number) {
    const status = await this.getStreakStatus(userId);
    if (!status?.isEligible || status.currentDay !== dayNumber) {
      throw new BadRequestException('Not eligible today.');
    }
    if (status.isClaimedToday) {
      throw new BadRequestException('Already claimed today.');
    }

    const tier = await this.prisma.rewardTier.findFirst({
      where: { daysRequired: dayNumber, isActive: true },
    });
    if (!tier) throw new BadRequestException('Reward tier not active.');

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.streakClaim.create({ data: { userId, dayNumber } });

        if (tier.rewardType === 'CREDITS') {
          const creditAmount = tier.creditsGiven || 0;
          await tx.user.update({
            where: { id: userId },
            data: { walletBonus: { increment: creditAmount } },
          });
          return { success: true, rewardAmount: creditAmount, type: 'CREDITS' };
        } else {
          if (!tier.lootBoxId) throw new BadRequestException('Loot box is missing for this tier.');
          await this.lootService.addChestToInventory(userId, tier.lootBoxId, 1, tx);
          return { success: true, rewardAmount: 1, type: 'CHEST', boxId: tier.lootBoxId };
        }
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Streak reward already claimed for this day.');
      }
      throw error;
    }
  }

  // 7. USER PROGRESS VIEW
  async getUserQuestProgress(userId: string) {
    const activeQuests = await this.prisma.quest.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const userProgress = await this.prisma.userQuestProgress.findMany({ where: { userId } });

    return activeQuests.map((quest) => {
      const progress = userProgress.find((p) => p.questId === quest.id);
      return {
        id: progress?.id || `temp-${quest.id}`,
        questId: quest.id,
        currentValue: progress?.currentValue || 0,
        isCompleted: progress?.isCompleted || false,
        isClaimed: progress?.isClaimed || false,
        quest,
      };
    });
  }

  // 8. ADMIN & BI METRICS
  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const financeSum = await this.prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalRevenuePaise = financeSum._sum.amount || 0;

    const [totalUsers, totalChars, pendingReports, todaySignups] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.character.count(),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
    ]);

    const recentTransactions = await this.prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
        plan: { select: { name: true } },
      },
    });

    const recentChatEvents = await this.prisma.analyticsEvent.findMany({
      where: { eventType: 'CHAT_MESSAGE' },
      select: { metadata: true },
      take: 200,
      orderBy: { createdAt: 'desc' },
    });

    const characterCountMap: Record<string, number> = {};
    for (const event of recentChatEvents) {
      const charId = (event.metadata as any)?.characterId;
      if (charId) {
        characterCountMap[charId] = (characterCountMap[charId] || 0) + 1;
      }
    }

    const trendingBots = Object.entries(characterCountMap)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalMessages = await this.prisma.analyticsEvent.count({ where: { eventType: 'CHAT_MESSAGE' } });
    const landings = await this.prisma.analyticsEvent.count({ where: { eventType: 'LANDING_PAGE_VIEW' } });
    const signups = await this.prisma.analyticsEvent.count({ where: { eventType: 'SIGNUP' } });

    return {
      summary: {
        totalUsers,
        totalMessages,
        todaySignups,
        stickiness: totalUsers > 0 ? Math.round((totalMessages / (totalUsers * 30)) * 100) : 0,
        totalRevenue: totalRevenuePaise / 100,
      },
      funnel: {
        landings,
        signups,
        conversionRate: landings > 0 ? Number(((signups / landings) * 100).toFixed(1)) : 0,
      },
      discovery: { trendingBots },
      finance: { recentTransactions },
    };
  }

  async activatePlan(userId: string, planId: string, isFromChest: boolean = false, tx?: any) {
    const prisma = tx || this.prisma;
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!plan || !user) {
      throw new BadRequestException('Plan or user not found');
    }

    const now = new Date();

    if (plan.type === 'TIME_PASS') {
      if (isFromChest && user.passExpiry && user.passExpiry > now) {
        return prisma.user.update({
          where: { id: userId },
          data: {
            queuedPassHours: { increment: plan.durationHours },
            queuedEnhancedMsgs: { increment: plan.enhancedMessages },
          },
        });
      }

      const expiry = new Date(now.getTime() + plan.durationHours * 60 * 60 * 1000);
      return prisma.user.update({
        where: { id: userId },
        data: {
          passExpiry: expiry,
          passEnhancedLimit: plan.enhancedMessages,
        },
      });
    } else {
      return prisma.user.update({
        where: { id: userId },
        data: {
          walletEnhanced: { increment: plan.enhancedMessages },
        },
      });
    }
  }

  async createQuest(data: any) {
    return this.prisma.quest.create({
      data: {
        title: data.title,
        description: data.description || `Complete the ${data.title} objective`,
        type: data.type,
        trigger: data.trigger,
        goalValue: Number(data.goalValue) || 1,
        rewardType: data.rewardType,
        rewardValue: Number(data.rewardValue) || 0,
        lootBoxId: data.lootBoxId || null,
      },
    });
  }

  async deleteQuest(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userQuestProgress.deleteMany({ where: { questId: id } });
      return tx.quest.delete({ where: { id } });
    });
  }

  async getFinanceStats() {
    const transactions = await this.prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } }, plan: true },
    });

    const totalRevenue = await this.prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    return {
      totalRevenuePaise: totalRevenue._sum.amount || 0,
      recentTransactions: transactions,
    };
  }

  async getAllQuestsAdmin() {
    return this.prisma.quest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async toggleUserBan(id: string, isBanned: boolean, reason?: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isBanned, banReason: reason },
    });
  }

  async getAllUsersAdmin() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        banReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPlansAdmin() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async createPlan(data: any) {
    return this.prisma.plan.create({ data });
  }

  async getReports() {
    return this.prisma.report.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingReview() {
    return this.prisma.character.findMany({
      where: { status: 'PENDING' },
      include: { creator: { select: { username: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateSystemConfig(key: string, value: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async updateStatus(id: string, status: any, note?: string) {
    return this.prisma.character.update({
      where: { id },
      data: { status, adminNote: note, isPublic: status === 'PUBLIC' },
    });
  }

  async createRewardTier(data: any) {
    return this.prisma.rewardTier.create({ data });
  }

  async deleteRewardTier(id: string) {
    return this.prisma.rewardTier.delete({ where: { id } });
  }

  async getActiveRewards() {
    return this.prisma.rewardTier.findMany({
      where: { isActive: true },
      orderBy: { daysRequired: 'asc' },
    });
  }
}