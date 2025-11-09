import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Layout pour toutes les pages événements organisateur (/dashboard/events/*)
 * Vérification côté SERVEUR - Aucun rendu côté client avant authentification
 */
export default async function EventsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérification côté SERVEUR (bloque tout rendu avant vérification)
  const session = await getServerSession(authOptions);
  
  // Pas de session → redirection immédiate (aucun HTML envoyé au client)
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/events');
  }

  // Vérifier que l'utilisateur est ORGANIZER ou ADMIN
  const userRole = session.user?.role || 'USER';
  if (userRole !== 'ORGANIZER' && userRole !== 'ADMIN') {
    // Si c'est un USER, rediriger vers son dashboard
    if (userRole === 'USER') {
      redirect('/dashboard/user');
    }
    redirect('/dashboard');
  }

  // Autorisé → rendre le contenu
  return <>{children}</>;
}

