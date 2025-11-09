import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * API de déconnexion - Logging et actions post-déconnexion
 * 
 * Cette API est optionnelle mais permet de :
 * - Logger les déconnexions pour analytics
 * - Effectuer des actions de nettoyage si nécessaire
 * - Tracker les patterns de déconnexion
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      // Logger la déconnexion pour analytics
      logger.info('User logged out', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[LOGOUT] User ${session.user.id} (${session.user.email}) logged out at ${new Date().toISOString()}`);
      
      // Optionnel : Actions de nettoyage supplémentaires
      // - Invalider des tokens côté serveur
      // - Nettoyer des sessions actives
      // - Mettre à jour des statistiques
    }
    
    // Toujours retourner success même si pas de session
    // (l'utilisateur peut déjà être déconnecté)
    return NextResponse.json({ 
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    // En cas d'erreur, retourner success quand même
    // pour ne pas bloquer la déconnexion côté client
    console.error('[LOGOUT] Error during logout:', error);
    return NextResponse.json({ 
      success: true,
      message: 'Déconnexion réussie'
    });
  }
}

