/**
 * Service de cache avec helpers pour les opérations courantes
 * Supporte Redis et fallback en mémoire
 */

import { getCache } from './redis';
import { logger } from './logger';

// Types pour le cache
export interface CacheOptions {
  ttl?: number; // Time to live en secondes
  prefix?: string; // Préfixe pour les clés
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

// Statistiques du cache
const stats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
};

/**
 * Générer une clé de cache avec préfixe
 */
function generateKey(key: string, prefix?: string): string {
  return prefix ? `${prefix}:${key}` : key;
}

/**
 * Obtenir une valeur du cache
 */
export async function getCached<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  try {
    const cache = getCache();
    const fullKey = generateKey(key, options.prefix);
    
    const value = await cache.get(fullKey);
    
    if (value) {
      stats.hits++;
      return JSON.parse(value) as T;
    }
    
    stats.misses++;
    return null;
  } catch (error) {
    logger.error('Cache get error:', { key, error });
    return null;
  }
}

/**
 * Définir une valeur dans le cache
 */
export async function setCached<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const cache = getCache();
    const fullKey = generateKey(key, options.prefix);
    const serialized = JSON.stringify(value);
    
    if (options.ttl) {
      await cache.setex(fullKey, options.ttl, serialized);
    } else {
      await cache.set(fullKey, serialized);
    }
    
    stats.sets++;
    return true;
  } catch (error) {
    logger.error('Cache set error:', { key, error });
    return false;
  }
}

/**
 * Supprimer une valeur du cache
 */
export async function deleteCached(
  key: string,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const cache = getCache();
    const fullKey = generateKey(key, options.prefix);
    
    const deleted = await cache.del(fullKey);
    stats.deletes++;
    
    return deleted > 0;
  } catch (error) {
    logger.error('Cache delete error:', { key, error });
    return false;
  }
}

/**
 * Supprimer plusieurs valeurs du cache par pattern
 */
export async function deleteCachedPattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<number> {
  try {
    const cache = getCache();
    const fullPattern = generateKey(pattern, options.prefix);
    
    const keys = await cache.keys(fullPattern);
    
    if (keys.length === 0) return 0;
    
    const deleted = await cache.del(...keys);
    stats.deletes += deleted;
    
    return deleted;
  } catch (error) {
    logger.error('Cache delete pattern error:', { pattern, error });
    return 0;
  }
}

/**
 * Obtenir ou définir une valeur dans le cache
 * Si la valeur n'existe pas, exécuter la fonction et mettre en cache
 */
export async function getOrSetCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Essayer de récupérer du cache
  const cached = await getCached<T>(key, options);
  
  if (cached !== null) {
    return cached;
  }
  
  // Si pas en cache, exécuter la fonction
  const value = await fetchFn();
  
  // Mettre en cache
  await setCached(key, value, options);
  
  return value;
}

/**
 * Incrémenter une valeur dans le cache
 */
export async function incrementCached(
  key: string,
  options: CacheOptions = {}
): Promise<number> {
  try {
    const cache = getCache();
    const fullKey = generateKey(key, options.prefix);
    
    const newValue = await cache.incr(fullKey);
    
    // Définir l'expiration si spécifiée
    if (options.ttl) {
      await cache.expire(fullKey, options.ttl);
    }
    
    return newValue;
  } catch (error) {
    logger.error('Cache increment error:', { key, error });
    return 0;
  }
}

/**
 * Obtenir le TTL d'une clé
 */
export async function getTTL(
  key: string,
  options: CacheOptions = {}
): Promise<number> {
  try {
    const cache = getCache();
    const fullKey = generateKey(key, options.prefix);
    
    return await cache.ttl(fullKey);
  } catch (error) {
    logger.error('Cache TTL error:', { key, error });
    return -2;
  }
}

/**
 * Vider tout le cache
 */
export async function flushCache(): Promise<boolean> {
  try {
    const cache = getCache();
    await cache.flushdb();
    
    logger.info('Cache flushed successfully');
    return true;
  } catch (error) {
    logger.error('Cache flush error:', error);
    return false;
  }
}

/**
 * Obtenir les statistiques du cache
 */
export function getCacheStats(): CacheStats {
  return { ...stats };
}

/**
 * Réinitialiser les statistiques du cache
 */
export function resetCacheStats(): void {
  stats.hits = 0;
  stats.misses = 0;
  stats.sets = 0;
  stats.deletes = 0;
}

/**
 * Helpers spécifiques pour les cas d'usage courants
 */

// Cache pour les événements
export const EventCache = {
  get: (eventId: string) => getCached(`event:${eventId}`, { ttl: 300 }), // 5 min
  set: (eventId: string, data: unknown) => setCached(`event:${eventId}`, data, { ttl: 300 }),
  delete: (eventId: string) => deleteCached(`event:${eventId}`),
  deleteAll: () => deleteCachedPattern('event:*'),
};

// Cache pour les participants
export const ParticipantCache = {
  get: (eventId: string) => getCached(`participants:${eventId}`, { ttl: 180 }), // 3 min
  set: (eventId: string, data: unknown) => setCached(`participants:${eventId}`, data, { ttl: 180 }),
  delete: (eventId: string) => deleteCached(`participants:${eventId}`),
  deleteAll: () => deleteCachedPattern('participants:*'),
};

// Cache pour les sessions
export const SessionCache = {
  get: (eventId: string) => getCached(`sessions:${eventId}`, { ttl: 300 }), // 5 min
  set: (eventId: string, data: unknown) => setCached(`sessions:${eventId}`, data, { ttl: 300 }),
  delete: (eventId: string) => deleteCached(`sessions:${eventId}`),
  deleteAll: () => deleteCachedPattern('sessions:*'),
};

// Cache pour les sponsors
export const SponsorCache = {
  get: (eventId: string) => getCached(`sponsors:${eventId}`, { ttl: 600 }), // 10 min
  set: (eventId: string, data: unknown) => setCached(`sponsors:${eventId}`, data, { ttl: 600 }),
  delete: (eventId: string) => deleteCached(`sponsors:${eventId}`),
  deleteAll: () => deleteCachedPattern('sponsors:*'),
};

// Cache pour les statistiques
export const StatsCache = {
  get: (key: string) => getCached(`stats:${key}`, { ttl: 60 }), // 1 min
  set: (key: string, data: unknown) => setCached(`stats:${key}`, data, { ttl: 60 }),
  delete: (key: string) => deleteCached(`stats:${key}`),
  deleteAll: () => deleteCachedPattern('stats:*'),
};

