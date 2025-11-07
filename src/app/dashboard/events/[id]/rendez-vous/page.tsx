"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  ClipboardDocumentCheckIcon,
  ClockIcon as ClockIconOutline,
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
import { toast } from "@/components/ui/use-toast";

// Types pour les rendez-vous
type Participant = {
  id: string;
  firstName: string; // Modifié pour correspondre à l'API
  lastName: string;  // Modifié pour correspondre à l'API
  email: string;
  company?: string;
  jobTitle?: string; // Modifié pour correspondre à l'API
};

type AppointmentStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED"; // Modifié pour correspondre à l'API (majuscules)

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

export default function RendezVousPage() {
  const { id } = useParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
      toast({
        title: "Erreur",
        description: "Impossible de charger les rendez-vous",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtenir l'ID de l'utilisateur courant (pour déterminer si un rendez-vous est reçu ou envoyé)
  const fetchCurrentUser = async () => {
    try {
      // Cette partie dépend de comment vous identifiez l'utilisateur courant
      // Par exemple, vous pourriez utiliser une API qui renvoie les informations de l'utilisateur
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      
      if (data && data.user) {
        // Simuler l'ID de participant pour l'exemple - dans un cas réel,
        // vous auriez besoin de mapper l'ID de l'utilisateur à son ID de participant pour cet événement
        setCurrentUserId(data.user.id);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération de l'utilisateur:", err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
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
  }, [id]);

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
      
      // Mettre à jour l'état local
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId ? updatedAppointment : appointment
        )
      );
      
      toast({
        title: "Succès",
        description: `Rendez-vous ${
          newStatus === "ACCEPTED" ? "accepté" : 
          newStatus === "DECLINED" ? "refusé" : 
          "marqué comme terminé"
        } avec succès`,
      });

      setDialogOpen(false);
    } catch (err) {
      console.error("Erreur:", err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rendez-vous",
        variant: "destructive",
      });
    }
  };

  // Fonction pour filtrer les rendez-vous
  const filteredAppointments = appointments.filter(appointment => {
    // Filtre de recherche
    const requesterName = `${appointment.requester.firstName} ${appointment.requester.lastName}`.toLowerCase();
    const recipientName = `${appointment.recipient.firstName} ${appointment.recipient.lastName}`.toLowerCase();
    
    const matchesSearch = 
      searchQuery === "" ||
      requesterName.includes(searchQuery.toLowerCase()) ||
      recipientName.includes(searchQuery.toLowerCase()) ||
      (appointment.message && appointment.message.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filtre de statut
    const matchesStatus = 
      statusFilter === "all" || 
      appointment.status === statusFilter;
    
    // Filtre de direction (tous, reçus, envoyés)
    const matchesDirection = 
      activeTab === "all" || 
      (activeTab === "received" && appointment.recipientId === currentUserId) ||
      (activeTab === "sent" && appointment.requesterId === currentUserId);
    
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
    const isIncoming = appointment.recipientId === currentUserId;
    return isIncoming ? appointment.requester : appointment.recipient;
  };

  // Fonction pour créer un nouveau rendez-vous (à appeler depuis un formulaire modal de création)
  const createAppointment = async (recipientId: string, message: string, proposedTime: string) => {
    try {
      const response = await fetch(`/api/events/${id}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterId: currentUserId, // L'utilisateur actuel est le demandeur
          recipientId,
          message,
          proposedTime
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du rendez-vous");
      }

      const newAppointment = await response.json();
      
      // Ajouter le nouveau rendez-vous à l'état local
      setAppointments(prev => [newAppointment, ...prev]);
      
      toast({
        title: "Succès",
        description: "Demande de rendez-vous envoyée avec succès",
      });
      
      return newAppointment;
    } catch (err) {
      console.error("Erreur:", err);
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande de rendez-vous",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Ajoutez ici d'autres fonctions utilitaires au besoin

  return (
    <div className="dashboard-container min-h-screen overflow-hidden">
      <EventSidebar 
        eventId={id as string} 
        onExpandChange={(expanded) => setSidebarExpanded(expanded)}
      />
      
      <div 
        className={`dashboard-content bg-gray-50 ${!sidebarExpanded ? 'dashboard-content-collapsed' : ''}`}
        style={{ 
          marginLeft: isMobile ? 0 : sidebarExpanded ? '16rem' : '4rem',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rendez-vous</h1>
              <p className="text-muted-foreground mt-1">
                Gérez les demandes de rendez-vous pour votre événement
              </p>
            </div>
            
            {/* Boutons de navigation pour Admin/Organizer */}
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Link 
                href={`/dashboard/events/${id}/rendez-vous/horaires`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ClockIcon className="w-4 h-4 mr-2" />
                Horaires
              </Link>
              <Link 
                href={`/dashboard/events/${id}/rendez-vous/lieux`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Lieux
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">En attente</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {appointments.filter(a => a.status === "PENDING").length}
                  </p>
                </div>
                <div className="bg-amber-100 p-2 rounded-lg">
                  <ClockIconOutline className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Demandes à traiter
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Acceptés</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {appointments.filter(a => a.status === "ACCEPTED").length}
                  </p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Rendez-vous confirmés
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Refusés</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {appointments.filter(a => a.status === "DECLINED").length}
                  </p>
                </div>
                <div className="bg-rose-100 p-2 rounded-lg">
                  <XCircleIcon className="h-5 w-5 text-rose-500" />
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  Demandes refusées
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Terminés</h3>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {appointments.filter(a => a.status === "COMPLETED").length}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Rendez-vous passés
                </span>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des rendez-vous</CardTitle>
              <CardDescription>
                Consultez et gérez toutes les demandes de rendez-vous
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

              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="received">Reçus</TabsTrigger>
                  <TabsTrigger value="sent">Envoyés</TabsTrigger>
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
                            const isIncoming = appointment.recipientId === currentUserId;
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
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              Aucun rendez-vous trouvé
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
      </div>

      {/* Dialog de détails du rendez-vous */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>Détails du rendez-vous</DialogTitle>
                <DialogDescription>
                  {selectedAppointment.recipientId === currentUserId 
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

                  {selectedAppointment.status === "PENDING" && selectedAppointment.recipientId === currentUserId && (
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
    </div>
  );
} 