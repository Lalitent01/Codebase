import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { EmbeddingService } from './embedding.service';

@Module({
  providers: [AiService, EmbeddingService],
  exports: [AiService, EmbeddingService], // <--- ENSURE BOTH ARE HERE
})
export class AiModule {}