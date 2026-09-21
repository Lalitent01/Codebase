import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AnalyticsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}