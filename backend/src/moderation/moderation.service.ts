import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ModerationService {
  // Strictly prohibited keywords
  private bannedKeywords = ['minor', 'underage', 'child', 'kid', 'incest'];

  // Pre-compiled regex with word boundaries (\b) to avoid false positives like "kidding" or "skid"
  private bannedRegex = new RegExp(`\\b(${this.bannedKeywords.join('|')})\\b`, 'i');

  validateMessage(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return true;
    }

    if (this.bannedRegex.test(content)) {
      throw new BadRequestException('Your message violates safety and community guidelines.');
    }

    return true;
  }
}