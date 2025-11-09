import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClientWrapper } from "@/components/dashboard/DashboardClientWrapper";

/**
 * Layout racine pour tout le dashboard (/dashboard/*)
 * Vérification côté SERVEUR - Aucun rendu côté client avant authentification
 * 
 * Ce layout protège TOUTES les pages sous /dashboard
 * Les sous-layouts (user, events, admin, etc.) ajoutent des vérifications de rôle supplémentaires
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérification côté SERVEUR (bloque tout rendu avant vérification)
  const session = await getServerSession(authOptions);
  
  // Pas de session → redirection immédiate (aucun HTML envoyé au client)
  if (!session) {
    redirect('/login?callbackUrl=/dashboard');
  }

  // Session valide → rendre avec le wrapper client (Sidebar + Notifications)
  return (
    <DashboardClientWrapper>
      {children}
    </DashboardClientWrapper>
  );
}
