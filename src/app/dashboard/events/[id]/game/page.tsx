"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeftIcon,
  TrophyIcon,
  UserGroupIcon,
  CheckIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  StarIcon,
  FlagIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
  totalPoints: number;
  rank: number;
  avatar?: string;
  lastActivity?: string;
};

type Challenge = {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: React.ElementType;
  color: string;
  action: string;
};

type GameStats = {
  totalParticipants: number;
  totalPoints: number;
  averagePoints: number;
  topScorer?: Participant;
};

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalParticipants: 0,
    totalPoints: 0,
    averagePoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Configuration des challenges
  const challenges: Challenge[] = [
    {
      id: "checkin",
      name: "Check-in à l'événement",
      description: "Se présenter à l'accueil et enregistrer sa présence",
      points: 50,
      icon: CheckIcon,
      color: "bg-[#81B441] text-[#81B441]", // Uniformisé
      action: "CHECK_IN"
    },
    {
      id: "session_entry",
      name: "Entrée dans une session",
      description: "Participer à une session du programme",
      points: 20,
      icon: CalendarIcon,
      color: "bg-[#81B441] text-[#81B441]",
      action: "SESSION_ENTRY"
    },
    {
      id: "session_participation",
      name: "Participation active",
      description: "Être présent durant toute la session",
      points: 30,
      icon: StarIcon,
      color: "bg-[#81B441] text-[#81B441]",
      action: "SESSION_PARTICIPATION"
    },
    {
      id: "participant_scan",
      name: "Scan d'un participant",
      description: "Scanner le QR code d'un autre participant",
      points: 10,
      icon: UserIcon,
      color: "bg-[#81B441] text-[#81B441]",
      action: "PARTICIPANT_SCAN"
    },
    {
      id: "appointment_request",
      name: "Demande de rendez-vous",
      description: "Envoyer une demande de rendez-vous",
      points: 15,
      icon: ClockIcon,
      color: "bg-[#81B441] text-[#81B441]",
      action: "APPOINTMENT_REQUEST"
    },
    {
      id: "appointment_confirmed",
      name: "Rendez-vous confirmé",
      description: "Avoir un rendez-vous accepté et confirmé",
      points: 30,
      icon: FlagIcon,
      color: "bg-[#81B441] text-[#81B441]",
      action: "APPOINTMENT_CONFIRMED"
    }
  ];
  
  // Extraire les paramètres une fois au chargement du composant
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);
    };
    extractParams();
  }, [params]);

  // Charger les données de l'événement
  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchGameData();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const eventData = await response.json();
        setEvent(eventData);
      } else {
        console.error("Erreur lors de la récupération de l'événement");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchGameData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/game/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
        setGameStats(data.stats || {
          totalParticipants: 0,
          totalPoints: 0,
          averagePoints: 0
        });
      } else {
        console.error("Erreur lors de la récupération des données du jeu");
        toast.error("Erreur lors du chargement des données");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchGameData();
    setRefreshing(false);
    toast.success("Données mises à jour");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-600 font-bold";
      case 2:
        return "text-gray-600 font-bold";
      case 3:
        return "text-orange-600 font-bold";
      default:
        return "text-gray-500";
    }
  };

  // Séparer le top 3 des autres participants (max 10 autres)
  const topThree = participants.slice(0, 3);
  const otherParticipants = participants.slice(3, 13); // Limiter à 10 participants supplémentaires

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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <TrophyIcon className="w-8 h-8 mr-3 text-[#81B441]" />
                Game & Classement
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Système de scoring et classement des participants pour {event?.name || ''}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Button 
                onClick={refreshData}
                disabled={refreshing}
                className="bg-[#81B441] hover:bg-[#72a139]"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Participants</p>
                    <p className="text-2xl font-bold text-gray-900">{gameStats.totalParticipants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrophyIcon className="h-8 w-8 text-[#81B441]" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Points totaux</p>
                    <p className="text-2xl font-bold text-gray-900">{gameStats.totalPoints}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <StarIcon className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Moyenne</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(gameStats.averagePoints || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FlagIcon className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Top scorer</p>
                    <p className="text-lg font-bold text-gray-900">
                      {gameStats.topScorer ? `${gameStats.topScorer.firstName} ${gameStats.topScorer.lastName}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Section Classement */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrophyIcon className="w-6 h-6 mr-2 text-[#81B441]" />
                    Classement des participants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="spinner"></div>
                      <p className="ml-3 text-gray-500">Chargement du classement...</p>
                    </div>
                  ) : participants.length === 0 ? (
                    <div className="text-center py-20">
                      <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun participant</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Le classement apparaîtra dès que les participants commenceront à marquer des points.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Top 3 - Podium */}
                      {topThree.length > 0 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <StarIcon className="w-5 h-5 mr-2 text-yellow-600" />
                            Top 3
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {topThree.map((participant) => (
                              <div 
                                key={participant.id}
                                className={cn(
                                  "bg-white rounded-lg p-4 text-center shadow-sm border-2",
                                  participant.rank === 1 ? "border-yellow-400" :
                                  participant.rank === 2 ? "border-gray-400" :
                                  "border-orange-400"
                                )}
                              >
                                <div className="mb-3">
                                  <div className="text-2xl mb-2">{getRankIcon(participant.rank)}</div>
                                  <Avatar className="w-12 h-12 mx-auto">
                                    <AvatarImage src={participant.avatar} />
                                    <AvatarFallback className="bg-[#81B441] text-white">
                                      {getInitials(participant.firstName, participant.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <h4 className="font-semibold text-gray-900">
                                  {participant.firstName} {participant.lastName}
                                </h4>
                                {participant.company && (
                                  <p className="text-xs text-gray-500 mt-1">{participant.company}</p>
                                )}
                                <div className="mt-2">
                                  <span className="text-[#81B441] font-bold text-lg">{participant.totalPoints} pts</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tableau des autres participants */}
                      {otherParticipants.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Autres participants
                          </h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Rang</TableHead>
                                  <TableHead>Participant</TableHead>
                                  <TableHead>Entreprise</TableHead>
                                  <TableHead className="text-right">Points</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {otherParticipants.map((participant) => (
                                  <TableRow key={participant.id}>
                                    <TableCell>
                                      <span className={getRankColor(participant.rank)}>
                                        #{participant.rank}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <Avatar className="w-8 h-8 mr-3">
                                          <AvatarImage src={participant.avatar} />
                                          <AvatarFallback className="bg-[#81B441] text-white text-xs">
                                            {getInitials(participant.firstName, participant.lastName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {participant.firstName} {participant.lastName}
                                          </div>
                                          <div className="text-sm text-gray-500">{participant.email}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        <div className="text-gray-900">{participant.company || 'N/A'}</div>
                                        <div className="text-gray-500">{participant.jobTitle || ''}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className="text-[#81B441] font-bold">{participant.totalPoints} pts</span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Section Challenges */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <StarIcon className="w-6 h-6 mr-2 text-yellow-600" />
                    Challenges & Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {challenges.map((challenge) => (
                      <div 
                        key={challenge.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start">
                          <div className={cn("p-2 rounded-full mr-3", challenge.color)}>
                            <challenge.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {challenge.name}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {challenge.description}
                            </p>
                            <div className="mt-2">
                              <span className="text-[#81B441] font-bold">+{challenge.points} pts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">
                      💡 Comment ça marche ?
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Les points sont attribués automatiquement</li>
                      <li>• Le classement est mis à jour en temps réel</li>
                      <li>• Encouragez la participation active</li>
                      <li>• Les interactions valent des points</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 