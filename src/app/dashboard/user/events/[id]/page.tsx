"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useParams } from "next/navigation";
import { 
  ArrowLeftIcon, 
  PhotoIcon,
  CalendarIcon,
  MapPinIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CheckCircleIcon
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

export default function UserEventDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  
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
  
  // Récupération des données de l'événement
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
          
          // Vérifier si l'utilisateur est inscrit (simulation - dans un vrai cas, faire un appel API)
          setIsRegistered(true);
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
      <UserEventSidebar 
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
          {/* En-tête avec retour */}
          <div className="p-4 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/user/events" className="inline-flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                <span>Retour à mes événements</span>
                </Link>
              <h1 className="text-xl font-bold text-gray-900">{event?.name || "Chargement..."}</h1>
            </div>
            
            {/* Statut d'inscription */}
            {isRegistered && (
              <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Inscrit</span>
              </div>
            )}
          </div>
          
          {/* Contenu principal */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Chargement des données de l&apos;événement...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Informations de l'événement */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Titre simple de la section */}
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">Détails de l&apos;événement</h2>
                    <p className="text-gray-600 mt-1">Consultez toutes les informations de votre événement</p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                      {/* Section principale avec image et description */}
                      <div className="xl:col-span-2 space-y-8">
                        {/* Image de bannière modernisée */}
                        <div className="relative h-72 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 rounded-2xl overflow-hidden group shadow-inner">
                          {event?.banner ? (
                            <img 
                              src={event.banner} 
                              alt={event.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <div className="p-6 bg-white rounded-2xl shadow-sm mb-4 inline-block">
                                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">Aucune bannière</p>
                                <p className="text-gray-400 text-sm mt-1">Image non disponible</p>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          <div className="absolute bottom-6 left-6 text-white">
                            <h3 className="text-2xl font-bold drop-shadow-2xl">{event?.name}</h3>
                            <p className="text-white/90 mt-1 drop-shadow-lg">
                              {event?.type && event?.sector && `${event.type} • ${event.sector}`}
                            </p>
                          </div>
                        </div>

                        {/* Description et tags */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-4">Description</h4>
                            <p className="text-gray-700 leading-relaxed text-lg">
                              {event?.description || "Aucune description disponible pour cet événement."}
                            </p>
                          </div>

                          {/* Tags modernes avec animations */}
                          {(event?.sector || event?.type || event?.format) && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Catégories
                              </h5>
                              <div className="flex flex-wrap gap-3">
                                {event?.sector && (
                                  <div className="group flex items-center px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-full hover:shadow-md transition-all duration-200">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full mr-3 group-hover:scale-125 transition-transform duration-200"></div>
                                    <span className="text-sm font-semibold text-gray-800">{event.sector}</span>
                                  </div>
                                )}
                                {event?.type && (
                                  <div className="group flex items-center px-5 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-full hover:shadow-md transition-all duration-200">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:scale-125 transition-transform duration-200"></div>
                                    <span className="text-sm font-semibold text-blue-800">{event.type}</span>
                                  </div>
                                )}
                                {event?.format && (
                                  <div className="group flex items-center px-5 py-3 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-full hover:shadow-md transition-all duration-200">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 group-hover:scale-125 transition-transform duration-200"></div>
                                    <span className="text-sm font-semibold text-amber-800">{event.format}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sidebar avec informations importantes */}
                      <div className="space-y-6">
                        {/* Informations essentielles */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
                          <h4 className="text-xl font-bold text-gray-900 mb-6">Informations essentielles</h4>
                          <div className="space-y-5">
                            {/* Date et heure */}
                            <div className="flex items-start space-x-4">
                              <div className="p-3 bg-gradient-to-br from-[#81B441]/10 to-[#81B441]/20 rounded-xl">
                                <CalendarIcon className="w-6 h-6 text-[#81B441]" />
                              </div>
                              <div className="flex-1">
                                <h5 className="text-sm font-bold text-gray-900 mb-2">Date et heure</h5>
                                <p className="text-gray-700 leading-relaxed">
                                  {getEventStartDate(event) && format(new Date(getEventStartDate(event) as Date), 'd MMMM yyyy', { locale: fr })}
                                  {event?.startTime && ` à ${event.startTime}`}
                                  {getEventEndDate(event) && getEventStartDate(event) !== getEventEndDate(event) && 
                                    ` - ${format(new Date(getEventEndDate(event) as Date), 'd MMMM yyyy', { locale: fr })}`}
                                  {event?.endTime && ` à ${event.endTime}`}
                                </p>
                              </div>
                            </div>

                            {/* Lieu */}
                            <div className="flex items-start space-x-4">
                              <div className="p-3 bg-gradient-to-br from-[#81B441]/10 to-[#81B441]/20 rounded-xl">
                                <MapPinIcon className="w-6 h-6 text-[#81B441]" />
                              </div>
                              <div className="flex-1">
                                <h5 className="text-sm font-bold text-gray-900 mb-2">Lieu</h5>
                                <p className="text-gray-700">{event?.location || "Non spécifié"}</p>
                              </div>
                            </div>

                            {/* Contact */}
                            {event?.supportEmail && (
                              <div className="flex items-start space-x-4">
                                <div className="p-3 bg-gradient-to-br from-[#81B441]/10 to-[#81B441]/20 rounded-xl">
                                  <EnvelopeIcon className="w-6 h-6 text-[#81B441]" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-bold text-gray-900 mb-2">Contact</h5>
                                  <p className="text-gray-700">{event.supportEmail}</p>
                                </div>
                              </div>
                            )}

                            {/* Fuseau horaire */}
                            {event?.timezone && (
                              <div className="flex items-start space-x-4">
                                <div className="p-3 bg-gradient-to-br from-[#81B441]/10 to-[#81B441]/20 rounded-xl">
                                  <GlobeAltIcon className="w-6 h-6 text-[#81B441]" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-bold text-gray-900 mb-2">Fuseau horaire</h5>
                                  <p className="text-gray-700">{event.timezone}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Statut de l'inscription */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-4">Mon inscription</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700 font-medium">Statut</span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Confirmé
                              </span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-green-500 h-2 rounded-full w-full"></div>
                            </div>
                            <p className="text-sm text-green-700 text-center">
                              Vous êtes inscrit à cet événement
                            </p>
                          </div>
                        </div>
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