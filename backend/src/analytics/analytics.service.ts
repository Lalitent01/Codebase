import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { LootService } from './loot.service';
import { PrismaService } from '../prisma.service';
import { QuestTrigger } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LootService))
    private lootService: LootService,
  ) {}

  // 1. GENERIC TRACKING
  async track(eventType: string, userId?: string, metadata?: any) {
    try {
      await this.prisma.analyticsEvent.create({
        data: { eventType, userId, metadata },
      });
    } catch (e) {
      console.error('Analytics tracking failed', e);
    }
  }

  // 2. ECONOMY HEARTBEAT (Daily Resets & Streaks)
  async heartbeat(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const now = new Date();
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
    const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : new Date(0);

    const isNewDay = now.toDateString() !== lastReset.toDateString();

    // Reset daily allowance if new day
    let dailyAllowanceUpdate = {};
    if (isNewDay) {
      const config = await this.prisma.systemConfig.findUnique({ where: { key: 'DAILY_FREE_LIMIT' } });
      const limit = config && !isNaN(parseInt(config.value)) ? parseInt(config.value) : 30;

      dailyAllowanceUpdate = {
        walletDaily: limit,
        lastDailyReset: now,
      };
      console.log(`[ECONOMY] Daily reset for ${user.username}. Allowance: ${limit}`);
    }

    // Streak logic (Consecutive days)
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

    // Queued Pass activation check
    let passQueueUpdate = {};
    if (user.passExpiry && user.passExpiry < now && (user.queuedPassHours || 0) > 0) {
      console.log(`[ECONOMY] Activating queued pass for ${user.username}`);
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

    // Session Start Tracking
    if (!lastActive || (now.getTime() - lastActive.getTime()) / 60000 > 30) {
      await this.track('SESSION_START', userId);
    }
  }

  // 3. QUEST ENGINE (Triggering & Progress)
  async handleQuestTrigger(userId: string, trigger: QuestTrigger, increment: number = 1) {
    const activeQuests = await this.prisma.quest.findMany({
      where: { trigger, isActive: true },
    });

    for (const quest of activeQuests) {
      let progress = await this.prisma.userQuestProgress.findFirst({
        where: { userId, questId: quest.id },
      });

      if (!progress) {
        progress = await this.prisma.userQuestProgress.create({
          data: { userId, questId: quest.id, currentValue: 0 },
        });
      }

      if (progress.isCompleted) continue;

      const newValue = progress.currentValue + increment;
      const isNowFinished = newValue >= quest.goalValue;

      await this.prisma.userQuestProgress.update({
        where: { id: progress.id },
        data: {
          currentValue: newValue,
          isCompleted: isNowFinished,
        },
      });

      if (isNowFinished) {
        console.log(`[QUEST] User ${userId} completed "${quest.title}". Ready for claim.`);
      }
    }
  }

  // 4. QUEST CLAIMING (Updated: Supports progressId OR questId with Terminal Logging)
  async claimQuestReward(userId: string, progressIdOrQuestId: string) {
    console.log(`[QUEST] User ${userId} requested claim for: ${progressIdOrQuestId}`);

    // Try finding by progress ID first; if not found, find by questId + userId
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
      console.error(`[QUEST CLAIM FAILED] No progress record found for user ${userId} and ID ${progressIdOrQuestId}`);
      throw new BadRequestException('Progress record not found.');
    }

    if (!progress.isCompleted) {
      throw new BadRequestException('Quest objective has not been reached yet.');
    }

    if (progress.isClaimed) {
      throw new BadRequestException('Reward already claimed.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Mark as claimed
      await tx.userQuestProgress.update({
        where: { id: progress.id },
        data: { isClaimed: true },
      });

      if (progress.quest.rewardType === 'CREDITS') {
        const creditReward = Number(progress.quest.rewardValue) || 10;
        await tx.user.update({
          where: { id: userId },
          data: { walletBonus: { increment: creditReward } },
        });

        console.log(`✅ [QUEST CLAIMED] Successfully awarded ${creditReward} credits to user ${userId} for "${progress.quest.title}"`);
        return { success: true, reward: creditReward, type: 'CREDITS' };
      } else {
        // Reward is a Chest
        if (!progress.quest.lootBoxId) {
          console.error(`[QUEST CLAIM FAILED] Quest "${progress.quest.title}" has rewardType CHEST but lootBoxId is null`);
          throw new BadRequestException('Loot box is not configured for this quest.');
        }

        const box = await tx.lootBox.findUnique({ where: { id: progress.quest.lootBoxId } });
        if (!box) {
          throw new BadRequestException('Configured loot box does not exist.');
        }

        const count = Number(progress.quest.rewardValue) || 1;
        await this.lootService.addChestToInventory(userId, progress.quest.lootBoxId, count, tx);

        console.log(`✅ [QUEST CLAIMED] Successfully awarded ${count}x "${box.name}" Chest to user ${userId} for "${progress.quest.title}"`);
        return { success: true, reward: count, type: 'CHEST', boxName: box.name };
      }
    });
  }

  // 5. STREAK STATUS (Day 1-7 Welcome)
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

  // 6. STREAK CLAIMING
  async claimStreakReward(userId: string, dayNumber: number) {
    const status = await this.getStreakStatus(userId);
    if (!status?.isEligible || status.currentDay !== dayNumber) throw new BadRequestException('Not eligible today.');
    if (status.isClaimedToday) throw new BadRequestException('Already claimed today.');

    const tier = await this.prisma.rewardTier.findFirst({
      where: { daysRequired: dayNumber, isActive: true },
    });
    if (!tier) throw new BadRequestException('Reward tier not active.');

    return this.prisma.$transaction(async (tx) => {
      await tx.streakClaim.create({ data: { userId, dayNumber } });

      if (tier.rewardType === 'CREDITS') {
        const creditAmount = tier.creditsGiven || 0;
        await tx.user.update({
          where: { id: userId },
          data: { walletBonus: { increment: creditAmount } },
        });
        console.log(`✅ [STREAK CLAIMED] User ${userId} claimed Day ${dayNumber} (+${creditAmount} credits)`);
        return { success: true, rewardAmount: creditAmount, type: 'CREDITS' };
      } else {
        if (!tier.lootBoxId) throw new BadRequestException('Loot box is missing for this tier.');
        await this.lootService.addChestToInventory(userId, tier.lootBoxId, 1, tx);
        console.log(`✅ [STREAK CLAIMED] User ${userId} claimed Day ${dayNumber} (Chest ${tier.lootBoxId})`);
        return { success: true, rewardAmount: 1, type: 'CHEST', boxId: tier.lootBoxId };
      }
    });
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

  // 8. ADMIN PANEL & BI
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

    // In-memory aggregation to avoid grouping on JSON fields in Prisma
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
    return this.prisma.report.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
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
    return this.prisma.rewardTier.findMany({ where: { isActive: true }, orderBy: { daysRequired: 'asc' } });
  }
}