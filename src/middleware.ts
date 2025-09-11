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

// Rate limiters spécialisés
const authRateLimiter = createRateLimiter.auth();
const apiRateLimiter = createRateLimiter.api();
const generalRateLimiter = createRateLimiter.general();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Appliquer le rate limiting en fonction du type de route
  let rateLimitResult;
  
  if (pathname.startsWith('/api/auth')) {
    rateLimitResult = await applyRateLimit(request, authRateLimiter);
  } else if (pathname.startsWith('/api/')) {
    rateLimitResult = await applyRateLimit(request, apiRateLimiter);
  } else {
    rateLimitResult = await applyRateLimit(request, generalRateLimiter);
  }
  
  // Si rate limit dépassé, retourner erreur 429
  if (!rateLimitResult.allowed) {
    const response = NextResponse.json(
      { 
        error: 'Too many requests',
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

  // Continue to protected route
  return NextResponse.next();
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