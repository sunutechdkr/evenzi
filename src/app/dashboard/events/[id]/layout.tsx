"use client";

import { useState } from "react";
import { use } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminEventSidebar } from "@/components/dashboard/AdminEventSidebar";
import { AdminNotificationPanel } from "@/components/dashboard/NotificationPanel";

/**
 * Layout pour les pages de gestion d'événement (Admin)
 */
export default function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <AdminEventSidebar 
          eventId={eventId} 
          onNotificationToggle={setShowNotifications} 
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-2">
            <SidebarTrigger className="md:hidden" />
          </div>
          {children}
        </main>
        <AdminNotificationPanel 
          show={showNotifications} 
          onClose={() => setShowNotifications(false)}
          eventId={eventId}
        />
      </div>
    </SidebarProvider>
  );
}

