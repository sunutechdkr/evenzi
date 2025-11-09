/**
 * Validation sécurisée des URLs de redirection
 * Protection contre les attaques Open Redirect
 * 
 * @module redirectValidation
 */

/**
 * Vérifie si une URL de redirection est valide et sécurisée
 * 
 * @param url - L'URL à valider
 * @returns true si l'URL est valide et sécurisée, false sinon
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  try {
    // Si l'URL commence par un slash, c'est une URL relative (valide)
    if (url.startsWith('/')) {
      // Vérifier que ce n'est pas une URL avec double slash (//evil.com)
      if (url.startsWith('//')) {
        return false;
      }
      
      // Liste blanche des routes autorisées
      const allowedRoutes = [
        '/dashboard',
        '/event/',
        '/auth/',
        '/profile',
      ];
      
      // Vérifier que la route commence par une route autorisée
      const isAllowed = allowedRoutes.some(route => 
        url.startsWith(route)
      );
      
      return isAllowed;
    }
    
    // Si l'URL contient un protocole, vérifier qu'elle est interne
    const parsedUrl = new URL(url);
    
    // Vérifier qu'il n'y a pas de protocoles dangereux
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false;
    }
    
    // Récupérer les hosts autorisés depuis les variables d'environnement
    const allowedHosts = [
      'localhost',
      '127.0.0.1',
      'evenzi.io',
      'studio.evenzi.io',
      'www.evenzi.io',
    ];
    
    // Ajouter le host depuis NEXT_PUBLIC_APP_URL si disponible
    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
        allowedHosts.push(appUrl.host);
      } catch {
        // Ignorer si l'URL est mal formée
      }
    }
    
    // Vérifier que le host est dans la liste blanche
    const isAllowedHost = allowedHosts.some(host => 
      parsedUrl.host === host || 
      parsedUrl.host.endsWith(`.${host}`)
    );
    
    if (!isAllowedHost) {
      return false;
    }
    
    // Vérifier que le pathname est autorisé
    const allowedRoutes = [
      '/dashboard',
      '/event/',
      '/auth/',
      '/profile',
    ];
    
    const isAllowedPath = allowedRoutes.some(route => 
      parsedUrl.pathname.startsWith(route)
    );
    
    return isAllowedPath;
    
  } catch (error) {
    // Si le parsing échoue, l'URL n'est pas valide
    console.error('Error validating redirect URL:', error);
    return false;
  }
}

/**
 * Nettoie et normalise l'URL de redirection
 * Retire les paramètres sensibles et valide l'URL
 * 
 * @param url - L'URL à nettoyer
 * @returns L'URL nettoyée ou une URL par défaut sécurisée
 */
export function sanitizeRedirectUrl(url: string | null | undefined): string {
  if (!url || !isValidRedirectUrl(url)) {
    return '/dashboard'; // Fallback sécurisé
  }
  
  try {
    // Si c'est une URL relative, la retourner directement
    if (url.startsWith('/')) {
      return url;
    }
    
    // Si c'est une URL absolue, extraire le pathname et search
    const parsedUrl = new URL(url);
    
    // Créer une nouvelle URL sans les paramètres sensibles
    const cleanUrl = new URL(parsedUrl.pathname + parsedUrl.search, parsedUrl.origin);
    
    // Retourner seulement le pathname + search (sans hash pour sécurité)
    return cleanUrl.pathname + cleanUrl.search;
    
  } catch (error) {
    console.error('Error sanitizing redirect URL:', error);
    return '/dashboard';
  }
}

/**
 * Vérifie si l'utilisateur a les permissions pour accéder à une URL
 * 
 * @param url - L'URL à vérifier
 * @param userRole - Le rôle de l'utilisateur (ADMIN, ORGANIZER, USER, STAFF)
 * @returns true si l'utilisateur peut accéder à cette URL
 */
export function canUserAccessUrl(url: string, userRole: string): boolean {
  try {
    const pathname = url.startsWith('/') 
      ? url 
      : new URL(url).pathname;
    
    // Routes admin uniquement
    const adminOnlyRoutes = [
      '/dashboard/admin',
      '/dashboard/users',
      '/dashboard/settings',
    ];
    
    if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
      return userRole === 'ADMIN';
    }
    
    // Routes organisateur et admin
    const organizerRoutes = [
      '/dashboard/events/create',
      '/dashboard/analytics',
      '/dashboard/events/', // Gestion des événements
    ];
    
    if (organizerRoutes.some(route => pathname.startsWith(route))) {
      return userRole === 'ORGANIZER' || userRole === 'ADMIN' || userRole === 'STAFF';
    }
    
    // Routes utilisateur uniquement
    const userOnlyRoutes = [
      '/dashboard/user',
    ];
    
    if (userOnlyRoutes.some(route => pathname.startsWith(route))) {
      return userRole === 'USER';
    }
    
    // Routes publiques (dashboard général, profile, event)
    const publicAuthenticatedRoutes = [
      '/dashboard',
      '/profile',
      '/event/',
      '/auth/',
    ];
    
    if (publicAuthenticatedRoutes.some(route => pathname.startsWith(route))) {
      return true; // Accessible à tous les utilisateurs authentifiés
    }
    
    // Par défaut, refuser l'accès
    return false;
    
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

/**
 * Obtient l'URL de redirection par défaut selon le rôle utilisateur
 * 
 * @param userRole - Le rôle de l'utilisateur
 * @returns L'URL de redirection par défaut pour ce rôle
 */
export function getDefaultRedirectForRole(userRole: string): string {
  switch (userRole) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'ORGANIZER':
      return '/dashboard/events';
    case 'STAFF':
      return '/dashboard/events';
    case 'USER':
      return '/dashboard/user';
    default:
      return '/dashboard';
  }
}

/**
 * Obtient l'URL de redirection finale en tenant compte des permissions
 * 
 * @param requestedUrl - L'URL demandée par l'utilisateur
 * @param userRole - Le rôle de l'utilisateur
 * @returns L'URL de redirection finale (demandée si autorisée, sinon par défaut)
 */
export function getFinalRedirectUrl(
  requestedUrl: string | null | undefined, 
  userRole: string
): string {
  // Si pas d'URL demandée, retourner l'URL par défaut
  if (!requestedUrl) {
    return getDefaultRedirectForRole(userRole);
  }
  
  // Valider et nettoyer l'URL
  const cleanUrl = sanitizeRedirectUrl(requestedUrl);
  
  // Vérifier les permissions
  if (canUserAccessUrl(cleanUrl, userRole)) {
    return cleanUrl;
  }
  
  // Si pas autorisé, retourner l'URL par défaut
  console.warn(`User ${userRole} attempted to access unauthorized URL: ${cleanUrl}`);
  return getDefaultRedirectForRole(userRole);
}

/**
 * Logger pour le monitoring des tentatives de redirection
 * 
 * @param url - L'URL de destination
 * @param userRole - Le rôle de l'utilisateur
 * @param allowed - Si la redirection a été autorisée
 */
export function logRedirectAttempt(
  url: string, 
  userRole: string, 
  allowed: boolean
): void {
  const logData = {
    url,
    userRole,
    allowed,
    timestamp: new Date().toISOString(),
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Redirect attempt:', logData);
  }
  
  // En production, logger seulement les tentatives refusées
  if (process.env.NODE_ENV === 'production' && !allowed) {
    console.warn('🚫 Unauthorized redirect attempt:', logData);
  }
}

