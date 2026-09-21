import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    // Prevent connecting to real Upstash Redis during automated tests
    delete process.env.REDIS_URL;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
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
});