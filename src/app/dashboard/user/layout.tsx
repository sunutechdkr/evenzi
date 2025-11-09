import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Layout pour toutes les pages utilisateur (/dashboard/user/*)
 * Vérification côté SERVEUR - Aucun rendu côté client avant authentification
 */
export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérification côté SERVEUR (bloque tout rendu avant vérification)
  const session = await getServerSession(authOptions);
  
  // Pas de session → redirection immédiate (aucun HTML envoyé au client)
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/user');
  }

  // Vérifier que l'utilisateur a bien le rôle USER
  // Note: ADMIN et ORGANIZER peuvent aussi accéder aux pages USER
  const userRole = session.user?.role || 'USER';
  if (userRole !== 'USER' && userRole !== 'ADMIN' && userRole !== 'ORGANIZER') {
    redirect('/dashboard');
  }

  // Autorisé → rendre le contenu
  return <>{children}</>;
}

