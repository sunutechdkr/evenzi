"use client";

import { use } from "react";
import { EventSidebar } from "@/components/dashboard/EventSidebar";

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

  return (
    <div className="flex h-screen overflow-hidden">
      <EventSidebar eventId={eventId} />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}

