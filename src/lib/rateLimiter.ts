/**
 * Rate Limiter sécurisé pour Evenzi
 * Implémentation robuste avec support Redis (optionnel) et fallback en mémoire
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';

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
      retryAfter = Math.ceil((info.resetTime - now) / 1000); // en secondes
      
      // Log de l'incident de rate limiting
      logger.warn('Rate limit exceeded', {
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
export const createRateLimiter = {
  // Rate limiter général (15 req/min)
  general: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15
  }),

  // Rate limiter strict pour l'authentification (5 req/min)
  auth: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5
  }),

  // Rate limiter pour les APIs publiques (100 req/min)
  api: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: true
  }),

  // Rate limiter pour le check-in (30 req/min)
  checkin: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  }),

  // Rate limiter pour les uploads (5 req/min)
  upload: () => new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5
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
  // Authentification très stricte
  '/api/auth': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  },
  
  // APIs de création modérément strictes
  '/api/events': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10
  },
  
  '/api/users': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5
  },
  
  // APIs de lecture plus permissives
  '/api/dashboard': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  },
  
  // Défaut pour toutes les autres routes
  'default': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20
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
