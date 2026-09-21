import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CharactersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: any) {
    const requiredFields = [
      { key: 'name', label: 'Display Name' },
      { key: 'description', label: 'Short Hook' },
      { key: 'personality', label: 'Core Personality' },
      { key: 'greeting', label: 'First Greeting' },
    ];

    for (const field of requiredFields) {
      if (!data[field.key] || data[field.key].trim() === '') {
        throw new BadRequestException(`${field.label} is mandatory.`);
      }
    }

    const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [];
    if (tags.length === 0) {
      throw new BadRequestException('At least one tag is required.');
    }

    const initialStatus = data.isPublicRequest ? 'PENDING' : 'PRIVATE';

    return this.prisma.character.create({
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
  }

  async update(id: string, userId: string, data: any) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');
    if (character.creatorId !== userId) throw new ForbiddenException('You do not own this character');

    // Only modify status if the user explicitly requested a change in visibility
    let newStatus = character.status;
    if (data.isPublicRequest !== undefined) {
      if (character.status === 'PUBLIC' || character.status === 'REJECTED') {
        newStatus = data.isPublicRequest ? 'PENDING' : 'PRIVATE';
      } else if (character.status === 'PRIVATE' && data.isPublicRequest) {
        newStatus = 'PENDING';
      }
    }

    const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : character.tags;

    return this.prisma.character.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : character.name,
        description: data.description !== undefined ? data.description : character.description,
        personality: data.personality !== undefined ? data.personality : character.personality,
        avatar: data.avatar !== undefined ? data.avatar : character.avatar,
        greeting: data.greeting !== undefined ? data.greeting : character.greeting,
        scenario: data.scenario !== undefined ? data.scenario : character.scenario,
        speakingStyle: data.speakingStyle !== undefined ? data.speakingStyle : character.speakingStyle,
        exampleDialogue: data.exampleDialogue !== undefined ? data.exampleDialogue : character.exampleDialogue,
        tags,
        gender: data.gender !== undefined ? data.gender : character.gender,
        language: data.language !== undefined ? data.language : character.language,
        unfiltered: data.unfiltered !== undefined ? Boolean(data.unfiltered) : character.unfiltered,
        status: newStatus,
        isPublic: newStatus === 'PUBLIC',
      },
    });
  }

  async remove(id: string, userId: string) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');
    if (character.creatorId !== userId) throw new ForbiddenException('You do not own this character');

    // Clean up related relations in a transaction to prevent orphaned rows or FK errors
    return this.prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({ where: { chat: { characterId: id } } });
      await tx.chat.deleteMany({ where: { characterId: id } });
      await tx.like.deleteMany({ where: { characterId: id } });
      return tx.character.delete({ where: { id } });
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
      sort, 
      gender, 
      language, 
      unfiltered, 
      page = 1, 
      limit = 12 
    } = query;

    const where: any = { status: 'PUBLIC' };

    if (gender && gender !== 'ALL') where.gender = gender;
    if (language && language !== 'ALL') where.language = language;
    if (unfiltered !== undefined) where.unfiltered = unfiltered;
    if (tags && tags.length > 0) where.tags = { hasSome: tags };

    if (search) {
      const s = search.toLowerCase();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { tags: { hasSome: [s] } },
      ];
    }

    // 1. Total matching count for pagination
    const totalCount = await this.prisma.character.count({ where });
    const parsedLimit = Math.max(1, Number(limit) || 12);
    const parsedPage = Math.max(1, Number(page) || 1);
    const totalPages = Math.max(1, Math.ceil(totalCount / parsedLimit));

    // 2. Fetch characters matching filter criteria
    const results = await this.prisma.character.findMany({
      where,
      include: { creator: { select: { username: true } } },
    });

    // 3. User personalized recommendations logic
    let userPreferredTags: string[] = [];
    const activeSort = !userId && sort === 'recommended' ? 'top' : sort || 'recommended';

    if (userId && activeSort === 'recommended') {
      try {
        const recentEvents = await this.prisma.analyticsEvent.findMany({
          where: { userId, eventType: 'CHAT_MESSAGE' },
          take: 15,
          orderBy: { createdAt: 'desc' },
        });

        const interactedIds = recentEvents.map((e) => (e.metadata as any)?.characterId).filter(Boolean);
        if (interactedIds.length > 0) {
          const lastChars = await this.prisma.character.findMany({
            where: { id: { in: interactedIds } },
            select: { tags: true },
          });
          userPreferredTags = [...new Set(lastChars.flatMap((c) => c.tags))];
        }
      } catch (e) {
        console.error('Personalization fallback to global sort', e);
      }
    }

    // 4. In-memory ranking and sorting
    const sorted = results.sort((a, b) => {
      const s = search?.toLowerCase() || '';

      if (search) {
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

      if (activeSort === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (activeSort === 'top') return (b.chatCount || 0) - (a.chatCount || 0);

      if (activeSort === 'recommended') {
        const matchA = a.tags.filter((t: any) => userPreferredTags.includes(t)).length;
        const matchB = b.tags.filter((t: any) => userPreferredTags.includes(t)).length;
        if (matchA === matchB) return (b.chatCount || 0) - (a.chatCount || 0);
        return matchB - matchA;
      }

      return 0;
    });

    // 5. Slice exactly 12 items for the requested page
    const offset = (parsedPage - 1) * parsedLimit;
    const paginatedCharacters = sorted.slice(offset, offset + parsedLimit);

    return {
      characters: paginatedCharacters,
      totalCount,
      totalPages,
      currentPage: parsedPage,
    };
  }

  async findOne(id: string) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: { creator: { select: { username: true } } },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    // Increment chat count non-blockingly
    await this.prisma.character.update({
      where: { id },
      data: { chatCount: { increment: 1 } },
    });

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
      await this.prisma.$transaction([
        this.prisma.like.delete({ where: { id: existingLike.id } }),
        this.prisma.character.update({
          where: { id: characterId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return { liked: false };
    } else {
      await this.prisma.$transaction([
        this.prisma.like.create({ data: { userId, characterId } }),
        this.prisma.character.update({
          where: { id: characterId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      return { liked: true };
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
      await this.prisma.follow.delete({ where: { id: existingFollow.id } });
      return { followed: false };
    } else {
      await this.prisma.follow.create({ data: { followerId, followingId } });
      return { followed: true };
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