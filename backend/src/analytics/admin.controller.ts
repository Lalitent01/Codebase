import { Controller, Get, UseGuards, Req, ForbiddenException, Patch, Body, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private analyticsService: AnalyticsService) {}

  private checkAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('You do not have admin privileges');
    }
  }

  @Get('stats')
  async getStats(@Req() req) {
    this.checkAdmin(req);
    return this.analyticsService.getAdminStats();
  }

  @Patch('config')
  async updateConfig(@Body() body: { key: string; value: string }, @Req() req) {
    this.checkAdmin(req);
    return this.analyticsService.updateSystemConfig(body.key, body.value);
  }

  @Post('plans')
  async createPlan(@Body() body: any, @Req() req) {
    this.checkAdmin(req);
    return this.analyticsService.createPlan(body);
  }

  @Get('plans')
  async getPlans(@Req() req) {
    this.checkAdmin(req);
    return this.analyticsService.getAllPlansAdmin();
  }

  @Get('reports')
  async getReports(@Req() req) {
    this.checkAdmin(req);
    return this.analyticsService.getReports();
  }
}