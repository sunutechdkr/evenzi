"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { EventTable } from "@/components/dashboard/EventTable";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  return (
    <div className="w-full h-full">
      <main className="p-6">
          <div className="dashboard-header mb-8">
            <div>
              <h1 className="dashboard-title">Événements</h1>
              <p className="dashboard-description">Gérez tous vos événements</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/events/create" className="bg-[#81B441] hover:bg-[#6a9636] text-white py-2 px-4 rounded-md flex items-center gap-2 transition-colors">
                <PlusIcon className="w-5 h-5" />
                <span>Créer un événement</span>
              </Link>
            </div>
          </div>
          
          {/* Filtres */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un événement..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#81B441] focus:border-[#81B441] outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter("")}
                className={`px-3 py-2 rounded-lg text-sm ${!statusFilter ? 'bg-[#81B441] text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setStatusFilter("upcoming")}
                className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'upcoming' ? 'bg-[#81B441] text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                À venir
              </button>
              <button
                onClick={() => setStatusFilter("ongoing")}
                className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'ongoing' ? 'bg-[#81B441] text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                En cours
              </button>
              <button
                onClick={() => setStatusFilter("past")}
                className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'past' ? 'bg-[#81B441] text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                Terminés
              </button>
            </div>
          </div>
          
          <EventTable searchQuery={searchQuery} statusFilter={statusFilter} />
      </main>
    </div>
  );
} 