import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REDIS_URL') return null; // Simulates no redis in test mode
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should safely return null when redis is offline', async () => {
    const result = await service.get('test_key');
    expect(result).toBeNull();
  });

  it('should safely bypass set operations without throwing when offline', async () => {
    await expect(service.set('test_key', { data: 123 }, 60)).resolves.not.toThrow();
  });

  it('should safely bypass del operations without throwing when offline', async () => {
    await expect(service.del('test_key')).resolves.not.toThrow();
  });

  it('should safely bypass pattern del operations without throwing when offline', async () => {
    await expect(service.delByPattern('test_*')).resolves.not.toThrow();
  });
});