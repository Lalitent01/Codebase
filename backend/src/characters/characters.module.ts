import { Module } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [CharactersService, PrismaService],
  controllers: [CharactersController],
  exports: [CharactersService],
})
export class CharactersModule {}