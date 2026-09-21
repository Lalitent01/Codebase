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

  it('should allow normal messages and words containing substrings like "kidding"', () => {
    expect(service.validateMessage('Just kidding with you!')).toBe(true);
    expect(service.validateMessage('The car hit a skid mark.')).toBe(true);
    expect(service.validateMessage('What a lovely orchid.')).toBe(true);
  });

  it('should block messages containing exact banned words', () => {
    expect(() => service.validateMessage('talking to a kid here')).toThrow(BadRequestException);
    expect(() => service.validateMessage('Are you a MINOR?')).toThrow(BadRequestException);
  });
});