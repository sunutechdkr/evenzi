"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  PlusIcon, 
  ArrowRightIcon,
  UsersIcon, 
  CalendarIcon, 
  ClockIcon
} from "@heroicons/react/24/outline";
import { EventTable } from "@/components/dashboard/EventTable";

// Event type definition
interface Event {
  id: string;
  name: string;
  description?: string;
  location: string;
  slug: string;
  banner?: string;
  logo?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  sector?: string;
  type?: string;
  format?: string;
  timezone?: string;
  videoUrl?: string;
  supportEmail?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
    ongoingEvents: 0,
    pastEvents: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const events = await response.json() as Event[];
          
          // Calculate stats
          const now = new Date();
          const upcoming = events.filter(event => {
            const startDate = new Date(event.startDate);
            return startDate > now && !isToday(startDate);
          });
          
          const ongoing = events.filter(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            return (isToday(startDate) || (startDate < now && endDate > now));
          });
          
          const past = events.filter(event => {
            const endDate = new Date(event.endDate);
            return isPast(endDate) && !isToday(endDate);
          });
          
          setStats({
            totalEvents: events.length,
            upcomingEvents: upcoming.length,
            ongoingEvents: ongoing.length,
            pastEvents: past.length,
            totalRegistrations: 0 // This would come from a separate API call
          });
          
          // Sort events by start date (newest first) and take the most recent 3
          const sorted = [...events].sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          ).slice(0, 3);
          
          setRecentEvents(sorted);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format date for display
  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <main className="dashboard-main">
          <div className="dashboard-header mb-8">
            <div>
              <h1 className="dashboard-title text-2xl font-bold text-gray-800">Tableau de bord administrateur</h1>
              <p className="dashboard-description text-gray-600 mt-1">Gérez vos événements et suivez les statistiques</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/events/create"
                className="bg-[#81B441] hover:bg-[#6a9636] text-white py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Créer un événement</span>
              </Link>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="stats-grid mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#81B441]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Total Événements</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalEvents}</p>
                </div>
                <div className="bg-[#81B441]/10 p-3 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-[#81B441]" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#81B441]"></span>
                  Événements publiés
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Participants</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalRegistrations}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Inscriptions totales
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Événements en cours</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.ongoingEvents}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  En cours aujourd&apos;hui
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Événements à venir</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.upcomingEvents}</p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Prochains événements
                </span>
              </div>
            </div>
          </div>
          
          {/* Recent Events */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Événements récents</h2>
              <Link 
                href="/dashboard/events"
                className="text-[#81B441] hover:text-[#6a9636] flex items-center gap-1 transition-colors text-sm"
              >
                <span>Voir tous les événements</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#81B441]"></div>
              </div>
            ) : recentEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentEvents.map((event) => (
                  <Link 
                    href={`/dashboard/events/${event.id}`} 
                    key={event.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-32 bg-gray-200 relative">
                      {event.banner ? (
                        <img 
                          src={event.banner} 
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                          <CalendarIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white/90 px-3 py-1 rounded-full text-xs font-medium">
                        {formatEventDate(event.startDate)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1 truncate">{event.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="text-xs flex gap-2">
                        {event.type && (
                          <span className="bg-gray-100 px-2 py-1 rounded-full">{event.type}</span>
                        )}
                        {event.format && (
                          <span className="bg-gray-100 px-2 py-1 rounded-full">{event.format}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun événement disponible</h3>
                <p className="text-gray-500 mb-4">Créez votre premier événement pour commencer</p>
                <Link 
                  href="/dashboard/events/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#81B441] hover:bg-[#6a9636]"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Créer un événement
                </Link>
              </div>
            )}
          </div>
          
          {/* Events Table */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Gestion des événements</h2>
              <div className="flex space-x-4 items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    className="px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#81B441]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <select
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#81B441]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="upcoming">À venir</option>
                  <option value="ongoing">En cours</option>
                  <option value="past">Passés</option>
                </select>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <EventTable searchQuery={searchQuery} statusFilter={statusFilter} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 