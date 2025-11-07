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

  // Détecter si l'écran est de taille mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Vérifier initialement
    checkMobile();
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkMobile);
    
    // Nettoyer
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper function to safely get dates from events (handling both camelCase and snake_case)
  const getStartDate = (event: any) => {
    return event?.startDate || event?.start_date;
  };
  
  const getEndDate = (event: any) => {
    return event?.endDate || event?.end_date;
  };

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
            try {
              const startDate = new Date(getStartDate(event));
              return startDate > now && !isToday(startDate);
            } catch (error) {
              console.error("Error parsing start date:", error);
              return false;
            }
          });
          
          const ongoing = events.filter(event => {
            try {
              const startDate = new Date(getStartDate(event));
              const endDate = new Date(getEndDate(event));
              return (isToday(startDate) || (startDate < now && endDate > now));
            } catch (error) {
              console.error("Error parsing date:", error);
              return false;
            }
          });
          
          const past = events.filter(event => {
            try {
              const endDate = new Date(getEndDate(event));
              return isPast(endDate) && !isToday(endDate);
            } catch (error) {
              console.error("Error parsing end date:", error);
              return false;
            }
          });
          
          setStats({
            totalEvents: events.length,
            upcomingEvents: upcoming.length,
            ongoingEvents: ongoing.length,
            pastEvents: past.length,
            totalRegistrations: 0 // This would come from a separate API call
          });
          
          // Sort events by start date (newest first) and take the most recent 3
          const sorted = [...events]
            .filter(event => getStartDate(event)) // Only include events with a valid start date
            .sort((a, b) => {
              try {
                return new Date(getStartDate(b)).getTime() - new Date(getStartDate(a)).getTime();
              } catch (error) {
                return 0; // In case of error, don't change order
              }
            })
            .slice(0, 3);
          
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
  const formatEventDate = (dateString: any) => {
    if (!dateString) return "Date indisponible";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date invalide";
    }
  };

  return (
    <div className="dashboard-container flex h-screen bg-gray-50">
      <Sidebar onExpandChange={(expanded) => setSidebarExpanded(expanded)} />
      <div 
        className={`dashboard-content flex-1 overflow-auto transition-all duration-300 ${
          sidebarExpanded ? (isMobile ? 'ml-0' : 'ml-64') : 'ml-20'
        }`}
      >
        <main className="dashboard-main p-6">
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
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                        {formatEventDate(getStartDate(event))}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1 truncate">{event.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        <span>{formatEventDate(getStartDate(event))}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded-full">
                          Publié
                        </span>
                        <button className="text-[#81B441] hover:text-[#6a9636] text-sm flex items-center">
                          Voir
                          <ArrowRightIcon className="w-3 h-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun événement</h3>
                <p className="text-gray-500 mb-4">Vous n&apos;avez pas encore créé d&apos;événement</p>
                <Link 
                  href="/dashboard/events/create"
                  className="inline-flex items-center text-[#81B441] hover:text-[#6a9636]"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  <span>Créer mon premier événement</span>
                </Link>
              </div>
            )}
          </div>
          
          {/* Recent activity or additional content can go here */}
        </main>
      </div>
    </div>
  );
}
