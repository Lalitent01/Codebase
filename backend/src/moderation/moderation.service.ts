import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ModerationService {
  // Regex covering singulars, plurals, and common roleplay bypass derivatives
  private readonly bannedPatterns: RegExp[] = [
    /\b(minor|minors)\b/i,
    /\b(child|children|childhood)\b/i,
    /\b(underage|underaged)\b/i,
    /\b(incest|incestuous)\b/i,
    /\b(loli|lolita|shota)\b/i,
  ];

  // Specific regex for "kid" that avoids false positives like "I kid you not" or "no kidding"
  private readonly kidPattern = /\b(kid|kids|kiddo|kiddos)\b/i;
  private readonly falsePositiveIdioms = [
    /\bi\s+kid\s+you\s+not\b/i,
    /\bdon'?t\s+kid\s+yourself\b/i,
    /\bno\s+kidding\b/i,
    /\bjust\s+kidding\b/i,
  ];

  /**
   * Normalizes leetspeak and stripped punctuation to prevent obfuscation bypasses (e.g., "m.i.n.o.r", "und3rage")
   */
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/[@]/g, 'a')
      .replace(/[1!|]/g, 'i')
      .replace(/[3]/g, 'e')
      .replace(/[0]/g, 'o')
      .replace(/[5$]/g, 's')
      .replace(/[\.\-_,]/g, ''); // Collapse "m.i.n.o.r" -> "minor"
  }

  validateMessage(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return true;
    }

    const trimmed = content.trim();
    if (!trimmed) return true;

    // 1. Direct Pattern Check
    for (const pattern of this.bannedPatterns) {
      if (pattern.test(trimmed)) {
        throw new BadRequestException('Your message violates safety and community guidelines.');
      }
    }

    // 2. Check "kid/kids" while respecting conversational idioms
    if (this.kidPattern.test(trimmed)) {
      const isIdiom = this.falsePositiveIdioms.some((idiom) => idiom.test(trimmed));
      if (!isIdiom) {
        throw new BadRequestException('Your message violates safety and community guidelines.');
      }
    }

    // 3. Obfuscation / Leetspeak check on normalized string
    const normalized = this.normalizeContent(trimmed);
    for (const pattern of this.bannedPatterns) {
      if (pattern.test(normalized)) {
        throw new BadRequestException('Your message violates safety and community guidelines.');
      }
    }

    return true;
  }
}