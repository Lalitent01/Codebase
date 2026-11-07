import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { EmbeddingService } from './embedding.service';

@Module({
  imports: [ConfigModule],
  providers: [AiService, EmbeddingService],
  exports: [AiService, EmbeddingService],
})
export class AiModule {}