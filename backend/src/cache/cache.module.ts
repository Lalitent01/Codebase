import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global() // Makes CacheService accessible across all modules without re-importing
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}