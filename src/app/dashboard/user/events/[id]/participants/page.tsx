"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  UserPlusIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import AppointmentRequestForm from "@/components/appointments/AppointmentRequestForm";
import Link from "next/link";
import { toast } from "react-hot-toast";

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Type d'inscription
type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle?: string;
  company?: string;
  type: 'PARTICIPANT' | 'EXHIBITOR' | 'SPEAKER';
  registrationDate: Date;
  checkedIn: boolean;
  checkinTime?: Date | null;
  checkedInAt?: string;
};

// Type d'événement
type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  location: string;
  banner?: string;
  slug?: string;
};

export default function UserEventParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [currentUserRegistrationId, setCurrentUserRegistrationId] = useState<string | null>(null);
  const [isContactAdded, setIsContactAdded] = useState(false);
  
  const participantsPerPage = 25;
  
  // Utiliser le hook useEffect pour extraire l'ID de manière asynchrone
  const [eventId, setEventId] = useState<string>("");
  
  // Extraire l'ID de params au chargement
  useEffect(() => {
    const extractParams = async () => {
      const { id } = await params;
      setEventId(id);
    };
    
    extractParams();
  }, [params]);

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
  
  // Helper pour créer des options de fetch standard
  const createFetchOptions = (method = 'GET') => {
    return {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Fetch-Time': new Date().getTime().toString()
      },
      cache: 'no-store' as RequestCache,
    };
  };

  // Nouvelle fonction pour récupérer l'ID de registration de l'utilisateur courant
  const fetchCurrentUserRegistration = async () => {
    if (!eventId) return;
    
    try {
      const response = await fetch('/api/auth/session');
      const sessionData = await response.json();
      
      if (!sessionData?.user?.email) {
        console.error('Aucune session utilisateur trouvée');
        return;
      }

      // Récupérer l'enregistrement de l'utilisateur pour cet événement
      const registrationResponse = await fetch(
        `/api/events/${eventId}/registrations?userEmail=${sessionData.user.email}`,
        createFetchOptions()
      );

      if (registrationResponse.ok) {
        const data = await registrationResponse.json();
        if (data.registration) {
          setCurrentUserRegistrationId(data.registration.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID de registration:', error);
    }
  };
  
  // Fonction de récupération des participants
  const fetchParticipants = async () => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}/registrations`, createFetchOptions());
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des participants");
      }
      
      const data = await response.json();
      
      if (!data || !data.registrations || !Array.isArray(data.registrations)) {
        console.error("Format de données invalide:", data);
        toast.error("Format de données invalide");
        setParticipants([]);
        return;
      }
      
      const formattedParticipants = data.registrations.map((reg: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        jobTitle?: string;
        company?: string;
        type: string;
        createdAt: string;
        checkedIn: boolean;
        checkinTime?: string;
        checkedInAt?: string;
      }) => ({
        id: reg.id,
        firstName: reg.firstName || '',
        lastName: reg.lastName || '',
        email: reg.email || '',
        phone: reg.phone || '',
        jobTitle: reg.jobTitle || '',
        company: reg.company || '',
        type: reg.type || 'PARTICIPANT',
        registrationDate: new Date(reg.createdAt),
        checkedIn: reg.checkedIn || false,
        checkinTime: reg.checkinTime ? new Date(reg.checkinTime) : null,
        checkedInAt: reg.checkedInAt || null,
      }));
      
      setParticipants(formattedParticipants);
      setError('');
    } catch (error) {
      console.error("Erreur lors de la récupération des participants:", error);
      setError("Impossible de charger la liste des participants");
      toast.error("Erreur lors du chargement des participants");
    }
  };
  
  // Fonction de récupération des détails de l'événement
  const fetchEventDetails = async () => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}`, createFetchOptions());
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'événement");
      }
      
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'événement:", error);
      setError("Impossible de charger les détails de l'événement");
    }
  };
  
  // Chargement initial des données
  useEffect(() => {
    if (eventId) {
      setLoading(true);
      Promise.all([
        fetchEventDetails(), 
        fetchParticipants(),
        fetchCurrentUserRegistration()
      ]).finally(() => setLoading(false));
    }
  }, [eventId]);

  // Filtrage des participants
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = 
      participant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (participant.company && participant.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (participant.jobTitle && participant.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredParticipants.length / participantsPerPage);
  const startIndex = (currentPage - 1) * participantsPerPage;
  const paginatedParticipants = filteredParticipants.slice(startIndex, startIndex + participantsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const openSidebar = (participant: Participant) => {
    setSelectedParticipant(participant);
    setModalOpen(true);
  };

  const getParticipantInitials = (participant: Participant) => {
    return `${participant.firstName.charAt(0)}${participant.lastName.charAt(0)}`;
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'SPEAKER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'EXHIBITOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PARTICIPANT':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SPEAKER':
        return 'Intervenant';
      case 'EXHIBITOR':
        return 'Exposant';
      case 'PARTICIPANT':
      default:
        return 'Participant';
    }
  };

  // Fonction de gestion du bouton "Prendre RV"
  const handleAppointmentRequest = () => {
    if (!currentUserRegistrationId) {
      toast.error('Impossible de créer une demande de rendez-vous. Veuillez vous reconnecter.');
      return;
    }
    setModalOpen(false);
    setAppointmentFormOpen(true);
  };

  return (
    <div className="dashboard-container min-h-screen overflow-hidden">
      <UserEventSidebar 
        eventId={eventId}
        activeTab="participants"
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
                  Participants • {event?.name || "Chargement..."}
                </h1>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="p-6">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* En-tête du tableau */}
                <div className="p-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Participants ({filteredParticipants.length})
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Liste des participants inscrits à cet événement
                    </p>
                  </div>
                </div>

                {/* Barre de recherche */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Rechercher un participant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tableau */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedParticipants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8">
                            <div className="flex flex-col items-center space-y-3">
                              <UserIcon className="h-12 w-12 text-gray-400" />
                              <p className="text-gray-500">Aucun participant trouvé</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedParticipants.map((participant) => (
                          <TableRow 
                            key={participant.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => openSidebar(participant)}
                          >
                            <TableCell>
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[#81B441]/10 text-[#81B441] font-medium">
                                  {getParticipantInitials(participant)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">
                                  {participant.firstName} {participant.lastName}
                                </div>
                                {participant.jobTitle && (
                                  <div className="text-sm text-gray-600">
                                    {participant.jobTitle}
                                  </div>
                                )}
                                {participant.company && (
                                  <div className="text-sm text-gray-600">
                                    {participant.company}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSidebar(participant);
                                }}
                                className="border-[#81B441] text-[#81B441] hover:bg-[#81B441] hover:text-white"
                              >
                                Se connecter
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Affichage de {startIndex + 1} à {Math.min(startIndex + participantsPerPage, filteredParticipants.length)} sur {filteredParticipants.length} participants
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Précédent
                        </Button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className={currentPage === pageNumber ? "bg-[#81B441] hover:bg-[#81B441]/90" : ""}
                          >
                            {pageNumber}
                          </Button>
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de détail du participant */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedParticipant && (
            <div className="space-y-6">
              {/* Avatar et informations principales */}
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarFallback className="bg-[#81B441]/10 text-[#81B441] font-medium text-xl">
                    {getParticipantInitials(selectedParticipant)}
                  </AvatarFallback>
                </Avatar>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedParticipant.firstName} {selectedParticipant.lastName}
                </h4>
                
                {/* Informations professionnelles */}
                <div className="space-y-1 text-sm text-gray-600">
                  {selectedParticipant.jobTitle && (
                    <div className="flex items-center justify-center space-x-2">
                      <BriefcaseIcon className="h-4 w-4" />
                      <span>{selectedParticipant.jobTitle}</span>
                    </div>
                  )}
                  {selectedParticipant.company && (
                    <div className="flex items-center justify-center space-x-2">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>{selectedParticipant.company}</span>
                    </div>
                  )}
                </div>

                {/* Badge du type */}
                <Badge className={cn("mt-3", getTypeBadgeColor(selectedParticipant.type))}>
                  {getTypeLabel(selectedParticipant.type)}
                </Badge>
              </div>

              {/* Actions CTA */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-[#81B441] text-[#81B441] hover:bg-[#81B441] hover:text-white"
                  onClick={() => {
                    toast.success(`Discussion initiée avec ${selectedParticipant.firstName} ${selectedParticipant.lastName}`);
                    setModalOpen(false);
                  }}
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  Discuter
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1 border-[#81B441] text-[#81B441] hover:bg-[#81B441] hover:text-white"
                  onClick={handleAppointmentRequest}
                >
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  Prendre RV
                </Button>

                {/* Bouton de contact */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isContactAdded) {
                      toast.success("Contact retiré");
                      setIsContactAdded(false);
                    } else {
                      toast.success(`${selectedParticipant.firstName} ${selectedParticipant.lastName} ajouté aux contacts`);
                      setIsContactAdded(true);
                    }
                  }}
                  className={cn(
                    "p-2 rounded-full",
                    isContactAdded 
                      ? "text-gray-600 hover:text-gray-800 hover:bg-gray-100" 
                      : "text-[#81B441] hover:text-[#81B441]/80 hover:bg-[#81B441]/10"
                  )}
                >
                  {isContactAdded ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <UserPlusIcon className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Formulaire de demande de rendez-vous */}
      {selectedParticipant && event && currentUserRegistrationId && (
        <AppointmentRequestForm
          isOpen={appointmentFormOpen}
          onClose={() => setAppointmentFormOpen(false)}
          recipient={selectedParticipant}
          event={event}
          currentUserRegistrationId={currentUserRegistrationId}
          onSuccess={() => {
            toast.success('Votre demande a été envoyée ! Consultez vos rendez-vous pour suivre le statut.');
          }}
        />
      )}
    </div>
  );
} 