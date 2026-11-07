import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { LootService } from './loot.service';
import { OptionalJwtAuthGuard } from './guards/optional-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly lootService: LootService,
  ) {}

  @Get('ping')
  ping() {
    return { status: 'Analytics Controller is Live' };
  }

  // Optional authentication: tracks anonymous guests or logged-in users
  @UseGuards(OptionalJwtAuthGuard)
  @Post('track')
  async trackEvent(
    @Body() body: { eventType: string; metadata?: any },
    @Req() req: any,
  ) {
    return this.analyticsService.track(body.eventType, req.user?.id, body.metadata);
  }

  // Public endpoint for guest-accessible pricing plans
  @Get('public/plans')
  async getPublicPlans() {
    return this.analyticsService.getAllPlansAdmin();
  }

  @Get('rewards/active')
  async getActiveRewards() {
    return this.analyticsService.getActiveRewards();
  }

  // --- AUTHENTICATED USER OPERATIONS ---

  @UseGuards(AuthGuard('jwt'))
  @Post('heartbeat')
  async heartbeat(@Req() req: any) {
    return this.analyticsService.heartbeat(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('streak/status')
  async getStreakStatus(@Req() req: any) {
    return this.analyticsService.getStreakStatus(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('streak/claim')
  async claimStreakReward(@Req() req: any, @Body() body: { day: number }) {
    return this.analyticsService.claimStreakReward(req.user.id, body.day);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('quests/my-progress')
  async getMyProgress(@Req() req: any) {
    return this.analyticsService.getUserQuestProgress(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('quests/claim/:id')
  async claimQuest(@Param('id') id: string, @Req() req: any) {
    return this.analyticsService.claimQuestReward(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('vault/inventory')
  async getMyInventory(@Req() req: any) {
    return this.lootService.getUserInventory(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('vault/open')
  async openBox(@Body() body: { boxId: string }, @Req() req: any) {
    return this.lootService.openChest(req.user.id, body.boxId);
  }
}