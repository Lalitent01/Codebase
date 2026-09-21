import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CharactersService } from './characters.service';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@Controller('characters')
export class CharactersController {
  constructor(private charactersService: CharactersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Req() req: any, @Body() body: any) {
    if (!req.user?.isEmailVerified) {
      throw new ForbiddenException('Please verify your email to create characters.');
    }
    return this.charactersService.create(req.user.id, body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.charactersService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.charactersService.remove(id, req.user.id);
  }

  @Get('my-collection')
  @UseGuards(AuthGuard('jwt'))
  async getMyCollection(@Req() req: any) {
    return this.charactersService.findUserCharacters(req.user.id);
  }

  @Get('creator/:username')
  async getCreatorProfile(@Param('username') username: string) {
    const result = await this.charactersService.getCreatorProfile(username);
    if (!result) throw new NotFoundException('Creator not found');
    return result;
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getDiscovery(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('tags') tags?: string | string[],
    @Query('sort') sort?: string,
    @Query('gender') gender?: any,
    @Query('language') language?: any,
    @Query('unfiltered') unfiltered?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tagsArray = typeof tags === 'string' ? [tags] : tags;

    return this.charactersService.getDiscovery({
      userId: req.user?.id || null,
      search,
      tags: tagsArray,
      sort: sort || 'recommended',
      gender,
      language,
      unfiltered: unfiltered === 'true',
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '12', 10),
    });
  }

  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  async toggleLike(@Param('id') id: string, @Req() req: any) {
    return this.charactersService.toggleLike(req.user.id, id);
  }

  @Post('creator/:id/follow')
  @UseGuards(AuthGuard('jwt'))
  async toggleFollow(@Param('id') id: string, @Req() req: any) {
    return this.charactersService.toggleFollow(req.user.id, id);
  }

  @Get('following')
  @UseGuards(AuthGuard('jwt'))
  async getFollowing(@Req() req: any) {
    return this.charactersService.getFollowingList(req.user.id);
  }

  @Get('favorites')
  @UseGuards(AuthGuard('jwt'))
  async getFavorites(@Req() req: any) {
    return this.charactersService.getLikedCharacters(req.user.id);
  }

  @Get('recent')
  @UseGuards(AuthGuard('jwt'))
  async getRecent(@Req() req: any) {
    return this.charactersService.getRecentChats(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }
}