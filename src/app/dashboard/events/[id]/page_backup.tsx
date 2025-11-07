"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useParams } from "next/navigation";
import { 
  ArrowLeftIcon, 
  UserPlusIcon, 
  DocumentTextIcon, 
  ShareIcon, 
  PencilIcon, 
  PhotoIcon,
  QrCodeIcon,
  CalendarIcon,
  EyeIcon
} from "@heroicons/react/24/outline";

// Type d'événement
type Event = {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string;
  registrations: number;
  banner?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  start_date?: string | Date; // Pour la compatibilité avec snake_case
  end_date?: string | Date; // Pour la compatibilité avec snake_case
  sector?: string;
  type?: string;
  format?: string;
  timezone?: string;
  startTime?: string;
  endTime?: string;
  start_time?: string; // Pour la compatibilité avec snake_case
  end_time?: string; // Pour la compatibilité avec snake_case
  videoUrl?: string;
  supportEmail?: string;
  video_url?: string; // Pour la compatibilité avec snake_case
  support_email?: string; // Pour la compatibilité avec snake_case
  logo?: string;
};

export default function EventDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  
  // État pour les statistiques
  const [eventStats, setEventStats] = useState({
    totalRegistrations: 0,
    checkedInCount: 0,
    checkInRate: 0,
    loading: true
  });
  
  // Récupérer le paramètre d'URL
  const params = useParams();
  const eventId = useMemo(() => {
    return Array.isArray(params.id) ? params.id[0] : params.id || '';
  }, [params.id]);
  
  // Fonctions utilitaires pour accéder aux dates de l'événement
  const getEventStartDate = (event: Event | null): Date | null => {
    if (!event) return null;
    const dateValue = event.startDate || event.start_date;
    if (!dateValue) return null;
    try {
      return new Date(dateValue);
      } catch (error) {
      console.error("Erreur de conversion de date:", error);
      return null;
    }
  };
  
  const getEventEndDate = (event: Event | null): Date | null => {
    if (!event) return null;
    const dateValue = event.endDate || event.end_date;
    if (!dateValue) return null;
    try {
      return new Date(dateValue);
      } catch (error) {
      console.error("Erreur de conversion de date:", error);
      return null;
    }
  };
  
  // Fonction pour formater une date en texte
  const formatEventDate = (date: Date | null): string => {
    if (!date) return "Date indisponible";
    try {
      return format(date, 'd MMMM yyyy', { locale: fr });
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return "Date invalide";
    }
  };
  
  // Récupération des données de l'événement et des statistiques
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        if (response.ok) {
          const data = await response.json();
          setEvent({
            ...data,
            id: data.id,
            name: data.name || '',
            description: data.description || '',
            location: data.location || '',
            banner: data.banner || '',
            slug: data.slug || '',
            startDate: data.startDate,
            endDate: data.endDate
          });
          
          setEventStats({
            totalRegistrations: data.registrations || 0,
            checkedInCount: data.checkedInCount || 0,
            checkInRate: data.checkInRate || 0,
            loading: false
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'événement:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);
  
  // Effet pour vérifier si l'appareil est mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Rendu de la page
    return (
    <div className="dashboard-container min-h-screen overflow-hidden">
      <EventSidebar 
        eventId={eventId} 
        onExpandChange={(expanded) => setSidebarExpanded(expanded)}
      />
      
      <div 
        className={`dashboard-content bg-gray-50 ${!sidebarExpanded ? 'dashboard-content-collapsed' : ''}`}
        style={{ 
          marginLeft: isMobile ? 0 : sidebarExpanded ? '16rem' : '4rem',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <main className="dashboard-main flex-1">
          {/* En-tête avec retour et actions */}
          <div className="p-4 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/events" className="inline-flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                <span>Retour aux événements</span>
                </Link>
              <h1 className="text-xl font-bold text-gray-900">{event?.name || "Chargement..."}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link 
                href={`/dashboard/events/${eventId}/apercu`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Aperçu
              </Link>
              <Link 
                href={`/checkin/${event?.slug}`}
                className="inline-flex items-center justify-center px-4 py-2 bg-[#81B441] text-white text-sm font-medium rounded-md shadow-sm hover:bg-[#6a9636] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
              >
                <QrCodeIcon className="w-5 h-5 mr-2" />
                Check-in
            </Link>
              <Link 
                href={`/dashboard/events/${eventId}/edit`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Modifier
              </Link>
            </div>
          </div>
          
          {/* Contenu principal */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Chargement des données de l'événement...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cartes de statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Carte 1: Participants */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Participants</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                          {eventStats.totalRegistrations}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {eventStats.totalRegistrations > 0 
                            ? `${eventStats.checkedInCount} enregistrés (${eventStats.checkInRate}%)`
                            : "Aucun participant"
                          }
                  </p>
                </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <UserPlusIcon className="w-6 h-6 text-blue-500" />
              </div>
                    </div>
                    </div>
                  
                  {/* Carte 2: Check-in */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Taux de Check-in</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                          {`${eventStats.checkInRate}%`}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {eventStats.checkedInCount} sur {eventStats.totalRegistrations}
                        </p>
                    </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <QrCodeIcon className="w-6 h-6 text-green-500" />
                    </div>
                    </div>
                    </div>
                  
                  {/* Carte 3: Jours restants */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          {getEventStartDate(event) && getEventStartDate(event)! > new Date() 
                            ? 'Jours restants' 
                            : getEventEndDate(event) && getEventEndDate(event)! < new Date()
                              ? 'Événement terminé'
                              : 'En cours'
                          }
                        </p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                          {getEventStartDate(event) && getEventStartDate(event)! > new Date() 
                            ? Math.ceil((new Date(getEventStartDate(event) as Date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            : getEventEndDate(event) && getEventEndDate(event)! < new Date()
                              ? 'Terminé'
                              : 'En cours'
                          }
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getEventStartDate(event) && formatEventDate(getEventStartDate(event))}
                        </p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <CalendarIcon className="w-6 h-6 text-amber-500" />
                      </div>
                        </div>
                      </div>
                      
                  {/* Carte 4: Revenus estimés */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Revenus estimés</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                          {`${(eventStats.totalRegistrations * 50).toLocaleString()} €`}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Basé sur 50€ par participant
                        </p>
                        </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <DocumentTextIcon className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                  </div>
                      </div>
                      
                {/* Informations de l'événement */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Détails de l'événement</h2>
                    <button
                      onClick={() => {
                        if (event?.slug) {
                          const url = window.location.origin + `/events/${event.slug}`;
                          navigator.clipboard.writeText(url);
                          alert("Lien copié dans le presse-papier!");
                        }
                      }}
                      className="inline-flex items-center text-gray-700 hover:text-gray-900"
                    >
                      <ShareIcon className="w-5 h-5 mr-2" />
                      Partager l'événement
                    </button>
                      </div>
                      
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="h-40 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                        {event?.banner ? (
                          <img 
                            src={event.banner} 
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <PhotoIcon className="w-16 h-16 text-gray-400" />
                        </div>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-2">{event?.name}</h3>
                      <p className="text-gray-700 mb-4">{event?.description || "Aucune description disponible."}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {event?.sector && (
                          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {event.sector}
                          </span>
                        )}
                        {event?.type && (
                          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {event.type}
                          </span>
                        )}
                        {event?.format && (
                          <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                            {event.format}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Date et heure</h3>
                        <p className="text-gray-900">
                          {getEventStartDate(event) && format(new Date(getEventStartDate(event) as Date), 'd MMMM yyyy', { locale: fr })}
                          {event?.startTime && ` à ${event.startTime}`}
                          {getEventEndDate(event) && getEventStartDate(event) !== getEventEndDate(event) && 
                            ` - ${format(new Date(getEventEndDate(event) as Date), 'd MMMM yyyy', { locale: fr })}`}
                          {event?.endTime && ` à ${event.endTime}`}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Lieu</h3>
                        <p className="text-gray-900">{event?.location || "Non spécifié"}</p>
                      </div>
                      
                      <div className="pt-4">
                        <Link
                          href={`/dashboard/events/${eventId}/participants`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                        >
                          <UserPlusIcon className="w-5 h-5 mr-2" />
                          Gérer les participants
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
        </main>
      </div>
    </div>
  );
} 