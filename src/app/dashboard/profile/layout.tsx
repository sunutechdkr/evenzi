import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Layout pour toutes les pages profil (/dashboard/profile/*)
 * Vérification côté SERVEUR - Aucun rendu côté client avant authentification
 */
export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérification côté SERVEUR (bloque tout rendu avant vérification)
  const session = await getServerSession(authOptions);
  
  // Pas de session → redirection immédiate (aucun HTML envoyé au client)
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/profile');
  }

  // Tous les utilisateurs authentifiés peuvent accéder à leur profil
  // Pas de restriction de rôle ici

  // Autorisé → rendre le contenu
  return <>{children}</>;
}

