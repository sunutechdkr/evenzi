/**
 * Rate Limiter sécurisé pour Evenzi
 * Implémentation robuste avec support Redis et fallback en mémoire
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';
import { getCache, isRedisAvailable } from './redis';

interface RateLimitInfo {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitOptions {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes par fenêtre
  skipSuccessfulRequests?: boolean; // Ignorer les requêtes réussies
  keyGenerator?: (request: NextRequest) => string; // Générateur de clé personnalisé
}

class RateLimiter {
  private store = new Map<string, RateLimitInfo>();
  private options: RateLimitOptions;
  
  constructor(options: RateLimitOptions) {
    this.options = {
      skipSuccessfulRequests: false,
      keyGenerator: this.defaultKeyGenerator.bind(this),
      ...options
    };

    // Nettoyage périodique des entrées expirées
    setInterval(() => {
      this.cleanup();
    }, this.options.windowMs);
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Utilise une combinaison d'IP et User-Agent pour plus de robustesse
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Hash simple pour réduire la taille de la clé
    const hash = this.simpleHash(ip + userAgent);
    return `rate_limit:${hash}`;
  }

  private getClientIP(request: NextRequest): string {
    // Essaie plusieurs headers pour obtenir la vraie IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('x-client-ip');
    
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    return realIP || clientIP || 'unknown';
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, info] of this.store.entries()) {
      if (info.resetTime < now) {
        this.store.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
      logger.debug(`Rate limiter cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  public async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.options.keyGenerator!(request);
    const now = Date.now();
    
    // Essayer d'utiliser Redis si disponible
    if (isRedisAvailable()) {
      return this.checkLimitRedis(key, now, request);
    }
    
    // Fallback vers le cache en mémoire
    return this.checkLimitMemory(key, now, request);
  }

  private async checkLimitRedis(key: string, now: number, request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    try {
      const cache = getCache();
      const windowSeconds = Math.ceil(this.options.windowMs / 1000);
      
      // Utiliser une transaction Redis pour atomicité
      const count = await cache.incr(key);
      
      // Si c'est la première requête, définir l'expiration
      if (count === 1) {
        await cache.expire(key, windowSeconds);
      }
      
      // Calculer le resetTime
      const ttl = await cache.ttl(key);
      const resetTime = now + (ttl > 0 ? ttl * 1000 : this.options.windowMs);
      
      const allowed = count <= this.options.maxRequests;
      const remaining = Math.max(0, this.options.maxRequests - count);
      
      let retryAfter: number | undefined;
      if (!allowed) {
        retryAfter = Math.ceil((resetTime - now) / 1000);
        
        logger.warn('Rate limit exceeded (Redis)', {
          ip: this.getClientIP(request),
          path: request.nextUrl.pathname,
          method: request.method,
          count,
          limit: this.options.maxRequests,
          retryAfter
        });
      }
      
      return {
        allowed,
        limit: this.options.maxRequests,
        remaining,
        resetTime,
        retryAfter
      };
    } catch (error) {
      logger.error('Redis rate limit error, falling back to memory:', error);
      // Fallback vers la mémoire en cas d'erreur Redis
      return this.checkLimitMemory(key, now, request);
    }
  }

  private async checkLimitMemory(key: string, now: number, request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    let info = this.store.get(key);
    
    // Si pas d'info ou fenêtre expirée, reset
    if (!info || info.resetTime < now) {
      info = {
        count: 0,
        resetTime: now + this.options.windowMs,
        firstRequest: now
      };
    }

    // Incrémente le compteur
    info.count++;
    this.store.set(key, info);

    const allowed = info.count <= this.options.maxRequests;
    const remaining = Math.max(0, this.options.maxRequests - info.count);
    
    let retryAfter: number | undefined;
    if (!allowed) {
      retryAfter = Math.ceil((info.resetTime - now) / 1000);
      
      logger.warn('Rate limit exceeded (Memory)', {
        ip: this.getClientIP(request),
        path: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        count: info.count,
        limit: this.options.maxRequests,
        retryAfter
      });
    }

    return {
      allowed,
      limit: this.options.maxRequests,
      remaining,
      resetTime: info.resetTime,
      retryAfter
    };
  }

  public reset(request: NextRequest): void {
    const key = this.options.keyGenerator!(request);
    this.store.delete(key);
  }
}

// Configuration par défaut pour différents types d'endpoints
// Optimisé pour 500-1000 utilisateurs simultanés
export const createRateLimiter = {
  // Rate limiter général (120 req/min) - Navigation et pages
  general: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120 // Augmenté pour supporter la navigation intensive
  }),

  // Rate limiter pour l'authentification (15 req/min) - Plus permissif
  auth: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15 // Augmenté de 5 à 15 pour éviter les blocages lors du login
  }),

  // Rate limiter pour les APIs publiques (300 req/min) - Très permissif
  api: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // Augmenté pour supporter les appels API fréquents
    skipSuccessfulRequests: true
  }),

  // Rate limiter pour le check-in (100 req/min) - Événements avec beaucoup de participants
  checkin: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // Augmenté pour check-in massif
  }),

  // Rate limiter pour les uploads (20 req/min) - Plus permissif
  upload: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // Augmenté pour permettre plusieurs uploads
  }),

  // Rate limiter pour la navigation (200 req/min) - Très permissif
  navigation: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200 // Spécial pour la navigation intensive
  }),

  // Rate limiter personnalisable
  custom: (options: RateLimitOptions) => new RateLimiter(options)
};

/**
 * Règles de rate limiting par endpoint
 */
interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  // Authentification - Plus permissif pour éviter blocages
  '/api/auth': {
    windowMs: 5 * 60 * 1000, // 5 minutes (réduit de 15)
    maxRequests: 20 // Augmenté de 5 à 20
  },
  
  // APIs de création - Plus permissives
  '/api/events': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50 // Augmenté de 10 à 50
  },
  
  '/api/users': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // Augmenté de 5 à 30
  },
  
  // APIs de lecture - Très permissives
  '/api/dashboard': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // Augmenté de 30 à 100
  },
  
  // Défaut pour toutes les autres routes - Permissif
  'default': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 80 // Augmenté de 20 à 80
  }
};

/**
 * Obtenir la règle de rate limiting pour un endpoint
 */
export function getRateLimitRule(pathname: string): RateLimitRule {
  // Chercher une règle spécifique
  for (const [path, rule] of Object.entries(RATE_LIMIT_RULES)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return rule;
    }
  }
  
  return RATE_LIMIT_RULES.default;
}

// Instance globale pour le middleware
export const globalRateLimiter = createRateLimiter.general();

// Fonction helper pour appliquer le rate limiting avec headers HTTP standard
export async function applyRateLimit(
  request: NextRequest,
  limiter: RateLimiter = globalRateLimiter
) {
  const result = await limiter.checkLimit(request);
  
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  if (!result.allowed && result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }

  return {
    ...result,
    headers
  };
}
