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
  EyeIcon,
  MapPinIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CogIcon
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
    <div className="w-full h-full">
      {/* En-tête avec retour et actions */}
      <div className="p-4 bg-white border-b border-gray-200 flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4">
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
                {/* Informations de l'événement */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Titre simple de la section */}
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">Détails de l&apos;événement</h2>
                    <p className="text-gray-600 mt-1">Gérez et consultez toutes les informations de votre événement</p>
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
                                <p className="text-gray-400 text-sm mt-1">Ajoutez une image pour votre événement</p>
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
                    
                        {/* Actions rapides */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                          <h4 className="text-xl font-bold text-gray-900 mb-6">Actions rapides</h4>
                          <div className="space-y-4">
                            <Link
                              href={`/dashboard/events/${eventId}/participants`}
                              className="group inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-[#81B441] to-[#6a9636] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                              <UserPlusIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                              Gérer les participants
                            </Link>
                            
                            <Link
                              href={`/dashboard/events/${eventId}/sessions`}
                              className="group inline-flex items-center justify-center w-full px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-[#81B441] hover:text-[#81B441] transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                              <CalendarIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                              Sessions & Programme
                            </Link>

                            <Link
                              href={`/dashboard/events/${eventId}/settings`}
                              className="group inline-flex items-center justify-center w-full px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                              <CogIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                              Paramètres
                            </Link>
                          </div>
                        </div>

                        {/* Statistiques rapides */}
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-2xl p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-6">Aperçu rapide</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">Participants inscrits</span>
                              <span className="text-2xl font-bold text-[#81B441]">{eventStats.totalRegistrations}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">Taux de check-in</span>
                              <span className="text-2xl font-bold text-blue-600">{eventStats.checkInRate}%</span>
                      </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-[#81B441] via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${eventStats.checkInRate}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                              {eventStats.checkedInCount} participants ont effectué leur check-in
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
    </div>
  );
} 