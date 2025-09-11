/**
 * Utilitaires de sécurité pour Evenzi
 * CORS, CSRF, et autres protections
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

/**
 * Configuration CORS sécurisée
 */
const ALLOWED_ORIGINS = [
  'https://studio.evenzi.io',
  'https://evenzi.vercel.app',
  'https://www.evenzi.io',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
];

const CORS_OPTIONS = {
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Origin',
    'User-Agent'
  ],
  credentials: true,
  maxAge: 86400, // 24 heures
  optionsSuccessStatus: 200
};

/**
 * Middleware CORS pour les APIs
 */
export function corsMiddleware(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin');
  const method = request.method;

  // Vérifier l'origine
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!origin && process.env.NODE_ENV === 'development') {
    // Permettre les requêtes sans origin en développement
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  // Headers CORS standard
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', CORS_OPTIONS.methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', CORS_OPTIONS.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', CORS_OPTIONS.maxAge.toString());

  // Gestion des requêtes OPTIONS (preflight)
  if (method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 200,
      headers: response.headers 
    });
  }

  return response;
}

/**
 * Génération de token CSRF
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validation du token CSRF
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  
  try {
    // Créer un hash basé sur le token de session
    const expectedToken = crypto
      .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback-secret')
      .update(sessionToken)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expectedToken, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Middleware CSRF pour les APIs
 */
export async function csrfMiddleware(request: NextRequest) {
  const method = request.method;
  
  // Ignorer CSRF pour les méthodes GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  const csrfToken = request.headers.get('X-CSRF-Token');
  const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!csrfToken || !sessionToken) {
    return NextResponse.json(
      { error: 'CSRF token manquant' },
      { status: 403 }
    );
  }

  if (!validateCSRFToken(csrfToken, sessionToken)) {
    return NextResponse.json(
      { error: 'CSRF token invalide' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Détection d'attaques par injection
 */
export function detectInjectionAttempt(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(--|\/\*|\*\/)/g,
    /(\b(OR|AND)\b.*=.*)/gi,
    /['"`;]/g
  ];

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi
  ];

  const allPatterns = [...sqlInjectionPatterns, ...xssPatterns];

  return allPatterns.some(pattern => pattern.test(input));
}

/**
 * Middleware de détection d'attaques
 */
export function attackDetectionMiddleware(request: NextRequest) {
  const url = request.nextUrl.toString();
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';

  // Vérifier l'URL
  if (detectInjectionAttempt(url)) {
    console.warn('🚨 Tentative d\'injection détectée dans l\'URL:', url);
    return NextResponse.json(
      { error: 'Requête suspecte détectée' },
      { status: 400 }
    );
  }

  // Vérifier le User-Agent
  const suspiciousUserAgents = [
    'sqlmap',
    'nikto',
    'nmap',
    'burp',
    'havij',
    'w3af'
  ];

  if (suspiciousUserAgents.some(ua => userAgent.toLowerCase().includes(ua))) {
    console.warn('🚨 User-Agent suspect détecté:', userAgent);
    return NextResponse.json(
      { error: 'User-Agent non autorisé' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Validation de l'origine de la requête
 */
export function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // En développement, accepter localhost
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Vérifier l'origine
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return false;
  }

  // Vérifier le referer pour les requêtes sans origin
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      return ALLOWED_ORIGINS.includes(refererOrigin);
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Rate limiting avancé par IP et endpoint
 * (Les règles sont définies dans rateLimiter.ts)
 */

/**
 * Génération de nonce pour CSP
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Headers de sécurité pour les réponses API
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  const nonce = generateNonce();

  // Headers de sécurité
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  
  // CSP pour les APIs JSON
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'none'; frame-ancestors 'none'; script-src 'nonce-${nonce}'`
  );

  return response;
}

/**
 * Validation des types de fichiers uploadés
 */
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Validation de la taille des fichiers
 */
export function validateFileSize(size: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

/**
 * Sanitisation des noms de fichiers
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Remplacer les caractères spéciaux
    .replace(/_{2,}/g, '_') // Réduire les underscores multiples
    .substring(0, 255); // Limiter la longueur
}

/**
 * Middleware de sécurité complet
 */
export async function securityMiddleware(request: NextRequest) {
  // 1. Validation de l'origine
  if (!validateRequestOrigin(request)) {
    return NextResponse.json(
      { error: 'Origine non autorisée' },
      { status: 403 }
    );
  }

  // 2. Détection d'attaques
  const attackResponse = attackDetectionMiddleware(request);
  if (attackResponse) {
    return attackResponse;
  }

  // 3. CSRF pour les méthodes modifiantes
  const csrfResponse = await csrfMiddleware(request);
  if (csrfResponse) {
    return csrfResponse;
  }

  return null;
}

/**
 * Utilitaire pour logger les tentatives de sécurité
 */
export function logSecurityEvent(
  type: 'CSRF_VIOLATION' | 'INJECTION_ATTEMPT' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY',
  details: Record<string, any>
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    url: details.url || 'unknown',
    ...details
  };

  // En production, envoyer à un service de monitoring
  if (process.env.NODE_ENV === 'production') {
    console.warn('🚨 SECURITY EVENT:', JSON.stringify(logEntry));
    // TODO: Intégrer avec un service comme Sentry, LogRocket, etc.
  } else {
    console.log('🔒 Security Event (dev):', logEntry);
  }
}