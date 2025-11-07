import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from './types/models';
import { applyRateLimit, createRateLimiter } from './lib/rateLimiter';
import { logger } from './lib/logger';

// List of public routes that don't require authentication
const publicRoutes = [
  '/', 
  '/login', 
  '/auth/signin',
  '/auth/auto-login',
  '/auth/auto-login-participant',
  '/auth/verify-request',
  '/api/auth', 
  '/register', 
  '/event',
  '/api/register',
  '/api/events/slug', // API pour récupérer les événements par slug
  '/api/public/events', // API publique pour les billets
  '/privacy-policy'
];

// Routes accessibles uniquement aux administrateurs
const adminRoutes = [
  '/dashboard/admin',
  '/dashboard/users',
  '/dashboard/settings'
];

// Routes accessibles aux organisateurs et administrateurs
const organizerRoutes = [
  '/dashboard/events/create',
  '/dashboard/analytics'
];

// Routes accessibles uniquement aux utilisateurs USER
const userRoutes = [
  '/dashboard/user'
];

// Rate limiters spécialisés - Optimisés pour 500-1000 utilisateurs simultanés
const authRateLimiter = createRateLimiter.auth();
const apiRateLimiter = createRateLimiter.api();
const generalRateLimiter = createRateLimiter.general();
const navigationRateLimiter = createRateLimiter.navigation();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 0. EXCLURE LES ROUTES NEXT.JS INTERNES - Pas de rate limiting
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.') // Fichiers statiques (favicon.ico, images, etc.)
  ) {
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }
  
  // 1. DÉTECTION BASIQUE D'ATTAQUES - Sans modules Node.js
  const url = request.nextUrl.toString();
  const userAgent = request.headers.get('user-agent') || '';
  
  // Patterns d'attaque basiques
  const suspiciousPatterns = [
    /(\bSELECT\b|\bUNION\b|\bDROP\b)/gi,
    /<script[^>]*>/gi,
    /javascript:/gi,
    /\.\.\/\.\.\//g
  ];
  
  const suspiciousUserAgents = ['sqlmap', 'nikto', 'nmap'];
  
  if (suspiciousPatterns.some(pattern => pattern.test(url)) ||
      suspiciousUserAgents.some(ua => userAgent.toLowerCase().includes(ua))) {
    console.warn('🚨 Suspicious activity detected:', { url, userAgent, ip: request.ip });
    return NextResponse.json(
      { error: 'Requête suspecte détectée' },
      { 
        status: 400,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  }
  
  // 2. RATE LIMITING INTELLIGENT - Optimisé pour 500-1000 utilisateurs
  let rateLimitResult;
  
  if (pathname.startsWith('/api/auth')) {
    // Authentification - Limites modérées
    rateLimitResult = await applyRateLimit(request, authRateLimiter);
  } else if (pathname.startsWith('/api/')) {
    // APIs - Limites très permissives
    rateLimitResult = await applyRateLimit(request, apiRateLimiter);
  } else if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/event') ||
    pathname.startsWith('/checkin')
  ) {
    // Navigation - Limites très permissives pour éviter les blocages
    rateLimitResult = await applyRateLimit(request, navigationRateLimiter);
  } else {
    // Autres routes - Limites générales
    rateLimitResult = await applyRateLimit(request, generalRateLimiter);
  }
  
  // Si rate limit dépassé, retourner erreur 429
  if (!rateLimitResult.allowed) {
    console.warn('🚫 Rate limit exceeded:', { 
      pathname, 
      ip: request.ip,
      retryAfter: rateLimitResult.retryAfter 
    });

    const response = NextResponse.json(
      { 
        error: 'Trop de requêtes. Veuillez patienter.',
        retryAfter: rateLimitResult.retryAfter
      },
      { status: 429 }
    );
    
    // Ajouter les headers de rate limiting
    rateLimitResult.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  // 3. SKIP AUTHENTIFICATION - Routes publiques
  if (
    publicRoutes.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Static files like favicon.ico
  ) {
    // Ajouter des headers de sécurité basiques même pour les routes publiques
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }
  
  // Check if user is authenticated
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // If no token exists, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    logger.debug('Authentication required', { pathname, ip: request.ip });
    return NextResponse.redirect(loginUrl);
  }

  // Vérification des restrictions basées sur le rôle
  const userRole = token.role as UserRole;

  // Routes administrateur - réservées aux administrateurs
  if (adminRoutes.some(route => pathname.startsWith(route)) && userRole !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Routes organisateur - réservées aux organisateurs et administrateurs
  if (organizerRoutes.some(route => pathname.startsWith(route)) && 
      userRole !== UserRole.ORGANIZER && 
      userRole !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Routes utilisateur - réservées aux utilisateurs USER (empêcher les autres d'y accéder)
  if (userRoutes.some(route => pathname.startsWith(route)) && userRole !== UserRole.USER) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Empêcher les utilisateurs USER d'accéder aux routes administratives/organisateur
  if (userRole === UserRole.USER) {
    const restrictedRoutes = [
      '/dashboard/events/create',
      '/dashboard/analytics',
      '/dashboard/admin',
      '/dashboard/users',
      '/dashboard/settings'
    ];
    
    if (restrictedRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard/user', request.url));
    }
  }

  // Redirection après connexion si l'utilisateur accède à la racine du dashboard
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    switch (userRole) {
      case UserRole.ADMIN:
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      case UserRole.ORGANIZER:
        return NextResponse.redirect(new URL('/dashboard/events', request.url));
      case UserRole.STAFF:
        return NextResponse.redirect(new URL('/dashboard/events', request.url));
      case UserRole.USER:
      default:
        return NextResponse.redirect(new URL('/dashboard/user', request.url));
    }
  }

  // 4. HEADERS DE SÉCURITÉ ET CORS BASIQUES - Sans modules Node.js
  let response = NextResponse.next();
  
  // Headers de sécurité basiques
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CORS basique pour les APIs
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'https://studio.evenzi.io',
      'https://evenzi.vercel.app'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Gérer les requêtes OPTIONS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }
  
  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * 1. /api/auth routes (authentication endpoints)
     * 2. /_next (Next.js internals)
     * 3. /static (public files)
     * 4. All files in the public folder
     */
    '/((?!api/auth|_next|static|.*\\..*).*)',
  ],
}; 