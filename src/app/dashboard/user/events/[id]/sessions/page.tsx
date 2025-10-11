"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeftIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  UserIcon,
  InformationCircleIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon
} from "@heroicons/react/24/outline";
import { UserEventSidebar } from "@/components/dashboard/UserEventSidebar";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Importer les composants Shadcn UI
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
  company?: string;
  position?: string;
  avatar?: string;
};

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  position?: string;
  avatar?: string;
  checkedIn: boolean;
};

type Session = {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  speaker?: string;
  speakers?: Speaker[];
  capacity?: number;
  format?: string;
  banner?: string;
  video_url?: string;
  participantCount: number;
};

type ViewMode = 'cards' | 'grid';

export default function UserEventSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string>("");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterSpeaker, setFilterSpeaker] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isMobile, setIsMobile] = useState(false);
  
  // États pour le popup de détails
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [sessionParticipants, setSessionParticipants] = useState<Participant[]>([]);
  const [sessionDocuments, setSessionDocuments] = useState<{
    name: string;
    size?: string;
    type: string;
  }[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  
  // Extraire les paramètres une fois au chargement du composant
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

  // Récupérer les détails de l'événement et les sessions au chargement
  useEffect(() => {
    if (!eventId) return;
    
    const fetchData = async () => {
      try {
        // Récupérer les détails de l'événement
        const eventResponse = await fetch(`/api/events/${eventId}`);
        if (!eventResponse.ok) throw new Error('Erreur lors de la récupération des détails de l\'événement');
        const eventData = await eventResponse.json();
        setEvent(eventData);

        // Récupérer les sessions
        const sessionsResponse = await fetch(`/api/events/${eventId}/sessions`);
        if (!sessionsResponse.ok) throw new Error('Erreur lors de la récupération des sessions');
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const refreshSessions = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/sessions`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des sessions');
      const data = await response.json();
      setSessions(data);
      toast.success('Sessions actualisées');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'actualisation des sessions');
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les lieux uniques pour le filtre
  const uniqueLocations = useMemo(() => {
    const locations = sessions
      .filter(s => s.location)
      .map(s => s.location as string);
    return [...new Set(locations)];
  }, [sessions]);

  // Obtenir les intervenants uniques pour le filtre
  const uniqueSpeakers = useMemo(() => {
    const speakers = sessions
      .filter(s => s.speakers && s.speakers.length > 0)
      .flatMap(s => s.speakers!)
      .map(speaker => `${speaker.firstName} ${speaker.lastName}`);
    return [...new Set(speakers)];
  }, [sessions]);

  // Filtrer les sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      let matchesLocation = true;
      let matchesSpeaker = true;
      let matchesSearch = true;
      
      if (filterLocation && session.location) {
        matchesLocation = session.location.includes(filterLocation);
      }
      
      if (filterSpeaker && session.speakers) {
        matchesSpeaker = session.speakers.some(speaker => 
          `${speaker.firstName} ${speaker.lastName}`.includes(filterSpeaker)
        );
      }
      
      if (searchTerm) {
        matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (session.description && session.description.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      
      return matchesLocation && matchesSpeaker && matchesSearch;
    });
  }, [sessions, filterLocation, filterSpeaker, searchTerm]);

  // Organiser les sessions par jour
  const sessionsByDay = useMemo(() => {
    const grouped: { [key: string]: Session[] } = {};
    
    filteredSessions.forEach(session => {
      const dateKey = format(new Date(session.start_date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    
    // Trier les sessions de chaque jour par heure de début
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });
    });
    
    return grouped;
  }, [filteredSessions]);

  const toggleDayExpansion = (day: string) => {
    if (expandedDay === day) {
      setExpandedDay(null);
    } else {
      setExpandedDay(day);
    }
  };

  // Fonction pour ouvrir le popup de détails
  const openSessionDetails = async (session: Session) => {
    setSelectedSession(session);
    setShowSessionModal(true);
    setActiveTab('details');
    
    // Charger les participants de la session
    try {
      const participantsResponse = await fetch(`/api/events/${eventId}/sessions/${session.id}/participants`);
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setSessionParticipants(participantsData);
        
        // Vérifier si l'utilisateur actuel participe déjà à cette session
        const userParticipates = participantsData.some((p: Participant) => p.email === session.email);
        setIsParticipating(userParticipates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des participants:', error);
    }
    
    // Charger les documents de la session
    try {
      const documentsResponse = await fetch(`/api/events/${eventId}/sessions/${session.id}/documents`);
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        setSessionDocuments(documentsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  };

  // Fonction pour rejoindre une session
  const joinSession = async () => {
    if (!selectedSession || !eventId) return;
    
    setIsJoiningSession(true);
    try {
      const response = await fetch(`/api/events/${eventId}/sessions/${selectedSession.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setIsParticipating(true);
        toast.success('Vous participez maintenant à cette session !');
        
        // Recharger les participants pour mettre à jour la liste
        const participantsResponse = await fetch(`/api/events/${eventId}/sessions/${selectedSession.id}/participants`);
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          setSessionParticipants(participantsData);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors de l\'inscription à la session');
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription à la session:', error);
      toast.error('Erreur lors de l\'inscription à la session');
    } finally {
      setIsJoiningSession(false);
    }
  };

  // Rendu de la vue cards
  const renderCardsView = () => (
    <div className="space-y-6 pb-20">
      {Object.keys(sessionsByDay).sort().map((day) => (
        <div key={day} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div 
            className="bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer"
            onClick={() => toggleDayExpansion(day)}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[#81B441]">
                {format(new Date(day), 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  {sessionsByDay[day].length} session{sessionsByDay[day].length !== 1 ? 's' : ''}
                </span>
                {expandedDay === day ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          
          {expandedDay === day && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessionsByDay[day].map((session) => (
                  <Card 
                    key={session.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => openSessionDetails(session)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* En-tête avec titre et badge de format */}
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                            {session.title}
                          </h4>
                          {session.format && (
                            <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                              {session.format}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Description */}
                        {session.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {session.description}
                          </p>
                        )}
                        
                        {/* Informations de temps et lieu */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            <span>
                              {session.start_time} - {session.end_time}
                            </span>
                          </div>
                          
                          {session.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPinIcon className="h-4 w-4 mr-2" />
                              <span>{session.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Intervenants */}
                        {session.speakers && session.speakers.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <UserIcon className="h-4 w-4 mr-2" />
                              <span>Intervenants</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {session.speakers.slice(0, 3).map((speaker, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {speaker.firstName} {speaker.lastName}
                                </Badge>
                              ))}
                              {session.speakers.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{session.speakers.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Participants et capacité */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center text-sm text-gray-500">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            <span>{session.participantCount} participant{session.participantCount !== 1 ? 's' : ''}</span>
                          </div>
                          {session.capacity && (
                            <span className="text-xs text-gray-400">
                              Capacité: {session.capacity}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Rendu de la vue grille
  const renderGridView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Sessions ({filteredSessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Intervenants</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Capacité</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{session.title}</div>
                      {session.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {session.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(session.start_date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {session.start_time} - {session.end_time}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {session.location ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {session.location}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">Non défini</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {session.speakers && session.speakers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {session.speakers.slice(0, 2).map((speaker, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {speaker.firstName} {speaker.lastName}
                          </Badge>
                        ))}
                        {session.speakers.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{session.speakers.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Aucun</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <UserGroupIcon className="h-4 w-4 text-gray-400" />
                      <span>{session.participantCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {session.capacity ? (
                      <span className="text-sm">{session.capacity}</span>
                    ) : (
                      <span className="text-gray-400">Illimitée</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openSessionDetails(session)}
                      className="h-8 w-8 p-0"
                    >
                      <InformationCircleIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="dashboard-container min-h-screen overflow-hidden">
      <UserEventSidebar 
        eventId={eventId}
        activeTab="sessions"
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
                  Sessions et Programme • {event?.name || "Chargement..."}
                </h1>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="p-6">
            {/* Contrôles de filtre et recherche */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Barre de recherche */}
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher une session..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                
                {/* Filtre par lieu */}
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent"
                >
                  <option value="">Tous les lieux</option>
                  {uniqueLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                
                {/* Filtre par intervenant */}
                <select
                  value={filterSpeaker}
                  onChange={(e) => setFilterSpeaker(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent"
                >
                  <option value="">Tous les intervenants</option>
                  {uniqueSpeakers.map((speaker) => (
                    <option key={speaker} value={speaker}>
                      {speaker}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshSessions}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Actualiser
                </button>
              </div>
            </div>
            
            {/* Contenu des sessions */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="spinner"></div>
                <p className="ml-3 text-gray-500">Chargement des sessions...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Aucune session</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {sessions.length > 0 
                    ? "Filtrer ou rechercher parmi les sessions disponibles pour afficher les résultats."
                    : "Aucune session n'a encore été ajoutée à cet événement."}
                </p>
              </div>
            ) : (
              // Affichage direct des sessions sans regroupement par jour
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.map((session) => (
                  <Card 
                    key={session.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => openSessionDetails(session)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* En-tête avec titre et badge de format */}
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                            {session.title}
                          </h4>
                          {session.format && (
                            <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                              {session.format}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Description */}
                        {session.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {session.description}
                          </p>
                        )}
                        
                        {/* Informations de temps et lieu */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <span>
                              {format(new Date(session.start_date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            <span>
                              {session.start_time} - {session.end_time}
                            </span>
                          </div>
                          
                          {session.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPinIcon className="h-4 w-4 mr-2" />
                              <span>{session.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Intervenants */}
                        {session.speakers && session.speakers.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <UserIcon className="h-4 w-4 mr-2" />
                              <span>Intervenants</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {session.speakers.slice(0, 3).map((speaker, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {speaker.firstName} {speaker.lastName}
                                </Badge>
                              ))}
                              {session.speakers.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{session.speakers.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Participants et capacité */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center text-sm text-gray-500">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            <span>{session.participantCount} participant{session.participantCount !== 1 ? 's' : ''}</span>
                          </div>
                          {session.capacity && (
                            <span className="text-xs text-gray-400">
                              Capacité: {session.capacity}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal des détails de la session avec onglets */}
      <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          {selectedSession && (
            <div className="flex flex-col h-full">
              {/* En-tête fixe */}
              <div className="flex-shrink-0 pb-4 border-b">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                    <CalendarIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{selectedSession.title}</h2>
                    <div className="flex gap-2 mt-2">
                      {selectedSession.format && (
                        <Badge variant="outline" className="text-xs">
                          {selectedSession.format}
                        </Badge>
                      )}
                      <Badge className="bg-[#EAF9D7] text-gray-800 hover:bg-[#EAF9D7] border-[#EAF9D7]">
                        <UserGroupIcon className="h-3 w-3 mr-1" />
                        {selectedSession.participantCount} participant{selectedSession.participantCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Bouton Participer */}
                  <div className="flex-shrink-0">
                    {isParticipating ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckBadgeIcon className="h-4 w-4 mr-1" />
                        Vous participez
                      </Badge>
                    ) : (
                      <Button
                        onClick={joinSession}
                        disabled={isJoiningSession}
                        className="bg-[#81B441] hover:bg-[#81B441]/90 text-white"
                      >
                        {isJoiningSession ? 'Inscription...' : 'Participer'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenu avec onglets */}
              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Détails</TabsTrigger>
                    <TabsTrigger value="participants">Participants</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="flex-1 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="space-y-6 p-6">
                        {/* Description */}
                        {selectedSession.description && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-700 leading-relaxed">
                              {selectedSession.description}
                            </p>
                          </div>
                        )}

                        {/* Informations de temps et lieu */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                            <div className="space-y-3">
                              <div className="flex items-center">
                                <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <p className="text-sm text-gray-600">Date</p>
                                  <p className="font-medium">
                                    {format(new Date(selectedSession.start_date), 'EEEE d MMMM yyyy', { locale: fr })}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <p className="text-sm text-gray-600">Heure</p>
                                  <p className="font-medium">
                                    {selectedSession.start_time} - {selectedSession.end_time}
                                  </p>
                                </div>
                              </div>
                              
                              {selectedSession.location && (
                                <div className="flex items-center">
                                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                                  <div>
                                    <p className="text-sm text-gray-600">Lieu</p>
                                    <p className="font-medium">{selectedSession.location}</p>
                                  </div>
                                </div>
                              )}
                              
                              {selectedSession.capacity && (
                                <div className="flex items-center">
                                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                                  <div>
                                    <p className="text-sm text-gray-600">Capacité</p>
                                    <p className="font-medium">{selectedSession.capacity} places</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Intervenants */}
                          {selectedSession.speakers && selectedSession.speakers.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Intervenants</h3>
                              <div className="space-y-3">
                                {selectedSession.speakers.map((speaker, index) => (
                                  <div key={index} className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={speaker.avatar} />
                                      <AvatarFallback>
                                        {speaker.firstName.charAt(0)}{speaker.lastName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">
                                        {speaker.firstName} {speaker.lastName}
                                      </p>
                                      {speaker.company && (
                                        <p className="text-sm text-gray-600">{speaker.company}</p>
                                      )}
                                      {speaker.position && (
                                        <p className="text-sm text-gray-500">{speaker.position}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="participants" className="flex-1 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Participants ({sessionParticipants.length})
                        </h3>
                        {sessionParticipants.length > 0 ? (
                          <div className="space-y-3">
                            {sessionParticipants.map((participant) => (
                              <div key={participant.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={participant.avatar} />
                                  <AvatarFallback>
                                    {participant.firstName.charAt(0)}{participant.lastName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {participant.firstName} {participant.lastName}
                                  </p>
                                  {participant.company && (
                                    <p className="text-sm text-gray-600">{participant.company}</p>
                                  )}
                                  {participant.position && (
                                    <p className="text-sm text-gray-500">{participant.position}</p>
                                  )}
                                </div>
                                {participant.checkedIn && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckBadgeIcon className="h-3 w-3 mr-1" />
                                    Présent
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            Aucun participant inscrit à cette session
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="documents" className="flex-1 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Documents ({sessionDocuments.length})
                        </h3>
                        {sessionDocuments.length > 0 ? (
                          <div className="space-y-3">
                            {sessionDocuments.map((document, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-600 text-sm font-medium">
                                    {document.type.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{document.name}</p>
                                  {document.size && (
                                    <p className="text-sm text-gray-500">{document.size}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            Aucun document disponible pour cette session
                          </div>
                        )}
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