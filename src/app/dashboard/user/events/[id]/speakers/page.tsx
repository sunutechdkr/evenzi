"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeftIcon,
  MicrophoneIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "react-hot-toast";

// Importer les composants Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  location: string;
  banner?: string;
  slug?: string;
};

type Speaker = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  type: string;
  checkedIn: boolean;
  sessions?: {
    id: string;
    title: string;
    start_date: string;
    start_time: string;
    location?: string;
  }[];
};

export default function UserEventSpeakersPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Extraction des paramètres
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);
    };
    extractParams();
  }, [params]);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch data on load
  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchSpeakers();
    }
  }, [eventId]);

  /**
   * Récupère les détails de l'événement
   */
  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des détails de l\'événement');
      
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les détails de l\'événement');
    }
  };

  /**
   * Récupère la liste des participants de type SPEAKER
   */
  const fetchSpeakers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/participants?type=SPEAKER`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des intervenants');
      
      const data = await response.json();
      setSpeakers(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les intervenants');
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les sessions uniques pour le tri
  const uniqueSessions = Array.from(new Set(
    speakers
      .filter(s => s.sessions && s.sessions.length > 0)
      .flatMap(s => s.sessions!)
      .map(session => session.title)
  ));

  // Filtrer les speakers
  const filteredSpeakers = speakers.filter(speaker => {
    const matchesSearch = speaker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         speaker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         speaker.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         speaker.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSession = !companyFilter || (speaker.sessions && speaker.sessions.some(s => s.title === companyFilter));
    
    return matchesSearch && matchesSession;
  });

  const openSpeakerDetails = (speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    setActiveTab("details");
    setShowSpeakerModal(true);
  };

  // État de chargement
  if (loading) {
    return (
      <div className="dashboard-container min-h-screen overflow-hidden">
        <UserEventSidebar 
          eventId={eventId}
          activeTab="speakers"
          onExpandChange={(expanded) => setSidebarExpanded(expanded)}
        />
        <div 
          className={`dashboard-content bg-gray-50 ${!sidebarExpanded ? 'dashboard-content-collapsed' : ''}`}
          style={{ 
            marginLeft: isMobile ? 0 : sidebarExpanded ? '16rem' : '4rem',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#81B441] border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Chargement des speakers...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container min-h-screen overflow-hidden">
      <UserEventSidebar 
        eventId={eventId}
        activeTab="speakers"
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
          {/* En-tête */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/dashboard/user/events/${eventId}`}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-2" />
                  <span>Retour à l&apos;événement</span>
                </Link>
                <h1 className="text-xl font-bold text-gray-900">
                  Speakers et Intervenants • {event?.name || "Chargement..."}
                </h1>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="p-6">
            {/* Options de recherche et filtre */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Barre de recherche */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher un speaker..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                
                {/* Tri par session */}
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent"
                >
                  <option value="">Toutes les sessions</option>
                  {uniqueSessions.map((session) => (
                    <option key={session} value={session}>
                      {session}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grille des speakers */}
            {filteredSpeakers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredSpeakers.map((speaker) => (
                  <Card 
                    key={speaker.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => openSpeakerDetails(speaker)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        {/* Photo de profil */}
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={speaker.avatar} />
                          <AvatarFallback className="text-lg font-semibold">
                            {speaker.firstName.charAt(0)}{speaker.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Informations du speaker */}
                        <div className="space-y-1">
                          <h3 className="font-semibold text-gray-900">
                            {speaker.firstName} {speaker.lastName}
                          </h3>
                          
                          {speaker.jobTitle && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {speaker.jobTitle}
                            </p>
                          )}
                          
                          {speaker.company && (
                            <p className="text-sm text-[#81B441] font-medium">
                              {speaker.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MicrophoneIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun speaker</h3>
                <p className="text-sm text-gray-500">
                  {speakers.length > 0 
                    ? "Aucun speaker ne correspond à votre recherche."
                    : "Aucun speaker n'a encore été ajouté à cet événement."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal des détails du speaker */}
      <Dialog open={showSpeakerModal} onOpenChange={setShowSpeakerModal}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          {selectedSpeaker && (
            <div className="flex flex-col h-full">
              {/* En-tête fixe */}
              <div className="flex-shrink-0 pb-4 border-b">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedSpeaker.avatar} />
                    <AvatarFallback className="text-xl font-semibold">
                      {selectedSpeaker.firstName.charAt(0)}{selectedSpeaker.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedSpeaker.firstName} {selectedSpeaker.lastName}
                    </h2>
                    <div className="flex gap-2 mt-2">
                      {selectedSpeaker.jobTitle && (
                        <Badge variant="outline" className="text-xs">
                          {selectedSpeaker.jobTitle}
                        </Badge>
                      )}
                      {selectedSpeaker.company && (
                        <Badge className="bg-[#EAF9D7] text-gray-800 hover:bg-[#EAF9D7] border-[#EAF9D7]">
                          <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                          {selectedSpeaker.company}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu avec onglets */}
              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Profil</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="flex-1 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="space-y-6 p-6">
                        {/* Bio */}
                        {selectedSpeaker.bio && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Biographie</h3>
                            <p className="text-gray-700 leading-relaxed">
                              {selectedSpeaker.bio}
                            </p>
                          </div>
                        )}

                        {/* Informations professionnelles */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations professionnelles</h3>
                          <div className="space-y-3">
                            {selectedSpeaker.jobTitle && (
                              <div className="flex items-center">
                                <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <p className="text-sm text-gray-600">Fonction</p>
                                  <p className="font-medium">{selectedSpeaker.jobTitle}</p>
                                </div>
                              </div>
                            )}
                            
                            {selectedSpeaker.company && (
                              <div className="flex items-center">
                                <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <p className="text-sm text-gray-600">Entreprise</p>
                                  <p className="font-medium">{selectedSpeaker.company}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Statistiques */}
                        {selectedSpeaker.sessions && selectedSpeaker.sessions.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <MicrophoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">Sessions</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                  {selectedSpeaker.sessions.length}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="sessions" className="flex-1 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Sessions ({selectedSpeaker.sessions?.length || 0})
                        </h3>
                        {selectedSpeaker.sessions && selectedSpeaker.sessions.length > 0 ? (
                          <div className="space-y-3">
                            {selectedSpeaker.sessions.map((session) => (
                              <div key={session.id} className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">{session.title}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{session.start_time}</span>
                                  {session.location && (
                                    <>
                                      <span>•</span>
                                      <span>{session.location}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            Aucune session programmée pour ce speaker
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="contact" className="flex-1 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
                        <div className="space-y-4">
                          {/* Email */}
                          <div className="flex items-center">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <a 
                                href={`mailto:${selectedSpeaker.email}`}
                                className="font-medium text-[#81B441] hover:text-[#72a139]"
                              >
                                {selectedSpeaker.email}
                              </a>
                            </div>
                          </div>

                          {/* Téléphone */}
                          {selectedSpeaker.phone && (
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <div>
                                <p className="text-sm text-gray-600">Téléphone</p>
                                <a 
                                  href={`tel:${selectedSpeaker.phone}`}
                                  className="font-medium text-[#81B441] hover:text-[#72a139]"
                                >
                                  {selectedSpeaker.phone}
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Site web */}
                          {selectedSpeaker.website && (
                            <div className="flex items-center">
                              <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Site web</p>
                                <a 
                                  href={selectedSpeaker.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-[#81B441] hover:text-[#72a139]"
                                >
                                  {selectedSpeaker.website}
                                </a>
                              </div>
                            </div>
                          )}

                          {/* LinkedIn */}
                          {selectedSpeaker.linkedin && (
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                              <div>
                                <p className="text-sm text-gray-600">LinkedIn</p>
                                <a 
                                  href={selectedSpeaker.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-[#81B441] hover:text-[#72a139]"
                                >
                                  Voir le profil
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Twitter */}
                          {selectedSpeaker.twitter && (
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                              </svg>
                              <div>
                                <p className="text-sm text-gray-600">Twitter</p>
                                <a 
                                  href={selectedSpeaker.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-[#81B441] hover:text-[#72a139]"
                                >
                                  @{selectedSpeaker.twitter.split('/').pop()}
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Statut de check-in */}
                          <div className="flex items-center">
                            <div className={`h-5 w-5 rounded-full mr-3 ${selectedSpeaker.checkedIn ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <p className="text-sm text-gray-600">Statut</p>
                              <p className="font-medium">
                                {selectedSpeaker.checkedIn ? 'Présent' : 'Non présent'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 