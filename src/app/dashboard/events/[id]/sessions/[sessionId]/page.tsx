"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeftIcon, 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Types
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
  capacity?: number;
  format?: string;
  banner?: string;
  video_url?: string;
};

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  jobTitle?: string;
  company?: string;
};

// Type pour les réponses de l'API concernant les participants
interface SessionParticipantResponse {
  id: string;
  sessionId: string;
  participantId: string;
  registeredAt: string;
  attendedSession: boolean;
  attendanceTime: string | null;
  participant: Participant;
}

// Fonction utilitaire pour vérifier si un lien est un lien YouTube et extraire l'ID
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  // Patterns pour les URLs YouTube
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,  // URL standard youtube.com/watch?v=ID
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,              // URL raccourcie youtu.be/ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i,    // URL d'intégration youtube.com/embed/ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

export default function SessionDetailPage({ params }: { params: Promise<{ id: string, sessionId: string }> }) {
  // Initialiser les params comme variables régulières pour éviter les erreurs
  const router = useRouter();
  const [eventId, setEventId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [speakers, setSpeakers] = useState<Participant[]>([]);
  const [sessionParticipants, setSessionParticipants] = useState<Participant[]>([]);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [isAddingParticipants, setIsAddingParticipants] = useState(false);

  // Extraire les paramètres une fois au chargement du composant
  useEffect(() => {
    if (params && params.id && params.sessionId) {
      setEventId(params.id);
      setSessionId(params.sessionId);
    }
  }, [params]);

  // Charger les détails de la session
  useEffect(() => {
    if (!eventId || !sessionId) return;

    const fetchSessionDetails = async () => {
      try {
        // Récupérer les détails de l'événement (pour le nom)
        const eventResponse = await fetch(`/api/events/${eventId}`);
        if (!eventResponse.ok) throw new Error("Erreur lors de la récupération des détails de l'événement");
        const eventData = await eventResponse.json();
        setEventName(eventData.name);

        // Récupérer les détails de la session
        const response = await fetch(`/api/events/${eventId}/sessions/${sessionId}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des détails de la session");
        const data = await response.json();
        setSession(data);

        // Si la session a des intervenants, récupérer leurs détails
        if (data.speaker) {
          await fetchSpeakerDetails(data.speaker);
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de récupérer les détails de la session");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [eventId, sessionId]);

  // Charger les participants de l'événement
  useEffect(() => {
    if (!eventId) return;

    const fetchEventParticipants = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/registrations`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des participants");
        const data = await response.json();
        
        setAllParticipants(data.registrations || []);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de récupérer les participants de l'événement");
      }
    };

    fetchEventParticipants();
  }, [eventId]);

  // Charger les participants de la session
  useEffect(() => {
    if (!eventId || !sessionId) return;

    const fetchSessionParticipants = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/sessions/${sessionId}/participants`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des participants de la session");
        const data = await response.json();
        
        // Extraire les données des participants
        const formattedParticipants = data.map((item: SessionParticipantResponse) => item.participant);
        setSessionParticipants(formattedParticipants);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de récupérer les participants de la session");
      }
    };

    fetchSessionParticipants();
  }, [eventId, sessionId]);

  // Fonction pour récupérer les détails des intervenants
  const fetchSpeakerDetails = async (speakerIds: string) => {
    try {
      // Les IDs des intervenants sont stockés sous forme de chaîne séparée par des virgules
      const speakerIdArray = speakerIds.split(',');
      if (speakerIdArray.length === 0) return;

      // Récupérer tous les participants de l'événement
      const response = await fetch(`/api/events/${eventId}/registrations`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des participants");
      const data = await response.json();

      // Filtrer les participants pour ne garder que les intervenants
      const participantList = data.registrations || [];
      const speakersList = participantList.filter((participant: Participant) => 
        speakerIdArray.includes(participant.id)
      );

      setSpeakers(speakersList);
    } catch (error) {
      console.error("Erreur lors de la récupération des intervenants:", error);
    }
  };

  // Filtrer les participants par recherche
  const filteredParticipants = participantSearch 
    ? allParticipants.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(participantSearch.toLowerCase()) ||
        p.email.toLowerCase().includes(participantSearch.toLowerCase())
      )
    : allParticipants;

  // Ouvrir la modale pour ajouter des participants
  const openParticipantModal = () => {
    setSelectedParticipantIds(sessionParticipants.map(p => p.id));
    setIsParticipantModalOpen(true);
  };

  // Gérer la sélection d'un participant
  const toggleParticipantSelection = (participantId: string) => {
    setSelectedParticipantIds(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  // Ajouter les participants sélectionnés à la session
  const addParticipantsToSession = async () => {
    if (!eventId || !sessionId) return;
    
    setIsAddingParticipants(true);
    
    try {
      // Ajouter chaque participant sélectionné à la session
      const addPromises = selectedParticipantIds.map(async (participantId) => {
        // Vérifier si le participant est déjà dans la session
        const isAlreadyInSession = sessionParticipants.some(p => p.id === participantId);
        if (isAlreadyInSession) return;

        const response = await fetch(`/api/events/${eventId}/sessions/${sessionId}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de l'ajout du participant");
        }
      });
      
      await Promise.all(addPromises);
      
      // Récupérer la liste mise à jour des participants de la session
      const response = await fetch(`/api/events/${eventId}/sessions/${sessionId}/participants`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des participants de la session");
      const data = await response.json();
      
      // Extraire les données des participants
      const formattedParticipants = data.map((item: SessionParticipantResponse) => item.participant);
      setSessionParticipants(formattedParticipants);
      
      toast.success("Participants ajoutés avec succès");
      setIsParticipantModalOpen(false);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible d'ajouter les participants");
    } finally {
      setIsAddingParticipants(false);
    }
  };

  // Retirer un participant de la session
  const removeParticipantFromSession = async (participantId: string) => {
    if (!eventId || !sessionId) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}/sessions/${sessionId}/participants?participantId=${participantId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression du participant");
      }
      
      // Mettre à jour la liste locale des participants
      setSessionParticipants(prev => prev.filter(p => p.id !== participantId));
      
      toast.success("Participant retiré avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de retirer le participant");
    }
  };

  const handleDeleteSession = async () => {
    if (!eventId || !sessionId) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette session ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la session");
      }

      toast.success("Session supprimée avec succès");
      // Rediriger vers la liste des sessions
      router.push(`/dashboard/events/${eventId}/sessions`);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue lors de la suppression");
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE d MMMM yyyy", { locale: fr });
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return dateString;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EventSidebar eventId={eventId} />
      
      <main className="flex-1 p-6 ml-0 md:ml-64 transition-all duration-300 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header with back button and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <div className="flex items-center mb-1">
                <Link 
                  href={`/dashboard/events/${eventId}/sessions`}
                  className="inline-flex items-center mr-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-1" />
                  Retour au programme
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Détails de la session</h1>
              <p className="mt-1 text-sm text-gray-500">
                {eventName}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Link href={`/dashboard/events/${eventId}/sessions/edit/${sessionId}`}>
                <Button className="bg-[#81B441] hover:bg-[#72a139]">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="spinner"></div>
              <p className="ml-3 text-gray-500">Chargement des détails...</p>
            </div>
          ) : !session ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Session non trouvée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cette session n&apos;existe pas ou a été supprimée.
                </p>
                <div className="mt-4">
                  <Link href={`/dashboard/events/${eventId}/sessions`}>
                    <Button variant="outline">Retour aux sessions</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grand bloc central avec toutes les informations */}
              <div className="flex flex-col bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
                {/* Section d'en-tête avec les informations principales */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Bannière de la session (format rectangulaire 400x200) */}
                    <div className="w-full md:w-[400px] h-[200px] rounded-md overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
                      {session.banner ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <img src={session.banner} alt={session.title} className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-white text-gray-800">
                          <span className="text-xl font-medium">TIF</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Informations de la session à droite */}
                    <div className="flex-1">
                      <div className="mb-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {session.format || "physical"}
                        </span>
                        {session.capacity && (
                          <span className="text-xs ml-2 text-gray-600">
                            {session.capacity} places
                          </span>
                        )}
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {session.title}
                      </h2>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {formatDate(session.start_date)}
                        </div>
                        
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {session.start_time} - {session.end_time}
                        </div>
                        
                        {session.location && (
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            {session.location}
                          </div>
                        )}

                        {session.video_url && (
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <a href={session.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              {session.format === "virtual" ? "Lien de visioconférence" : "Lien vidéo"}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Onglets de navigation */}
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button 
                      className={`px-6 py-3 ${activeTab === "details" ? "text-[#81B441] border-b-2 border-[#81B441] font-medium" : "text-gray-500 hover:text-gray-700"}`}
                      onClick={() => setActiveTab("details")}
                    >
                      Détails
                    </button>
                    <button 
                      className={`px-6 py-3 ${activeTab === "intervenants" ? "text-[#81B441] border-b-2 border-[#81B441] font-medium" : "text-gray-500 hover:text-gray-700"}`}
                      onClick={() => setActiveTab("intervenants")}
                    >
                      Intervenants
                    </button>
                    <button 
                      className={`px-6 py-3 ${activeTab === "participants" ? "text-[#81B441] border-b-2 border-[#81B441] font-medium" : "text-gray-500 hover:text-gray-700"}`}
                      onClick={() => setActiveTab("participants")}
                    >
                      Participants
                    </button>
                    <button 
                      className={`px-6 py-3 ${activeTab === "documents" ? "text-[#81B441] border-b-2 border-[#81B441] font-medium" : "text-gray-500 hover:text-gray-700"}`}
                      onClick={() => setActiveTab("documents")}
                    >
                      Documents & Liens
                    </button>
                    <button 
                      className={`px-6 py-3 ${activeTab === "preferences" ? "text-[#81B441] border-b-2 border-[#81B441] font-medium" : "text-gray-500 hover:text-gray-700"}`}
                      onClick={() => setActiveTab("preferences")}
                    >
                      Préférences
                    </button>
                  </div>
                </div>
                
                {/* Contenu de l'onglet */}
                <div className="p-6">
                  {activeTab === "details" && (
                    <>
                      <h3 className="text-lg font-medium mb-4">Description</h3>
                      <div className="prose max-w-none text-gray-700">
                        {session.description ? (
                          <p>{session.description}</p>
                        ) : (
                          <p className="text-gray-500 italic">Mot de bienvenue, petit déjeuner</p>
                        )}
                      </div>
                      
                      {/* Prévisualisation vidéo YouTube si disponible */}
                      {session.video_url && getYoutubeVideoId(session.video_url) && (
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-4">Vidéo</h3>
                          <div className="aspect-video w-full max-w-2xl mx-auto bg-black rounded-lg overflow-hidden">
                            <iframe 
                              src={`https://www.youtube.com/embed/${getYoutubeVideoId(session.video_url)}`}
                              className="w-full h-full"
                              title={`Vidéo pour ${session.title}`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {activeTab === "intervenants" && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Intervenants</h3>
                        <div className="text-sm text-gray-500">
                          Modifiables depuis le formulaire de session
                        </div>
                      </div>
                      
                      {session.speaker && speakers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {speakers.map((speaker) => (
                            <div key={speaker.id} className="border rounded-lg p-4 transition-colors hover:bg-gray-50">
                              <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden">
                                  <span className="text-gray-500 text-2xl font-medium">
                                    {speaker.firstName.charAt(0)}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">
                                  {`${speaker.firstName} ${speaker.lastName}`}
                                </h4>
                                {speaker.jobTitle && (
                                  <p className="text-sm text-gray-600 mb-1">{speaker.jobTitle}</p>
                                )}
                                {speaker.company && (
                                  <p className="text-sm text-[#81B441]">{speaker.company}</p>
                                )}
                                {!speaker.jobTitle && !speaker.company && (
                                  <p className="text-sm text-gray-500 italic">Pas d&apos;information professionnelle</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 border rounded-lg">
                          <p className="text-gray-500">Aucun intervenant défini pour cette session</p>
                          <p className="text-sm text-gray-400 mt-2">
                            Vous pouvez ajouter des intervenants en modifiant la session
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {activeTab === "participants" && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Participants</h3>
                        <Button 
                          className="flex items-center bg-[#81B441] hover:bg-[#72a139]" 
                          size="sm"
                          onClick={openParticipantModal}
                        >
                          <UserPlusIcon className="h-4 w-4 mr-1" />
                          Ajouter des participants
                        </Button>
                      </div>
                      
                      {sessionParticipants.length > 0 ? (
                        <div className="space-y-4">
                          <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nom
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fonction
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {sessionParticipants.map((participant) => (
                                  <tr key={participant.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                          <span className="text-gray-500 font-medium">
                                            {participant.firstName.charAt(0)}
                                          </span>
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">
                                            {participant.firstName} {participant.lastName}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {participant.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {participant.type}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {participant.jobTitle && (
                                        <div>{participant.jobTitle}</div>
                                      )}
                                      {participant.company && (
                                        <div className="text-[#81B441]">{participant.company}</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <button 
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => removeParticipantFromSession(participant.id)}
                                      >
                                        Retirer
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 border rounded-lg">
                          <p className="text-gray-500">Aucun participant inscrit à cette session</p>
                          <p className="text-sm text-gray-400 mt-2">
                            Vous pouvez ajouter des participants inscrits à l&apos;événement
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {activeTab === "documents" && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Documents & Liens</h3>
                        <button className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-md flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Ajouter
                        </button>
                      </div>
                      <div className="text-center py-10 border rounded-lg">
                        <p className="text-gray-500">Aucun document disponible</p>
                      </div>
                    </>
                  )}
                  
                  {activeTab === "preferences" && (
                    <>
                      <h3 className="text-lg font-medium mb-4">Préférences</h3>
                      <p className="text-gray-500">Options avancées pour cette session</p>
                    </>
                  )}
                </div>
              </div>
              
              {/* Bouton de suppression */}
              <Button 
                variant="outline"
                onClick={handleDeleteSession}
                className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Supprimer cette session
              </Button>
            </>
          )}
        </div>
      </main>

      {/* Modale de sélection des participants */}
      <Dialog open={isParticipantModalOpen} onOpenChange={setIsParticipantModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ajouter des participants à la session</DialogTitle>
            <DialogDescription>
              Sélectionnez les participants à ajouter à cette session parmi les inscrits à l&apos;événement.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              className="mb-4"
            />
            
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((participant) => (
                      <tr 
                        key={participant.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedParticipantIds.includes(participant.id) ? "bg-green-50" : ""
                        }`}
                        onClick={() => toggleParticipantSelection(participant.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox 
                            checked={selectedParticipantIds.includes(participant.id)}
                            onCheckedChange={() => toggleParticipantSelection(participant.id)}
                            className="accent-[#81B441]"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {participant.firstName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3 text-sm font-medium text-gray-900">
                              {participant.firstName} {participant.lastName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {participant.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {participant.type}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Aucun participant ne correspond à votre recherche
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsParticipantModalOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={addParticipantsToSession}
              disabled={isAddingParticipants}
              className="bg-[#81B441] hover:bg-[#72a139]"
            >
              {isAddingParticipants ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ajout en cours...
                </span>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Ajouter les participants sélectionnés
                </>
              )}
            </Button>
          </div>
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
      `}</style>
    </div>
  );
} 