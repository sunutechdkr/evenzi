"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  CalendarIcon, 
  ClockIcon,
  MapPinIcon,
  TicketIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";

// Types pour les événements et inscriptions
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

export default function UserDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    upcomingEvents: 0,
    ongoingEvents: 0,
    pastEvents: 0,
    checkedEvenzis: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Registration[]>([]);

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

  // Récupérer les inscriptions de l'utilisateur connecté
  useEffect(() => {
    const fetchUserRegistrations = async () => {
      if (!session?.user?.email) return;
      
      try {
        // Dans une vraie app, cet endpoint récupérerait les inscriptions de l'utilisateur
        const response = await fetch(`/api/users/registrations?email=${encodeURIComponent(session.user.email)}`);
        if (response.ok) {
          const registrations = await response.json() as Registration[];
          
          // Calculer les statistiques
          const now = new Date();
          const upcomingEvents = registrations.filter(reg => {
            if (!reg.event) return false;
            try {
              const startDate = new Date(getStartDate(reg.event));
              return startDate > now && !isToday(startDate);
            } catch {
              return false;
            }
          });
          
          const ongoing = registrations.filter(reg => {
            if (!reg.event) return false;
            try {
              const startDate = new Date(getStartDate(reg.event));
              const endDate = new Date(getEndDate(reg.event));
              return (isToday(startDate) || (startDate < now && endDate > now));
            } catch {
              return false;
            }
          });
          
          const past = registrations.filter(reg => {
            if (!reg.event) return false;
            try {
              const endDate = new Date(getEndDate(reg.event));
              return isPast(endDate) && !isToday(endDate);
            } catch {
              return false;
            }
          });

          const checkedIn = registrations.filter(reg => reg.checkedIn);
          
          setStats({
            totalRegistrations: registrations.length,
            upcomingEvents: upcomingEvents.length,
            ongoingEvents: ongoing.length,
            pastEvents: past.length,
            checkedEvenzis: checkedIn.length,
          });
          
          // Trier par date de début (plus récents en premier)
          const sortedRegistrations = registrations
            .filter(reg => reg.event)
            .sort((a, b) => {
              try {
                return new Date(getStartDate(b.event!)).getTime() - new Date(getStartDate(a.event!)).getTime();
              } catch {
                return 0;
              }
            })
            .slice(0, 3);
          
          setRecentEvents(sortedRegistrations);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user registrations:", error);
        setLoading(false);
      }
    };

    fetchUserRegistrations();
  }, [session?.user?.email]);

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
    } catch {
      return { status: "unknown", color: "gray" };
    }
  };

  return (
    <div className="w-full h-full">
        <main className="dashboard-main p-6">
          <div className="dashboard-header mb-8">
            <div>
              <h1 className="dashboard-title text-2xl font-bold text-gray-800">Mon espace événements</h1>
              <p className="dashboard-description text-gray-600 mt-1">Gérez vos inscriptions et suivez vos événements</p>
            </div>
          </div>

          {/* Stats Cards pour utilisateur */}
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#81B441]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Mes Inscriptions</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalRegistrations}</p>
                  <p className="text-xs text-[#81B441] mt-1">Inscriptions totales</p>
                </div>
                <div className="bg-[#81B441]/10 p-3 rounded-lg">
                  <TicketIcon className="w-6 h-6 text-[#81B441]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Événements en cours</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.ongoingEvents}</p>
                  <p className="text-xs text-yellow-500 mt-1">En cours aujourd&apos;hui</p>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Événements à venir</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.upcomingEvents}</p>
                  <p className="text-xs text-green-500 mt-1">Prochains événements</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Événements récents */}
          <div className="grid grid-cols-1 gap-8">
            <div className="w-full">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800">Mes événements récents</h2>
                </div>
                
                <div className="p-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentEvents.length > 0 ? (
                    <div className="space-y-4">
                      {recentEvents.map((registration) => {
                        const event = registration.event!;
                        const eventStatus = getEventStatus(event);
                        
                        return (
                          <div key={registration.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-800">{event.name}</h3>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    eventStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                                    eventStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {eventStatus.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>{formatEventDate(getStartDate(event))}</span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPinIcon className="w-4 h-4" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <CheckCircleIcon className={`w-4 h-4 ${registration.checkedIn ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span>{registration.checkedIn ? 'Check-in effectué' : 'En attente'}</span>
                                  </div>
                                </div>
                              </div>
                              <Link 
                                href={`/dashboard/user/events/${event.id}`}
                                className="text-[#81B441] hover:text-[#6a9636] text-sm font-medium"
                              >
                                Voir détails
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune inscription</h3>
                      <p className="text-gray-600">Vous n&apos;êtes inscrit à aucun événement pour le moment.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
} 