import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('[REDIS] REDIS_URL not found. Caching disabled.');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        enableOfflineQueue: false, // Don't hold up HTTP requests when Redis is down
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('[REDIS] Connected successfully.');
      });

      this.redis.on('error', (err) => {
        this.isConnected = false;
        console.warn('[REDIS] Connection issue. Operating in cache-bypass mode:', err.message);
      });
    } catch (err: any) {
      console.error('[REDIS] Initialization failed:', err.message);
      this.redis = null;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) return null;

    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T; // If stored as a plain string
      }
    } catch (error: any) {
      console.warn(`[CACHE] Failed to get key "${key}":`, error.message);
      return null; // Fail-open: return null so database handles the request
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!this.redis || !this.isConnected || value === undefined) return;

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.redis.set(key, serialized, 'EX', ttl);
    } catch (error: any) {
      console.warn(`[CACHE] Failed to set key "${key}":`, error.message);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis || !this.isConnected) return;

    try {
      await this.redis.del(key);
    } catch (error: any) {
      console.warn(`[CACHE] Failed to delete key "${key}":`, error.message);
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        this.redis.disconnect();
      }
    }
  }
}