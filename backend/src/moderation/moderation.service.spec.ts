import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService } from './moderation.service';
import { BadRequestException } from '@nestjs/common';

describe('ModerationService', () => {
  let service: ModerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModerationService],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should allow benign text and colloquial idioms', () => {
    expect(service.validateMessage('Just kidding with you!')).toBe(true);
    expect(service.validateMessage('I kid you not, it was crazy.')).toBe(true);
    expect(service.validateMessage('The car hit a skid mark.')).toBe(true);
    expect(service.validateMessage('What a lovely orchid.')).toBe(true);
  });

  it('should block base banned words and plurals/derivatives', () => {
    expect(() => service.validateMessage('He is talking to a kid.')).toThrow(BadRequestException);
    expect(() => service.validateMessage('Look at those children over there.')).toThrow(BadRequestException);
    expect(() => service.validateMessage('Are you minors?')).toThrow(BadRequestException);
    expect(() => service.validateMessage('She is underaged.')).toThrow(BadRequestException);
    expect(() => service.validateMessage('Roleplay about incest.')).toThrow(BadRequestException);
  });

  it('should catch obfuscated / leetspeak evasion attempts', () => {
    expect(() => service.validateMessage('m.i.n.o.r')).toThrow(BadRequestException);
    expect(() => service.validateMessage('und3rage')).toThrow(BadRequestException);
    expect(() => service.validateMessage('ch!ld')).toThrow(BadRequestException);
  });
});