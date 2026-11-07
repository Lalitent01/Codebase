import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { CharactersModule } from './characters/characters.module';
import { PaymentsModule } from './payments/payments.module';
import { CacheModule } from './cache/cache.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Global()
@Module({
  imports: [
    // Global ConfigModule provides ConfigService to all modules
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
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