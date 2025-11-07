/**
 * Configuration Redis avec fallback en mémoire
 * Supporte Redis en production et cache en mémoire en développement
 */

import Redis from 'ioredis';
import { logger } from './logger';

// Interface pour le client de cache (Redis ou Memory)
export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
  setex(key: string, seconds: number, value: string): Promise<'OK'>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<'OK'>;
}

// Cache en mémoire comme fallback
class MemoryCache implements CacheClient {
  private cache = new Map<string, { value: string; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Nettoyage automatique toutes les minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, data] of this.cache.entries()) {
      if (data.expires > 0 && data.expires < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Memory cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  async get(key: string): Promise<string | null> {
    const data = this.cache.get(key);
    if (!data) return null;
    
    if (data.expires > 0 && data.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return data.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null> {
    const expires = mode === 'EX' && duration ? Date.now() + duration * 1000 : 0;
    this.cache.set(key, { value, expires });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const expires = Date.now() + seconds * 1000;
    this.cache.set(key, { value, expires });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) deleted++;
    }
    return deleted;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0') + 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue);
  }

  async expire(key: string, seconds: number): Promise<number> {
    const data = this.cache.get(key);
    if (!data) return 0;
    
    data.expires = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const data = this.cache.get(key);
    if (!data) return -2;
    if (data.expires === 0) return -1;
    
    const remaining = Math.floor((data.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async flushdb(): Promise<'OK'> {
    this.cache.clear();
    return 'OK';
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Instance globale du client de cache
let cacheClient: CacheClient | null = null;
let isRedisConnected = false;

/**
 * Initialiser le client de cache (Redis ou Memory)
 */
export function initializeCache(): CacheClient {
  if (cacheClient) return cacheClient;

  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;

  // Si Redis est configuré, essayer de se connecter
  if (redisUrl && process.env.NODE_ENV === 'production') {
    try {
      logger.info('Initializing Redis cache...');
      
      const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection failed after 3 retries, falling back to memory cache');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        reconnectOnError: (err) => {
          logger.error('Redis connection error:', err.message);
          return false;
        },
      });

      // Tester la connexion
      redis.ping()
        .then(() => {
          isRedisConnected = true;
          logger.info('✅ Redis cache connected successfully');
        })
        .catch((error) => {
          logger.warn('⚠️ Redis ping failed, using memory cache:', error.message);
          isRedisConnected = false;
        });

      // Gérer les événements Redis
      redis.on('error', (error) => {
        logger.error('Redis error:', error.message);
        isRedisConnected = false;
      });

      redis.on('connect', () => {
        isRedisConnected = true;
        logger.info('Redis connected');
      });

      redis.on('close', () => {
        isRedisConnected = false;
        logger.warn('Redis connection closed');
      });

      cacheClient = redis as unknown as CacheClient;
      return cacheClient;
    } catch (error) {
      logger.error('Failed to initialize Redis, falling back to memory cache:', error);
    }
  }

  // Fallback vers le cache en mémoire
  logger.info('Using memory cache (development mode or Redis not configured)');
  cacheClient = new MemoryCache();
  return cacheClient;
}

/**
 * Obtenir le client de cache
 */
export function getCache(): CacheClient {
  if (!cacheClient) {
    return initializeCache();
  }
  return cacheClient;
}

/**
 * Vérifier si Redis est connecté
 */
export function isRedisAvailable(): boolean {
  return isRedisConnected;
}

/**
 * Fermer la connexion au cache
 */
export async function closeCache(): Promise<void> {
  if (cacheClient) {
    if (cacheClient instanceof Redis) {
      await (cacheClient as Redis).quit();
      logger.info('Redis connection closed');
    } else if (cacheClient instanceof MemoryCache) {
      cacheClient.destroy();
      logger.info('Memory cache destroyed');
    }
    cacheClient = null;
    isRedisConnected = false;
  }
}

// Initialiser le cache au démarrage
if (typeof window === 'undefined') {
  // Seulement côté serveur
  initializeCache();
}

