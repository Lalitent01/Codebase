import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured. Operating in cache-bypass mode.');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        enableOfflineQueue: false, // Fail immediately if Redis is unreachable
        lazyConnect: false,
      });

      this.redis.on('ready', () => {
        this.logger.log('Redis connected and ready.');
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Redis connection issue (bypass active): ${err.message}`);
      });
    } catch (err: any) {
      this.logger.error(`Redis initialization failed: ${err.message}`);
      this.redis = null;
    }
  }

  /**
   * Evaluates if Redis is currently ready to process commands.
   */
  private isReady(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * Retrieves and deserializes a cached value.
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isReady() || !this.redis) return null;

    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error: any) {
      this.logger.warn(`Failed to get key "${key}": ${error.message}`);
      return null; // Fail-open: database handles the query
    }
  }

  /**
   * Serializes and caches any value with a TTL (default 1 hour).
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isReady() || !this.redis || value === undefined) return;

    try {
      // JSON.stringify handles strings, numbers, booleans, and objects consistently
      const serialized = JSON.stringify(value);
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
    } catch (error: any) {
      this.logger.warn(`Failed to set key "${key}": ${error.message}`);
    }
  }

  /**
   * Deletes a single key.
   */
  async del(key: string): Promise<void> {
    if (!this.isReady() || !this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error: any) {
      this.logger.warn(`Failed to delete key "${key}": ${error.message}`);
    }
  }

  /**
   * Non-blocking pattern deletion using Redis SCAN stream.
   * Useful for invalidating wildcard sets like "characters:*" or "user:123:*".
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.isReady() || !this.redis) return;

    try {
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100,
      });

      const pipeline = this.redis.pipeline();
      let keyCount = 0;

      stream.on('data', (keys: string[]) => {
        if (keys.length > 0) {
          keyCount += keys.length;
          keys.forEach((key) => pipeline.del(key));
        }
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('end', async () => {
          if (keyCount > 0) {
            await pipeline.exec();
          }
          resolve();
        });
        stream.on('error', (err) => reject(err));
      });
    } catch (error: any) {
      this.logger.warn(`Failed to delete pattern "${pattern}": ${error.message}`);
    }
  }

  /**
   * Gracefully shuts down connection without hanging server teardown.
   */
  async onModuleDestroy() {
    if (this.redis) {
      try {
        await Promise.race([
          this.redis.quit(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
        ]);
      } catch {
        this.redis.disconnect();
      } finally {
        this.redis = null;
      }
    }
  }
}