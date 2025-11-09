import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Layout racine pour tout le dashboard (/dashboard/*)
 * Vérification côté SERVEUR uniquement - Les sidebars sont gérés par chaque page
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

  // Session valide → rendre le contenu (chaque page gère son propre sidebar)
  return <>{children}</>;
}
