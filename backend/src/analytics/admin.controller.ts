import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './guards/admin.guard';
import { AnalyticsService } from './analytics.service';
import { LootService } from './loot.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly lootService: LootService,
  ) {}

  // --- STATS & CONFIG ---

  @Get('stats')
  async getStats() {
    return this.analyticsService.getAdminStats();
  }

  @Get('finance')
  async getFinanceStats() {
    return this.analyticsService.getFinanceStats();
  }

  @Patch('config')
  async updateConfig(@Body() body: { key: string; value: string }) {
    return this.analyticsService.updateSystemConfig(body.key, body.value);
  }

  @Get('reports')
  async getReports() {
    return this.analyticsService.getReports();
  }

  // --- USERS & CHARACTERS ---

  @Get('users')
  async getAllUsers() {
    return this.analyticsService.getAllUsersAdmin();
  }

  @Patch('users/:id/ban')
  async toggleUserBan(
    @Param('id') id: string,
    @Body() body: { isBanned: boolean; reason?: string },
  ) {
    return this.analyticsService.toggleUserBan(id, body.isBanned, body.reason);
  }

  @Get('pending-review')
  async getPendingReview() {
    return this.analyticsService.getPendingReview();
  }

  @Patch('characters/:id/status')
  async updateCharacterStatus(
    @Param('id') id: string,
    @Body() body: { status: 'PUBLIC' | 'REJECTED'; note?: string },
  ) {
    return this.analyticsService.updateStatus(id, body.status, body.note);
  }

  // --- MONETIZATION & PLANS ---

  @Get('plans')
  async getPlans() {
    return this.analyticsService.getAllPlansAdmin();
  }

  @Post('plans')
  async createPlan(@Body() body: any) {
    return this.analyticsService.createPlan(body);
  }

  // --- QUESTS ---

  @Get('quests')
  async getAllQuests() {
    return this.analyticsService.getAllQuestsAdmin();
  }

  @Post('quests')
  async createQuest(@Body() body: any) {
    return this.analyticsService.createQuest(body);
  }

  @Delete('quests/:id')
  async deleteQuest(@Param('id') id: string) {
    return this.analyticsService.deleteQuest(id);
  }

  // --- REWARD TIERS ---

  @Post('rewards')
  async createRewardTier(@Body() body: any) {
    return this.analyticsService.createRewardTier(body);
  }

  @Delete('rewards/:id')
  async deleteRewardTier(@Param('id') id: string) {
    return this.analyticsService.deleteRewardTier(id);
  }

  // --- LOOT BOXES & ITEMS ---

  @Get('available-boxes')
  async getAvailableBoxes() {
    return this.lootService.getAllBoxes();
  }

  @Post('loot-boxes')
  async createBox(@Body() body: { name: string; color: string }) {
    return this.lootService.createLootBox(body);
  }

  @Delete('loot-boxes/:id')
  async deleteBox(@Param('id') id: string) {
    return this.lootService.deleteLootBox(id);
  }

  @Post('loot-boxes/:id/items')
  async setBoxItems(@Param('id') id: string, @Body() body: { items: any[] }) {
    return this.lootService.setLootItems(id, body.items);
  }

  @Post('loot-items')
  async addItem(
    @Body()
    body: {
      boxId: string;
      label: string;
      type: string;
      value: number;
      weight: number;
      planId?: string;
    },
  ) {
    return this.lootService.addLootItem(body);
  }
}