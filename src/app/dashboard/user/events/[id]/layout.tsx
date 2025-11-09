"use client";

import { use } from "react";
import { UserEventSidebar } from "@/components/dashboard/UserEventSidebar";

/**
 * Layout pour les pages d'événement (Participant)
 */
export default function UserEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);

  return (
    <div className="flex h-screen overflow-hidden">
      <UserEventSidebar eventId={eventId} />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}

