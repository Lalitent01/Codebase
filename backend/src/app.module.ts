import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { CharactersModule } from './characters/characters.module';
import { PaymentsModule } from './payments/payments.module';
import { CacheModule } from './cache/cache.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Global() // Makes PrismaService available across all modules without re-importing
@Module({
  imports: [
    AuthModule,
    UsersModule,
    ChatModule,
    AiModule,
    CharactersModule,
    PaymentsModule,
    CacheModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [PrismaService, AppService],
  exports: [PrismaService],
})
export class AppModule {}