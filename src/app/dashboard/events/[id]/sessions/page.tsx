"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeftIcon,
  PlusIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserIcon,
  FolderIcon,
  InformationCircleIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon
} from "@heroicons/react/24/outline";
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
  email?: string;
  jobTitle?: string;
  company?: string;
  type: string;
  checkedIn: boolean;
  avatar?: string;
};

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  type: string;
  checkedIn: boolean;
  avatar?: string;
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

export default function EventSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<Event | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterSpeaker, setFilterSpeaker] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
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
  
  // Extraire les paramètres une fois au chargement du composant
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);
    };
    extractParams();
  }, [params]);

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

  // Fonction pour exporter les sessions au format Excel
  const handleExportSessions = () => {
    if (!eventId) return;
    
    const exportUrl = `/api/events/${eventId}/export/sessions`;
    toast.loading('Exportation des sessions en cours...', { id: 'export-toast' });

    const downloadLink = document.createElement('a');
    downloadLink.href = exportUrl;
    downloadLink.target = '_blank';
    downloadLink.download = 'sessions.xlsx';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    setTimeout(() => {
      toast.success('Les sessions ont été exportées avec succès', { id: 'export-toast' });
    }, 1000);
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
          
          {(expandedDay === day || expandedDay === null) && (
            <ul role="list" className="divide-y divide-gray-200">
              {sessionsByDay[day].map((session) => (
                <li key={session.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-150 relative">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <span className="text-lg font-medium text-gray-900">
                          {session.title}
                        </span>
                        <div className="flex gap-2">
                          <div className="px-2 py-1 bg-[#81B441]/10 text-[#81B441] text-xs font-medium rounded-full">
                            {session.start_time} - {session.end_time}
                          </div>
                          {session.location && (
                            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {session.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {session.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {session.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {session.speakers && session.speakers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            <span>{session.speakers.map(s => `${s.firstName} ${s.lastName}`).join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <UserGroupIcon className="h-4 w-4" />
                          <span>{session.participantCount} participant{session.participantCount !== 1 ? 's' : ''}</span>
                        </div>
                        {session.capacity && (
                          <div className="flex items-center gap-1">
                            <span>Capacité: {session.capacity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="self-center">
                      <ChevronLeftIcon className="h-5 w-5 text-gray-400 transform rotate-180" />
                    </div>
                  </div>
                  <button
                    onClick={() => openSessionDetails(session)}
                    className="absolute inset-0 cursor-pointer z-10"
                    aria-label={`Voir les détails de la session ${session.title}`}
                  />
                </li>
              ))}
            </ul>
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
    <div className="flex min-h-screen bg-gray-50">
      <EventSidebar eventId={eventId} onExpandChange={setSidebarExpanded} />
      
      <main className={`transition-all duration-300 ease-in-out ${sidebarExpanded ? "md:ml-64" : "ml-0"} flex-1 p-6 overflow-auto`}>
        <div className="max-w-7xl mx-auto">
          {/* Header with back button and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <div className="flex items-center mb-1">
                <Link 
                  href={`/dashboard/events/${eventId}`}
                  className="inline-flex items-center mr-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-1" />
                  Retour à l&apos;événement
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Sessions et programme</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérez les sessions et le programme pour votre événement {event?.name || ''}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              {/* Sélecteur de vue */}
              <div className="flex items-center border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    "rounded-r-none border-r",
                    viewMode === 'cards' && "bg-[#81B441] hover:bg-[#72a139]"
                  )}
                >
                  <RectangleStackIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "rounded-l-none",
                    viewMode === 'grid' && "bg-[#81B441] hover:bg-[#72a139]"
                  )}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </Button>
              </div>
              
              <button
                onClick={refreshSessions}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Actualiser
              </button>
              
              <button
                onClick={handleExportSessions}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Exporter Excel
              </button>

              <Link
                href={`/dashboard/events/${eventId}/sessions/create`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#81B441] hover:bg-[#72a139] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Ajouter une session
              </Link>
            </div>
          </div>
          
          {/* Contrôles de filtre et recherche */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Input
                    placeholder="Rechercher une session..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                  />
                </div>
                
                <div>
                  <label htmlFor="filterLocation" className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                  <select
                    id="filterLocation"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full sm:w-40 py-1.5 pl-3 pr-10 text-sm border-gray-300 focus:outline-none focus:ring-[#81B441] focus:border-[#81B441] rounded-md"
                  >
                    <option value="">Tous les lieux</option>
                    {uniqueLocations.map((location, index) => (
                      <option key={`location-${index}`} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="filterSpeaker" className="block text-sm font-medium text-gray-700 mb-1">Intervenant</label>
                  <select
                    id="filterSpeaker"
                    value={filterSpeaker}
                    onChange={(e) => setFilterSpeaker(e.target.value)}
                    className="w-full sm:w-48 py-1.5 pl-3 pr-10 text-sm border-gray-300 focus:outline-none focus:ring-[#81B441] focus:border-[#81B441] rounded-md"
                  >
                    <option value="">Tous les intervenants</option>
                    {uniqueSpeakers.map((speaker, index) => (
                      <option key={`speaker-${index}`} value={speaker}>
                        {speaker}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} trouvée{filteredSessions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          {/* Content area */}
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
                  : "Vous n'avez pas encore ajouté de sessions à cet événement."}
              </p>
              <Link
                href={`/dashboard/events/${eventId}/sessions/create`}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#81B441] hover:bg-[#72a139] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Ajouter votre première session
              </Link>
            </div>
          ) : (
            // Rendu conditionnel selon le mode de vue
            viewMode === 'cards' ? renderCardsView() : renderGridView()
          )}
        </div>
      </main>

      {/* Modal des détails de la session avec onglets */}
      <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Détails de la session</DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="mt-4">
              {/* En-tête avec infos principales */}
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-16 h-16 bg-[#81B441] rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{selectedSession.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className="bg-[#81B441]/10 text-[#81B441] hover:bg-[#81B441]/20">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {selectedSession.start_time} - {selectedSession.end_time}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {format(new Date(selectedSession.start_date), 'dd MMMM yyyy', { locale: fr })}
                    </Badge>
                    {selectedSession.location && (
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {selectedSession.location}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{selectedSession.participantCount} participant{selectedSession.participantCount !== 1 ? 's' : ''}</span>
                    </div>
                    {selectedSession.capacity && (
                      <div className="flex items-center gap-1">
                        <span>Capacité: {selectedSession.capacity}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Onglets */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="participants">Participants</TabsTrigger>
                  <TabsTrigger value="speakers">Intervenants</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[400px] pr-4">
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                          <p className="text-sm text-gray-900">
                            {selectedSession.description || 'Aucune description disponible'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Format</h4>
                          <p className="text-sm text-gray-900">
                            {selectedSession.format || 'Non spécifié'}
                          </p>
                        </div>
                        
                        {selectedSession.video_url && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Lien vidéo</h4>
                            <a 
                              href={selectedSession.video_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-[#81B441] hover:underline"
                            >
                              {selectedSession.video_url}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Horaires</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900">
                              Début: {selectedSession.start_time} le {format(new Date(selectedSession.start_date), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-sm text-gray-900">
                              Fin: {selectedSession.end_time} le {format(new Date(selectedSession.end_date), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Lieu</h4>
                          <p className="text-sm text-gray-900">
                            {selectedSession.location || 'Non spécifié'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Capacité</h4>
                          <p className="text-sm text-gray-900">
                            {selectedSession.capacity ? `${selectedSession.capacity} participants` : 'Illimitée'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="participants" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        Participants inscrits ({sessionParticipants.length})
                      </h4>
                    </div>
                    
                    {sessionParticipants.length === 0 ? (
                      <div className="text-center py-8">
                        <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun participant inscrit à cette session</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sessionParticipants.map((participant) => (
                          <div key={participant.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback className="bg-[#81B441] text-white">
                                {participant.firstName.charAt(0)}{participant.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {participant.firstName} {participant.lastName}
                                </span>
                                {participant.checkedIn && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckBadgeIcon className="h-3 w-3 mr-1" />
                                    Présent
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {participant.email}
                              </div>
                              {participant.company && (
                                <div className="text-xs text-gray-400">
                                  {participant.company}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="speakers" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        Intervenants ({selectedSession.speakers?.length || 0})
                      </h4>
                    </div>
                    
                    {!selectedSession.speakers || selectedSession.speakers.length === 0 ? (
                      <div className="text-center py-8">
                        <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun intervenant assigné à cette session</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedSession.speakers.map((speaker) => (
                          <div key={speaker.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={speaker.avatar} />
                              <AvatarFallback className="bg-[#81B441] text-white">
                                {speaker.firstName.charAt(0)}{speaker.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">
                                  {speaker.firstName} {speaker.lastName}
                                </span>
                                {speaker.checkedIn && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckBadgeIcon className="h-3 w-3 mr-1" />
                                    Présent
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {speaker.email && (
                                  <div className="flex items-center gap-2">
                                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                    <span>{speaker.email}</span>
                                  </div>
                                )}
                                {speaker.company && (
                                  <div className="flex items-center gap-2">
                                    <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                    <span>{speaker.company}</span>
                                  </div>
                                )}
                                {speaker.jobTitle && (
                                  <div className="flex items-center gap-2">
                                    <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                                    <span>{speaker.jobTitle}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        Documents de la session ({sessionDocuments.length})
                      </h4>
                    </div>
                    
                    {sessionDocuments.length === 0 ? (
                      <div className="text-center py-8">
                        <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun document disponible pour cette session</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sessionDocuments.map((document, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                            <div className="flex-1">
                              <div className="font-medium">{document.name}</div>
                              <div className="text-sm text-gray-500">
                                {document.size && `${document.size} • `}
                                {document.type}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Styles pour le spinner */}
      <style jsx>{`
        .spinner {
          border: 3px solid rgba(129, 180, 65, 0.3);
          border-radius: 50%;
          border-top: 3px solid #81B441;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
} 