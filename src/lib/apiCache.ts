/**
 * Middleware de cache HTTP pour les APIs
 * Permet de mettre en cache les réponses des APIs de lecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrSetCached, deleteCachedPattern } from './cacheService';
import { logger } from './logger';

export interface CacheConfig {
  ttl: number; // Time to live en secondes
  key?: (req: NextRequest) => string; // Générateur de clé personnalisé
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean; // Condition de mise en cache
}

/**
 * Générer une clé de cache pour une requête
 */
function generateCacheKey(req: NextRequest, customKey?: (req: NextRequest) => string): string {
  if (customKey) {
    return customKey(req);
  }
  
  const url = req.nextUrl;
  const method = req.method;
  const search = url.search;
  
  return `api:${method}:${url.pathname}${search}`;
}

/**
 * Middleware de cache pour les APIs
 * Utilise Redis si disponible, sinon fallback en mémoire
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CacheConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Ne cacher que les requêtes GET
    if (req.method !== 'GET') {
      return handler(req);
    }

    const cacheKey = generateCacheKey(req, config.key);

    try {
      // Essayer de récupérer du cache
      const cached = await getOrSetCached<{
        status: number;
        headers: Record<string, string>;
        body: string;
      }>(
        cacheKey,
        async () => {
          // Si pas en cache, exécuter le handler
          const response = await handler(req);
          
          // Vérifier si on doit mettre en cache
          if (config.shouldCache && !config.shouldCache(req, response)) {
            throw new Error('SKIP_CACHE'); // Ne pas mettre en cache
          }
          
          // Vérifier le status code (ne cacher que les succès)
          if (response.status < 200 || response.status >= 300) {
            throw new Error('SKIP_CACHE');
          }

          // Extraire les données de la réponse
          const body = await response.text();
          const headers: Record<string, string> = {};
          
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });

          return {
            status: response.status,
            headers,
            body,
          };
        },
        { ttl: config.ttl }
      );

      // Reconstruire la réponse depuis le cache
      const response = new NextResponse(cached.body, {
        status: cached.status,
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
        },
      });

      return response;
    } catch (error) {
      // Si erreur SKIP_CACHE, exécuter le handler normalement
      if (error instanceof Error && error.message === 'SKIP_CACHE') {
        const response = await handler(req);
        response.headers.set('X-Cache', 'SKIP');
        return response;
      }

      // Si autre erreur, logger et exécuter le handler
      logger.error('API cache error:', { cacheKey, error });
      const response = await handler(req);
      response.headers.set('X-Cache', 'MISS');
      return response;
    }
  };
}

/**
 * Invalider le cache pour un pattern spécifique
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const deleted = await deleteCachedPattern(`api:*${pattern}*`);
    logger.info(`Cache invalidated: ${deleted} entries deleted for pattern "${pattern}"`);
    return deleted;
  } catch (error) {
    logger.error('Cache invalidation error:', { pattern, error });
    return 0;
  }
}

/**
 * Invalider le cache pour un événement spécifique
 */
export async function invalidateEventCache(eventId: string): Promise<void> {
  await Promise.all([
    invalidateCache(`/events/${eventId}`),
    invalidateCache(`events/${eventId}`),
    deleteCachedPattern(`event:${eventId}*`),
    deleteCachedPattern(`participants:${eventId}*`),
    deleteCachedPattern(`sessions:${eventId}*`),
    deleteCachedPattern(`sponsors:${eventId}*`),
  ]);
}

/**
 * Configurations de cache prédéfinies
 */
export const CachePresets = {
  // Cache court (1 minute) - Pour les données qui changent fréquemment
  short: { ttl: 60 },
  
  // Cache moyen (5 minutes) - Pour les données qui changent modérément
  medium: { ttl: 300 },
  
  // Cache long (15 minutes) - Pour les données qui changent rarement
  long: { ttl: 900 },
  
  // Cache très long (1 heure) - Pour les données quasi-statiques
  veryLong: { ttl: 3600 },
  
  // Cache pour les événements (5 minutes)
  events: {
    ttl: 300,
    key: (req: NextRequest) => {
      const eventId = req.nextUrl.pathname.split('/')[3];
      return `api:events:${eventId}`;
    },
  },
  
  // Cache pour les participants (3 minutes)
  participants: {
    ttl: 180,
    key: (req: NextRequest) => {
      const eventId = req.nextUrl.pathname.split('/')[3];
      return `api:participants:${eventId}`;
    },
  },
  
  // Cache pour les sessions (5 minutes)
  sessions: {
    ttl: 300,
    key: (req: NextRequest) => {
      const eventId = req.nextUrl.pathname.split('/')[3];
      return `api:sessions:${eventId}`;
    },
  },
  
  // Cache pour les sponsors (10 minutes)
  sponsors: {
    ttl: 600,
    key: (req: NextRequest) => {
      const eventId = req.nextUrl.pathname.split('/')[3];
      return `api:sponsors:${eventId}`;
    },
  },
  
  // Cache pour les statistiques (1 minute)
  stats: {
    ttl: 60,
    shouldCache: (req: NextRequest, res: NextResponse) => {
      // Ne cacher que si la réponse est un succès
      return res.status === 200;
    },
  },
};

