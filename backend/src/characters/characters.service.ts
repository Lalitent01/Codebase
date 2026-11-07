import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async create(userId: string, data: any) {
    const requiredFields = [
      { key: 'name', label: 'Display Name' },
      { key: 'description', label: 'Short Hook' },
      { key: 'personality', label: 'Core Personality' },
      { key: 'greeting', label: 'First Greeting' },
    ];

    for (const field of requiredFields) {
      if (!data[field.key] || typeof data[field.key] !== 'string' || data[field.key].trim() === '') {
        throw new BadRequestException(`${field.label} is mandatory.`);
      }
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : data.tags
      ? [data.tags.trim().toLowerCase()]
      : [];

    if (tags.length === 0) {
      throw new BadRequestException('At least one tag is required.');
    }

    const initialStatus = data.isPublicRequest ? 'PENDING' : 'PRIVATE';

    const character = await this.prisma.character.create({
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        avatar: data.avatar || null,
        personality: data.personality.trim(),
        greeting: data.greeting.trim(),
        scenario: data.scenario?.trim() || null,
        speakingStyle: data.speakingStyle?.trim() || null,
        exampleDialogue: data.exampleDialogue?.trim() || null,
        tags,
        gender: data.gender,
        language: data.language || 'ENGLISH',
        unfiltered: Boolean(data.unfiltered),
        status: initialStatus,
        isPublic: false,
        creatorId: userId,
      },
    });

    await this.cacheService.delByPattern('discovery:*');

    return character;
  }

  async update(id: string, userId: string, data: any) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');
    if (character.creatorId !== userId) throw new ForbiddenException('You do not own this character');

    let newStatus = character.status;
    if (data.isPublicRequest !== undefined) {
      if (character.status === 'PRIVATE' && data.isPublicRequest) {
        newStatus = 'PENDING';
      } else if (!data.isPublicRequest) {
        newStatus = 'PRIVATE';
      } else if (character.status === 'REJECTED' && data.isPublicRequest) {
        newStatus = 'PENDING';
      }
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : character.tags;

    const updated = await this.prisma.character.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : character.name,
        description: data.description !== undefined ? data.description.trim() : character.description,
        personality: data.personality !== undefined ? data.personality.trim() : character.personality,
        avatar: data.avatar !== undefined ? data.avatar : character.avatar,
        greeting: data.greeting !== undefined ? data.greeting.trim() : character.greeting,
        scenario: data.scenario !== undefined ? data.scenario?.trim() : character.scenario,
        speakingStyle: data.speakingStyle !== undefined ? data.speakingStyle?.trim() : character.speakingStyle,
        exampleDialogue: data.exampleDialogue !== undefined ? data.exampleDialogue?.trim() : character.exampleDialogue,
        tags,
        gender: data.gender !== undefined ? data.gender : character.gender,
        language: data.language !== undefined ? data.language : character.language,
        unfiltered: data.unfiltered !== undefined ? Boolean(data.unfiltered) : character.unfiltered,
        status: newStatus,
        isPublic: newStatus === 'PUBLIC',
      },
    });

    await this.cacheService.del(`character:${id}`);
    await this.cacheService.delByPattern('discovery:*');

    return updated;
  }

  async remove(id: string, userId: string) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');
    if (character.creatorId !== userId) throw new ForbiddenException('You do not own this character');

    return this.prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({ where: { chat: { characterId: id } } });
      await tx.chat.deleteMany({ where: { characterId: id } });
      await tx.like.deleteMany({ where: { characterId: id } });
      const deleted = await tx.character.delete({ where: { id } });

      await this.cacheService.del(`character:${id}`);
      await this.cacheService.delByPattern('discovery:*');

      return deleted;
    });
  }

  async getDiscovery(query: {
    userId?: string | null;
    tags?: string[];
    search?: string;
    sort?: string;
    gender?: any;
    language?: any;
    unfiltered?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      tags,
      search,
      sort = 'new', // Default to 'new' universal chronological feed
      gender,
      language,
      unfiltered = false, // Defaults strictly to SFW (false) unless explicitly requested
      page = 1,
      limit = 12,
    } = query;

    const parsedLimit = Math.min(Math.max(1, Number(limit) || 12), 50);
    const parsedPage = Math.max(1, Number(page) || 1);
    const offset = (parsedPage - 1) * parsedLimit;

    // Strict boolean check: 18+ items are filtered out in standard SFW mode
    const isUnfilteredQuery = Boolean(unfiltered);

    // Cache key for standard non-personalized queries
    const isStandardQuery = !search && (sort !== 'recommended' || !userId);
    const cacheKey = `discovery:${sort}:${gender}:${language}:${isUnfilteredQuery}:${tags?.join(',')}:${parsedPage}:${parsedLimit}`;

    if (isStandardQuery) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) return cached;
    }

    const where: any = { 
      status: 'PUBLIC',
      unfiltered: isUnfilteredQuery, // Always enforce true or false
    };

    if (gender && gender !== 'ALL') where.gender = gender;
    if (language && language !== 'ALL') where.language = language;
    if (tags && tags.length > 0) where.tags = { hasSome: tags };

    if (search) {
      const s = search.toLowerCase().trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { tags: { hasSome: [s] } },
      ];
    }

    const totalCount = await this.prisma.character.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / parsedLimit));

    let paginatedCharacters: any[] = [];

    // DATABASE-LEVEL PAGINATION: Use native Postgres ordering for top and new queries
    if (!search && (sort === 'new' || sort === 'top' || (!userId && sort === 'recommended'))) {
      const orderBy = sort === 'new' || (!userId && sort === 'recommended')
        ? { createdAt: 'desc' as const } 
        : { chatCount: 'desc' as const };

      paginatedCharacters = await this.prisma.character.findMany({
        where,
        skip: offset,
        take: parsedLimit,
        orderBy,
        include: { creator: { select: { username: true } } },
      });
    } else {
      // PERSONALIZED / SEARCH RANKING: Bounded pool to preserve memory
      const candidates = await this.prisma.character.findMany({
        where,
        take: 150,
        orderBy: { chatCount: 'desc' },
        include: { creator: { select: { username: true } } },
      });

      let userPreferredTags: string[] = [];
      if (userId && sort === 'recommended') {
        try {
          const recentEvents = await this.prisma.analyticsEvent.findMany({
            where: { userId, eventType: 'CHAT_MESSAGE' },
            take: 15,
            orderBy: { createdAt: 'desc' },
          });

          const interactedIds = recentEvents
            .map((e) => (e.metadata as any)?.characterId)
            .filter(Boolean);

          if (interactedIds.length > 0) {
            const lastChars = await this.prisma.character.findMany({
              where: { id: { in: interactedIds } },
              select: { tags: true },
            });
            userPreferredTags = [...new Set(lastChars.flatMap((c) => c.tags))];
          }
        } catch (e: any) {
          this.logger.warn(`Recommendation fallback triggered: ${e.message}`);
        }
      }

      const sorted = candidates.sort((a, b) => {
        if (search) {
          const s = search.toLowerCase().trim();
          const getScore = (c: any) => {
            let score = 0;
            const name = c.name.toLowerCase();
            if (name === s) score += 1000;
            else if (name.includes(s)) score += 500;
            score += c.tags.filter((t: string) => t.toLowerCase().includes(s)).length * 100;
            return score;
          };
          return getScore(b) - getScore(a);
        }

        const matchA = a.tags.filter((t: any) => userPreferredTags.includes(t)).length;
        const matchB = b.tags.filter((t: any) => userPreferredTags.includes(t)).length;
        if (matchA === matchB) return (b.chatCount || 0) - (a.chatCount || 0);
        return matchB - matchA;
      });

      paginatedCharacters = sorted.slice(offset, offset + parsedLimit);
    }

    const payload = {
      characters: paginatedCharacters,
      totalCount,
      totalPages,
      currentPage: parsedPage,
    };

    if (isStandardQuery) {
      await this.cacheService.set(cacheKey, payload, 45); // 45s TTL
    }

    return payload;
  }

  async findOne(id: string, requestingUserId?: string | null) {
    const cacheKey = `character:${id}`;

    let character = await this.cacheService.get(cacheKey);

    if (!character) {
      character = await this.prisma.character.findUnique({
        where: { id },
        include: { creator: { select: { username: true } } },
      });

      if (!character) throw new NotFoundException('Character not found');

      if (character.status === 'PUBLIC') {
        await this.cacheService.set(cacheKey, character, 300);
      }
    }

    if (character.status !== 'PUBLIC' && character.creatorId !== requestingUserId) {
      throw new NotFoundException('Character not found');
    }

    return character;
  }

  async getCreatorProfile(username: string) {
    const creator = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!creator) return null;

    const bots = await this.prisma.character.findMany({
      where: {
        creatorId: creator.id,
        status: 'PUBLIC',
      },
      orderBy: { chatCount: 'desc' },
    });

    return { creator, bots };
  }

  async toggleLike(userId: string, characterId: string) {
    const character = await this.prisma.character.findUnique({ where: { id: characterId } });
    if (!character) throw new NotFoundException('Character not found');

    const existingLike = await this.prisma.like.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });

    if (existingLike) {
      try {
        await this.prisma.$transaction([
          this.prisma.like.delete({ where: { id: existingLike.id } }),
          this.prisma.character.update({
            where: { id: characterId },
            data: { likesCount: { decrement: 1 } },
          }),
        ]);
      } catch {}
      return { liked: false };
    } else {
      try {
        await this.prisma.$transaction([
          this.prisma.like.create({ data: { userId, characterId } }),
          this.prisma.character.update({
            where: { id: characterId },
            data: { likesCount: { increment: 1 } },
          }),
        ]);
        return { liked: true };
      } catch (err: any) {
        if (err.code === 'P2002') return { liked: true };
        throw err;
      }
    }
  }

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException('You cannot follow yourself');

    const targetUser = await this.prisma.user.findUnique({ where: { id: followingId } });
    if (!targetUser) throw new NotFoundException('User to follow not found');

    const existingFollow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existingFollow) {
      try {
        await this.prisma.follow.delete({ where: { id: existingFollow.id } });
      } catch {}
      return { followed: false };
    } else {
      try {
        await this.prisma.follow.create({ data: { followerId, followingId } });
        return { followed: true };
      } catch (err: any) {
        if (err.code === 'P2002') return { followed: true };
        throw err;
      }
    }
  }

  async getLikedCharacters(userId: string) {
    const likes = await this.prisma.like.findMany({
      where: { userId },
      include: {
        character: {
          include: { creator: { select: { username: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return likes.map((l) => l.character).filter(Boolean);
  }

  async findUserCharacters(userId: string) {
    return this.prisma.character.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFollowingList(userId: string) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });
  }

  async getRecentChats(userId: string) {
    const recentChats = await this.prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      distinct: ['characterId'],
      take: 20,
      include: {
        character: {
          include: {
            creator: { select: { username: true } },
          },
        },
      },
    });

    return recentChats
      .filter((chat) => chat.character !== null)
      .map((chat) => ({
        ...chat.character,
        chatId: chat.id,
        lastInteraction: chat.updatedAt,
      }));
  }
}