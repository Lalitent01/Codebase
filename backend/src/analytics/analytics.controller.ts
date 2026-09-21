import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { LootService } from './loot.service'; 
import { AuthGuard } from '@nestjs/passport';

@Controller('analytics') // Base path: /api/analytics
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private lootService: LootService
  ) {}

  @Get('ping')
  ping() {
    return { status: 'Analytics Controller is Live' };
  }

  // --- PUBLIC TRACKING ---

  @Post('track')
  async trackEvent(@Body() body: { eventType: string, metadata?: any }, @Req() req) {
    return this.analyticsService.track(body.eventType, req.user?.id, body.metadata);
  }

  // --- USER PROGRESS & REWARDS ---

  @UseGuards(AuthGuard('jwt'))
  @Post('heartbeat')
  async heartbeat(@Req() req) {
    return this.analyticsService.heartbeat(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('streak/status')
  async getStreakStatus(@Req() req) {
    return this.analyticsService.getStreakStatus(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('streak/claim')
  async claimReward(@Req() req, @Body() body: { day: number }) {
    return this.analyticsService.claimStreakReward(req.user.id, body.day);
  }

  @Get('rewards/active') 
  async getActiveRewards() {
    return this.analyticsService.getActiveRewards();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('quests/my-progress')
  async getMyProgress(@Req() req) {
    return this.analyticsService.getUserQuestProgress(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('quests/claim/:id')
  async claimQuest(@Param('id') id: string, @Req() req) {
    return this.analyticsService.claimQuestReward(req.user.id, id);
  }

  // --- USER VAULT (LOOT) ---

  @UseGuards(AuthGuard('jwt'))
  @Get('vault/inventory')
  async getMyInventory(@Req() req) {
    return this.lootService.getUserInventory(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('vault/open')
  async open(@Body() body: { boxId: string }, @Req() req) {
    return this.lootService.openChest(req.user.id, body.boxId);
  }

  // --- ADMIN MANAGEMENT (Requires ADMIN role) ---

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/stats')
  async getStats(@Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.getAdminStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/reports')
  async getReports(@Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.getReports();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/pending-review')
  async getPendingBots(@Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.getPendingReview();
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/characters/:id/status')
  async updateCharacterStatus(
    @Param('id') id: string,
    @Body() body: { status: 'PUBLIC' | 'REJECTED', note?: string },
    @Req() req
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.updateStatus(id, body.status, body.note);
  }

  // --- ADMIN USERS (Fixed the 404) ---
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/users')
  async getAllUsers(@Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.getAllUsersAdmin();
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/users/:id/ban')
  async toggleUserBan(
    @Param('id') id: string, 
    @Body() body: { isBanned: boolean, reason?: string },
    @Req() req
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.toggleUserBan(id, body.isBanned, body.reason);
  }

  // --- ADMIN QUESTS ---

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/quests')
  async getAllQuests(@Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.getAllQuestsAdmin();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/quests')
  async createQuest(@Body() body: any, @Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.createQuest(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/quests/:id')
  async deleteQuest(@Param('id') id: string, @Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.deleteQuest(id);
  }

  // --- ADMIN PLANS ---
  // --- PUBLIC PLAN FETCH (No Guard) ---
  @Get('public/plans')
  async getPublicPlans() {
    // This calls the same service logic but is accessible to guests
    return this.analyticsService.getAllPlansAdmin(); 
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/plans')
  async getPlans(@Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.getAllPlansAdmin();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/plans')
  async createPlan(@Body() body: any, @Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.createPlan(body);
  }

  // --- ADMIN REWARDS & LOOT BOXES ---

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/rewards')
  async createRewardTier(@Body() body: any, @Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.createRewardTier(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/rewards/:id')
  async deleteRewardTier(@Param('id') id: string, @Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.deleteRewardTier(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/loot-boxes')
  async createBox(@Body() body: any, @Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.lootService.createLootBox(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/loot-boxes/:id')
  async deleteBox(@Param('id') id: string, @Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.lootService.deleteLootBox(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/loot-boxes/:id/items')
  async setBoxItems(@Param('id') id: string, @Body() body: { items: any[] }, @Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.lootService.setLootItems(id, body.items);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/loot-items')
  async addItem(@Body() body: any, @Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.lootService.addLootItem(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/available-boxes')
  async getAvailableBoxes(@Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.lootService.getAllBoxes();
  }
}