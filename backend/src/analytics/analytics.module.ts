import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AdminController } from './admin.controller';
import { LootService } from './loot.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AdminController, AnalyticsController],
  providers: [AnalyticsService, LootService, PrismaService],
  exports: [AnalyticsService, LootService],
})
export class AnalyticsModule {}