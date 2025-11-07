"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import Link from "next/link";

import MatchSuggestions from "@/components/matchmaking/MatchSuggestions";
import AppointmentRequestForm from "@/components/appointments/AppointmentRequestForm";
import MatchmakingWizard from "@/components/matchmaking/MatchmakingWizard";

// Types pour les rendez-vous
type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
};

type AppointmentStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";

type Appointment = {
  id: string;
  eventId: string;
  requesterId: string;
  requester: Participant;
  recipientId: string;
  recipient: Participant;
  status: AppointmentStatus;
  message?: string;
  proposedTime?: string;
  confirmedTime?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export default function UserRendezVousPage() {
  const { id } = useParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending"); // Par défaut sur "À traiter"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUserRegistrationId, setCurrentUserRegistrationId] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string} | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [showMatchmakingWizard, setShowMatchmakingWizard] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<{
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
    location: string;
    sector?: string;
    description?: string;
  } | null>(null);

  // Récupérer les rendez-vous depuis l'API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${id}/appointments`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des rendez-vous");
      }
      
      const data = await response.json();
      setAppointments(data);
      setError(null);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de charger les rendez-vous");
      toast.error("Erreur lors du chargement des rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  // Fetch event details
  const fetchEventDetails = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/events/${id}`);
      const data = await response.json();
      setCurrentEvent(data);
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  // Obtenir l'ID de registration de l'utilisateur courant et son rôle
  const fetchCurrentUserRegistration = async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session");
      const sessionData = await sessionResponse.json();
      
      if (sessionData && sessionData.user && sessionData.user.email) {
        // Stocker le rôle utilisateur
        setUserRole(sessionData.user.role || 'USER');
        
        // Récupérer l'ID de registration de l'utilisateur pour cet événement
        const registrationResponse = await fetch(`/api/events/${id}/registrations?userEmail=${sessionData.user.email}`);
        const registrationData = await registrationResponse.json();
        
        if (registrationData && registrationData.registration) {
          setCurrentUserRegistrationId(registrationData.registration.id);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la récupération de l'enregistrement utilisateur:", err);
    }
  };

  useEffect(() => {
    if (!id) return;
    
    fetchEventDetails();
    fetchCurrentUserRegistration();
    fetchAppointments();

    // Vérifier si l'écran est mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [id]); // Les fonctions sont définies dans le composant, pas besoin de les inclure

  // Fonction pour mettre à jour le statut d'un rendez-vous
  const updateAppointmentStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      const response = await fetch(`/api/events/${id}/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du rendez-vous");
      }

      const updatedAppointment = await response.json();
      
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId ? updatedAppointment : appointment
        )
      );
      
      toast.success(`Rendez-vous ${
        newStatus === "ACCEPTED" ? "accepté" : 
        newStatus === "DECLINED" ? "refusé" : 
        "marqué comme terminé"
      } avec succès`);

      setDialogOpen(false);
      
      // Actualiser la liste après la mise à jour
      fetchAppointments();
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Impossible de mettre à jour le rendez-vous");
    }
  };

  // Fonction pour filtrer les rendez-vous
  const filteredAppointments = appointments.filter(appointment => {
    const requesterName = `${appointment.requester.firstName} ${appointment.requester.lastName}`.toLowerCase();
    const recipientName = `${appointment.recipient.firstName} ${appointment.recipient.lastName}`.toLowerCase();
    
    const matchesSearch = 
      searchQuery === "" ||
      requesterName.includes(searchQuery.toLowerCase()) ||
      recipientName.includes(searchQuery.toLowerCase()) ||
      (appointment.message && appointment.message.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" || 
      appointment.status === statusFilter;
    
    const matchesDirection = 
      activeTab === "pending" && appointment.recipientId === currentUserRegistrationId && appointment.status === "PENDING" ||
      activeTab === "received" && appointment.recipientId === currentUserRegistrationId ||
      activeTab === "sent" && appointment.requesterId === currentUserRegistrationId ||
      activeTab === "accepted" && appointment.status === "ACCEPTED" && (appointment.recipientId === currentUserRegistrationId || appointment.requesterId === currentUserRegistrationId);
    
    return matchesSearch && matchesStatus && matchesDirection;
  });

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Non spécifié";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Rendu d'un badge de statut
  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">En attente</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Accepté</Badge>;
      case "DECLINED":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Refusé</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Terminé</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  // Obtenir les informations de l'autre participant
  const getOtherPerson = (appointment: Appointment) => {
    const isIncoming = appointment.recipientId === currentUserRegistrationId;
    return isIncoming ? appointment.requester : appointment.recipient;
  };

  // Calculer les statistiques basées sur l'utilisateur courant
  const getReceivedAppointments = () => appointments.filter(a => a.recipientId === currentUserRegistrationId);
  const getSentAppointments = () => appointments.filter(a => a.requesterId === currentUserRegistrationId);
  const getPendingReceived = () => getReceivedAppointments().filter(a => a.status === "PENDING");
  const getAcceptedAppointments = () => appointments.filter(a => a.status === "ACCEPTED" && (a.recipientId === currentUserRegistrationId || a.requesterId === currentUserRegistrationId));

  // Calculer les nombres pour les onglets
  const pendingCount = getPendingReceived().length;
  const receivedCount = getReceivedAppointments().length;
  const sentCount = getSentAppointments().length;
  const acceptedCount = getAcceptedAppointments().length;

  return (
    <div className="dashboard-container min-h-screen overflow-hidden">
      <UserEventSidebar 
        eventId={id as string}
        activeTab="rendez-vous"
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
                  href={`/dashboard/user/events/${id}`}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-2" />
                  <span>Retour à l&apos;événement</span>
                </Link>
                <h1 className="text-xl font-bold text-gray-900">
                  Mes Rendez-vous
                </h1>
              </div>
              
              {/* Navigation vers sous-pages - Admin/Organizer seulement */}
              {(userRole === 'ADMIN' || userRole === 'ORGANIZER') && (
                <div className="flex items-center space-x-2">
                  <Link 
                    href={`/dashboard/user/events/${id}/rendez-vous/horaires`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Horaires
                  </Link>
                  <Link 
                    href={`/dashboard/user/events/${id}/rendez-vous/lieux`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Lieux
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="p-6 space-y-6">
            {/* Configuration du matchmaking - Maintenant en premier */}
            <div className="bg-gradient-to-r from-[#DBAEEE] to-[#94C3E9] p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Configuration du matchmaking</h2>
                  <p className="text-white/90 text-sm">Configurez votre profil pour recevoir des suggestions personnalisées</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowMatchmakingWizard(true)}
                  className="bg-[#81B441] text-white border-none"
                >
                  Configurer mon profil
                </Button>
              </div>
            </div>

            {/* Section Suggestions de participants */}
            <MatchSuggestions 
              eventId={id as string}
              onRequestMeeting={(userId, userName) => {
                setSelectedUser({id: userId, name: userName});
                setShowRequestForm(true);
              }}
            />

            <Separator />

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">À traiter</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {pendingCount}
                    </p>
                  </div>
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    Demandes reçues en attente
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Reçus</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {receivedCount}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    Total demandes reçues
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Envoyés</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {sentCount}
                    </p>
                  </div>
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <EyeIcon className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Mes demandes envoyées
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Acceptés</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {acceptedCount}
                    </p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Rendez-vous confirmés
                  </span>
                </div>
              </div>
            </div>

            {/* Liste des rendez-vous */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des rendez-vous</CardTitle>
                <CardDescription>
                  Consultez et gérez vos demandes de rendez-vous
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Rechercher par nom, email ou message..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="ACCEPTED">Acceptés</SelectItem>
                        <SelectItem value="DECLINED">Refusés</SelectItem>
                        <SelectItem value="COMPLETED">Terminés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                      À traiter
                      {pendingCount > 0 && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs px-2 py-0.5 min-w-[20px] h-5">
                          {pendingCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="received" className="flex items-center gap-2">
                      Reçus
                      {receivedCount > 0 && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs px-2 py-0.5 min-w-[20px] h-5">
                          {receivedCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex items-center gap-2">
                      Envoyées
                      {sentCount > 0 && (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs px-2 py-0.5 min-w-[20px] h-5">
                          {sentCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="accepted" className="flex items-center gap-2">
                      Acceptées
                      {acceptedCount > 0 && (
                        <Badge variant="outline" className="bg-[#81B441]/20 text-[#81B441] border-[#81B441]/30 text-xs px-2 py-0.5 min-w-[20px] h-5">
                          {acceptedCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <p>Chargement des rendez-vous...</p>
                    </div>
                  ) : error ? (
                    <div className="flex justify-center items-center h-32 text-red-500">
                      <p>{error}</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Participant</TableHead>
                            <TableHead>Date proposée</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Direction</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAppointments.length > 0 ? (
                            filteredAppointments.map((appointment) => {
                              const otherPerson = getOtherPerson(appointment);
                              const isIncoming = appointment.recipientId === currentUserRegistrationId;
                              const fullName = `${otherPerson.firstName} ${otherPerson.lastName}`;
                              
                              return (
                                <TableRow 
                                  key={appointment.id}
                                  className="cursor-pointer hover:bg-slate-50"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback>{otherPerson.firstName[0]}{otherPerson.lastName[0]}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{fullName}</div>
                                        <div className="text-xs text-muted-foreground">{otherPerson.company}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {formatDate(appointment.proposedTime || appointment.createdAt)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {renderStatusBadge(appointment.status)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={isIncoming ? "outline" : "secondary"}>
                                      {isIncoming ? "Reçu" : "Envoyé"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {/* Bouton Accepter directement dans le tableau pour les demandes reçues en attente */}
                                    {appointment.status === "PENDING" && isIncoming && (activeTab === "pending" || activeTab === "received") ? (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="bg-[#81B441] text-white border-[#81B441]"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateAppointmentStatus(appointment.id, "ACCEPTED");
                                          }}
                                        >
                                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                                          Accepter
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAppointment(appointment);
                                            setDialogOpen(true);
                                          }}
                                        >
                                          <EyeIcon className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedAppointment(appointment);
                                          setDialogOpen(true);
                                        }}
                                      >
                                        <EyeIcon className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center">
                                {activeTab === "pending" && "Aucune demande à traiter" || 
                                 activeTab === "received" && "Aucune demande reçue" || 
                                 activeTab === "sent" && "Aucune demande envoyée" ||
                                 activeTab === "accepted" && "Aucun rendez-vous accepté" ||
                                 "Aucun rendez-vous trouvé"}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialog de détails du rendez-vous */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>Détails du rendez-vous</DialogTitle>
                <DialogDescription>
                  {selectedAppointment.recipientId === currentUserRegistrationId 
                    ? "Demande reçue" 
                    : "Demande envoyée"} le {formatDate(selectedAppointment.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {getOtherPerson(selectedAppointment).firstName[0]}
                      {getOtherPerson(selectedAppointment).lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {getOtherPerson(selectedAppointment).firstName} {getOtherPerson(selectedAppointment).lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getOtherPerson(selectedAppointment).jobTitle} 
                      {getOtherPerson(selectedAppointment).company ? ` chez ${getOtherPerson(selectedAppointment).company}` : ''}
                    </p>
                  </div>
                  <div className="ml-auto">
                    {renderStatusBadge(selectedAppointment.status)}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-md text-sm">
                  {selectedAppointment.message || "Aucun message"}
                </div>

                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Proposé: {formatDate(selectedAppointment.proposedTime || selectedAppointment.createdAt)}</span>
                  </div>
                  {selectedAppointment.confirmedTime && (
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>Confirmé: {formatDate(selectedAppointment.confirmedTime)}</span>
                    </div>
                  )}
                  {selectedAppointment.location && (
                    <div className="flex items-center">
                      <span>Lieu: {selectedAppointment.location}</span>
                    </div>
                  )}
                </div>

                {selectedAppointment.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Notes:</h4>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}

                <Separator />

                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button variant="outline">Fermer</Button>
                  </DialogClose>

                  {selectedAppointment.status === "PENDING" && selectedAppointment.recipientId === currentUserRegistrationId && (
                    <>
                      <Button 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, "DECLINED")}
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Refuser
                      </Button>
                      <Button 
                        className="bg-[#81B441] hover:bg-[#6a9636]"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, "ACCEPTED")}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Accepter
                      </Button>
                    </>
                  )}
                  
                  {selectedAppointment.status === "ACCEPTED" && (
                    <Button 
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => updateAppointmentStatus(selectedAppointment.id, "COMPLETED")}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Marquer comme terminé
                    </Button>
                  )}
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de demande de rendez-vous */}
      {showRequestForm && selectedUser && (
        <AppointmentRequestForm
          isOpen={showRequestForm}
          onClose={() => {
            setShowRequestForm(false);
            setSelectedUser(null);
          }}
          recipient={{
            id: selectedUser.id,
            firstName: selectedUser.name.split(' ')[0] || '',
            lastName: selectedUser.name.split(' ').slice(1).join(' ') || '',
            email: '',
            company: '',
            jobTitle: ''
          }}
          event={currentEvent!}
          currentUserRegistrationId={currentUserRegistrationId!}
          onSuccess={() => {
            setShowRequestForm(false);
            setSelectedUser(null);
            fetchAppointments();
          }}
                    />
          )}

          {/* Wizard de configuration du matchmaking */}
          {showMatchmakingWizard && currentEvent && (
            <MatchmakingWizard
              isOpen={showMatchmakingWizard}
              onClose={() => setShowMatchmakingWizard(false)}
              eventId={id as string}
              eventName={currentEvent.name}
              eventSector={currentEvent.sector}
              eventDescription={currentEvent.description}
            />
          )}
        </div>
      );
} 