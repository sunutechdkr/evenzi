"use client";

import Sidebar from "@/components/dashboard/Sidebar";

/**
 * Layout racine pour tout le dashboard (/dashboard/*)
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
