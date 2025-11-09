import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Layout pour toutes les pages événements publiques (/event/*)
 * Vérification côté SERVEUR - Aucun rendu côté client avant authentification
 * 
 * Les pages d'événements nécessitent une authentification pour être consultées
 */
export default async function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérification côté SERVEUR (bloque tout rendu avant vérification)
  const session = await getServerSession(authOptions);
  
  // Pas de session → redirection immédiate (aucun HTML envoyé au client)
  if (!session) {
    redirect('/login?callbackUrl=/event');
  }

  // Session valide → autoriser le rendu
  // Tous les utilisateurs authentifiés peuvent consulter les pages d'événements
  return <>{children}</>;
}

