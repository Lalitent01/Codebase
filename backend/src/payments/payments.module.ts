import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ConfigModule, AnalyticsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}