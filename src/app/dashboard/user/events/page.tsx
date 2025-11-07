"use client";

import React, { useState, useEffect } from "react";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  FunnelIcon 
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";

// Types
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

interface Registration {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  type: string;
  jobTitle?: string;
  company?: string;
  qrCode: string;
  shortCode: string;
  checkedIn: boolean;
  checkInTime?: string;
  createdAt: string;
  updatedAt: string;
  event?: Event;
}

export default function UserEventsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);

  // Détecter si l'écran est de taille mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper functions pour les dates
  const getStartDate = (event: Event) => {
    return event?.startDate;
  };
  
  const getEndDate = (event: Event) => {
    return event?.endDate;
  };

  // Récupérer les inscriptions de l'utilisateur
  useEffect(() => {
    const fetchUserRegistrations = async () => {
      if (!session?.user?.email) return;
      
      try {
        const response = await fetch(`/api/users/registrations?email=${encodeURIComponent(session.user.email)}`);
        if (response.ok) {
          const data = await response.json() as Registration[];
          setRegistrations(data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user registrations:", error);
        setLoading(false);
      }
    };

    fetchUserRegistrations();
  }, [session?.user?.email]);

  // Filtrer les inscriptions
  useEffect(() => {
    let filtered = [...registrations];

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reg => 
        reg.event?.name.toLowerCase().includes(query) ||
        reg.event?.location.toLowerCase().includes(query) ||
        reg.event?.sector?.toLowerCase().includes(query)
      );
    }

    // Filtrer par statut
    if (statusFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter(reg => {
        if (!reg.event) return false;
        
        try {
          const startDate = new Date(getStartDate(reg.event));
          const endDate = new Date(getEndDate(reg.event));
          
          switch (statusFilter) {
            case "upcoming":
              return startDate > now && !isToday(startDate);
            case "ongoing":
              return isToday(startDate) || (startDate < now && endDate > now);
            case "past":
              return isPast(endDate) && !isToday(endDate);
            case "checked-in":
              return reg.checkedIn;
            case "not-checked-in":
              return !reg.checkedIn;
            default:
              return true;
          }
        } catch (error) {
          return false;
        }
      });
    }

    setFilteredRegistrations(filtered);
  }, [registrations, searchQuery, statusFilter]);

  // Formater la date pour l'affichage
  const formatEventDate = (dateString: string) => {
    if (!dateString) return "Date indisponible";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date invalide";
    }
  };

  // Obtenir le statut de l'événement
  const getEventStatus = (event: Event) => {
    if (!event) return { status: "unknown", color: "gray" };
    
    try {
      const now = new Date();
      const startDate = new Date(getStartDate(event));
      const endDate = new Date(getEndDate(event));
      
      if (isToday(startDate) || (startDate < now && endDate > now)) {
        return { status: "En cours", color: "yellow" };
      } else if (startDate > now) {
        return { status: "À venir", color: "green" };
      } else {
        return { status: "Terminé", color: "gray" };
      }
    } catch (error) {
      return { status: "unknown", color: "gray" };
    }
  };

  return (
    <div className="w-full h-full">
        <main className="dashboard-main p-6">
          <div className="dashboard-header mb-8">
            <div>
              <h1 className="dashboard-title text-2xl font-bold text-gray-800">Mes événements</h1>
              <p className="dashboard-description text-gray-600 mt-1">Gérez tous vos événements et inscriptions</p>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Barre de recherche */}
              <div className="flex-1">
                <div className="relative">
                  <CalendarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#81B441] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtre par statut */}
              <div className="lg:w-64">
                <div className="relative">
                  <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#81B441] focus:border-transparent appearance-none"
                  >
                    <option value="all">Tous les événements</option>
                    <option value="upcoming">À venir</option>
                    <option value="ongoing">En cours</option>
                    <option value="past">Terminés</option>
                    <option value="checked-in">Check-in effectué</option>
                    <option value="not-checked-in">En attente de check-in</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#81B441]">{registrations.length}</div>
                <div className="text-sm text-gray-600">Total inscriptions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {registrations.filter(reg => {
                    if (!reg.event) return false;
                    try {
                      const startDate = new Date(getStartDate(reg.event));
                      return startDate > new Date() && !isToday(startDate);
                    } catch (error) {
                      return false;
                    }
                  }).length}
                </div>
                <div className="text-sm text-gray-600">À venir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {registrations.filter(reg => {
                    if (!reg.event) return false;
                    try {
                      const startDate = new Date(getStartDate(reg.event));
                      const endDate = new Date(getEndDate(reg.event));
                      const now = new Date();
                      return isToday(startDate) || (startDate < now && endDate > now);
                    } catch (error) {
                      return false;
                    }
                  }).length}
                </div>
                <div className="text-sm text-gray-600">En cours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {registrations.filter(reg => reg.checkedIn).length}
                </div>
                <div className="text-sm text-gray-600">Check-in effectués</div>
              </div>
            </div>
          </div>

          {/* Liste des événements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredRegistrations.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredRegistrations.map((registration) => {
                  const event = registration.event!;
                  const eventStatus = getEventStatus(event);
                  
                  return (
                    <div key={registration.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.name}</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatEventDate(getStartDate(event))}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4" />
                              <span>Inscrit le {formatEventDate(registration.createdAt)}</span>
                            </div>
                          </div>

                          {event.description && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{event.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {searchQuery || statusFilter !== "all" ? "Aucun événement trouvé" : "Aucune inscription"}
                </h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== "all" 
                    ? "Essayez de modifier vos critères de recherche ou filtres."
                    : "Vous n'êtes inscrit à aucun événement pour le moment."
                  }
                </p>
              </div>
            )}
          </div>
        </main>
    </div>
  );
} 