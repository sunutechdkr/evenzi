/**
 * Rate Limiter pour Middleware (Edge Runtime compatible)
 * Version simplifiée sans Redis - Utilise uniquement le cache en mémoire
 * Ce fichier est utilisé uniquement par le middleware pour éviter les problèmes Edge Runtime
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';

interface RateLimitInfo {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

class MiddlewareRateLimiter {
  private store = new Map<string, RateLimitInfo>();
  private options: RateLimitOptions;
  
  constructor(options: RateLimitOptions) {
    this.options = {
      skipSuccessfulRequests: false,
      keyGenerator: this.defaultKeyGenerator.bind(this),
      ...options
    };
  }

  private defaultKeyGenerator(request: NextRequest): string {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const hash = this.simpleHash(ip + userAgent);
    return `rate_limit:${hash}`;
  }

  private getClientIP(request: NextRequest): string {
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
      hash = hash & hash;
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

    // Nettoyage automatique si trop d'entrées
    if (this.store.size > 1000) {
      const entriesToKeep = Array.from(this.store.entries())
        .sort((a, b) => b[1].resetTime - a[1].resetTime)
        .slice(0, 500);
      this.store.clear();
      entriesToKeep.forEach(([key, info]) => this.store.set(key, info));
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
    
    // Nettoyage périodique si nécessaire
    if (this.store.size > 1000) {
      this.cleanup();
    }
    
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
      
      logger.warn('Rate limit exceeded (Middleware)', {
        ip: this.getClientIP(request),
        path: request.nextUrl.pathname,
        method: request.method,
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

// Rate limiters pour le middleware (sans Redis)
export const createMiddlewareRateLimiter = {
  general: () => new MiddlewareRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 120
  }),

  auth: () => new MiddlewareRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 15
  }),

  api: () => new MiddlewareRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 300
  }),

  navigation: () => new MiddlewareRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 200
  }),

  custom: (options: RateLimitOptions) => new MiddlewareRateLimiter(options)
};

// Fonction helper pour appliquer le rate limiting avec headers HTTP standard
export async function applyMiddlewareRateLimit(
  request: NextRequest,
  limiter: MiddlewareRateLimiter
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

