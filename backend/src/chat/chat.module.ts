import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AiModule } from '../ai/ai.module';
import { CacheModule } from '../cache/cache.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CharactersModule } from '../characters/characters.module';
import { PrismaService } from '../prisma.service';
import { ModerationService } from '../moderation/moderation.service'; // 1. Import it

@Module({
  imports: [AiModule, CacheModule, AnalyticsModule, CharactersModule],
  providers: [ChatService,ModerationService, PrismaService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}