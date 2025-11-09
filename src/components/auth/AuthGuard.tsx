"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { canUserAccessUrl } from "@/lib/redirectValidation";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'ORGANIZER' | 'ADMIN' | 'STAFF';
  allowedRoles?: Array<'USER' | 'ORGANIZER' | 'ADMIN' | 'STAFF'>;
  fallbackUrl?: string;
}

/**
 * AuthGuard - Composant de protection qui bloque TOUT rendu jusqu'à authentification vérifiée
 * 
 * Utilisation:
 * - Wrap les pages protégées avec ce composant
 * - Aucun contenu ne sera affiché pendant la vérification
 * - Redirection automatique vers login si non authentifié
 * - Vérification des rôles et permissions
 */
export default function AuthGuard({ 
  children, 
  requiredRole, 
  allowedRoles,
  fallbackUrl = '/dashboard'
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Pendant le chargement de la session, ne rien faire
    if (status === 'loading') {
      return;
    }

    // Pas de session → rediriger immédiatement vers login
    if (status === 'unauthenticated' || !session) {
      setIsRedirecting(true);
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    const userRole = session.user?.role || 'USER';

    // Vérifier rôle spécifique requis
    if (requiredRole && userRole !== requiredRole) {
      setIsRedirecting(true);
      router.push(fallbackUrl);
      return;
    }

    // Vérifier liste de rôles autorisés
    if (allowedRoles && !allowedRoles.includes(userRole as any)) {
      setIsRedirecting(true);
      router.push(fallbackUrl);
      return;
    }

    // Vérifier les permissions d'URL (protection contre les routes non autorisées)
    if (!canUserAccessUrl(pathname, userRole)) {
      setIsRedirecting(true);
      router.push(fallbackUrl);
      return;
    }

    // Tout est OK → autoriser le rendu
    setIsAuthorized(true);
  }, [status, session, pathname, router, requiredRole, allowedRoles, fallbackUrl]);

  // PENDANT LA VÉRIFICATION OU REDIRECTION : Écran blanc avec loader
  // Aucun contenu de l'application n'est visible
  if (status === 'loading' || !isAuthorized || isRedirecting) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isRedirecting ? 'Redirection...' : 'Vérification de vos accès...'}
          </p>
        </div>
      </div>
    );
  }

  // AUTHENTIFIÉ ET AUTORISÉ : Afficher le contenu réel
  return <>{children}</>;
}

