import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Layout pour toutes les pages admin (/dashboard/admin/*)
 * Vérification côté SERVEUR - Aucun rendu côté client avant authentification
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérification côté SERVEUR (bloque tout rendu avant vérification)
  const session = await getServerSession(authOptions);
  
  // Pas de session → redirection immédiate (aucun HTML envoyé au client)
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/admin');
  }

  // Vérifier que l'utilisateur est ADMIN
  const userRole = session.user?.role || 'USER';
  if (userRole !== 'ADMIN') {
    // Rediriger vers le dashboard approprié selon le rôle
    if (userRole === 'ORGANIZER') {
      redirect('/dashboard/events');
    } else if (userRole === 'USER') {
      redirect('/dashboard/user');
    }
    redirect('/dashboard');
  }

  // Autorisé → rendre le contenu
  return <>{children}</>;
}

