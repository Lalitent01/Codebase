import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PersonasService } from './personas.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [UsersService, PersonasService, PrismaService],
  exports: [UsersService, PersonasService],
})
export class UsersModule {}