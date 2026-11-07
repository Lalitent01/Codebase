import { Module } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { PrismaService } from '../prisma.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [CharactersController],
  providers: [CharactersService, PrismaService],
  exports: [CharactersService],
})
export class CharactersModule {}