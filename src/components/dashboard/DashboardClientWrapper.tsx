"use client";

import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AdminNotificationPanel } from "@/components/dashboard/NotificationPanel";

/**
 * Wrapper client pour le dashboard
 * Gère le SidebarProvider et le panneau de notifications
 * Séparé du layout serveur pour permettre la vérification d'authentification côté serveur
 */
export function DashboardClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar onNotificationToggle={setShowNotifications} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
        <AdminNotificationPanel 
          show={showNotifications} 
          onClose={() => setShowNotifications(false)} 
        />
      </div>
    </SidebarProvider>
  );
}

