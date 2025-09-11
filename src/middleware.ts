import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from './types/models';
import { applyRateLimit, createRateLimiter, getRateLimitRule } from './lib/rateLimiter';
import { logger } from './lib/logger';
import { 
  securityMiddleware, 
  corsMiddleware, 
  addSecurityHeaders,
  logSecurityEvent 
} from './lib/security';

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

// Rate limiters spécialisés
const authRateLimiter = createRateLimiter.auth();
const apiRateLimiter = createRateLimiter.api();
const generalRateLimiter = createRateLimiter.general();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. SÉCURITÉ - Vérifications de sécurité globales
  const securityResponse = await securityMiddleware(request);
  if (securityResponse) {
    logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      ip: request.ip,
      userAgent: request.headers.get('user-agent'),
      url: request.url,
      pathname
    });
    return addSecurityHeaders(securityResponse);
  }
  
  // 2. RATE LIMITING - Application du rate limiting adaptatif
  const rateLimitRule = getRateLimitRule(pathname);
  const rateLimiter = createRateLimiter.custom({
    windowMs: rateLimitRule.windowMs,
    maxRequests: rateLimitRule.maxRequests,
    skipSuccessfulRequests: rateLimitRule.skipSuccessfulRequests
  });
  
  const rateLimitResult = await applyRateLimit(request, rateLimiter);
  
  // Si rate limit dépassé, retourner erreur 429
  if (!rateLimitResult.allowed) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: request.ip,
      userAgent: request.headers.get('user-agent'),
      url: request.url,
      pathname,
      limit: rateLimitRule.maxRequests,
      window: rateLimitRule.windowMs
    });

    const response = NextResponse.json(
      { 
        error: 'Trop de requêtes. Veuillez patienter.',
        retryAfter: rateLimitResult.retryAfter,
        limit: rateLimitRule.maxRequests,
        windowMs: rateLimitRule.windowMs
      },
      { status: 429 }
    );
    
    // Ajouter les headers de rate limiting
    rateLimitResult.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return addSecurityHeaders(response);
  }
  
  // Skip authentication check for public routes or API routes that aren't protected
  if (
    publicRoutes.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Static files like favicon.ico
  ) {
    return NextResponse.next();
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

  // Rate limiting déjà appliqué ci-dessus, pas besoin de dupliquer

  // 3. CORS - Appliquer les headers CORS pour les APIs
  let response = NextResponse.next();
  
  if (pathname.startsWith('/api/')) {
    response = corsMiddleware(request, response);
  }
  
  // 4. HEADERS DE SÉCURITÉ - Ajouter les headers de sécurité
  response = addSecurityHeaders(response);
  
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