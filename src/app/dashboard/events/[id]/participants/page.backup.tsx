"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  UserPlusIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckBadgeIcon,
  QrCodeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  ArrowUpTrayIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import ParticipantBadge from "@/components/events/ParticipantBadge";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Types
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
  shortCode?: string;
  qrCode?: string;
};

type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  location: string;
  banner?: string;
  slug?: string;
};

type Ticket = {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity?: number;
  sold: number;
  status: string;
  visibility: string;
}; 

export default function EventParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [processing, setProcessing] = useState<{[key: string]: boolean}>({});
  const [participantType, setParticipantType] = useState('all');
  const [checkinStatus, setCheckinStatus] = useState('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [participantToEdit, setParticipantToEdit] = useState<Participant | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeParticipant, setBadgeParticipant] = useState<Participant | null>(null);

  const [newParticipant, setNewParticipant] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    company: '',
    type: 'PARTICIPANT' as 'PARTICIPANT' | 'SPEAKER',
    ticketId: ''
  });

  const participantsPerPage = 10;

  // Extraction des paramètres
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);
    };
    extractParams();
  }, [params]);

  // Fonctions utilitaires pour les appels API
  const createFetchOptions = (method = 'GET', body?: Record<string, unknown>) => {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    return options;
  };

  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || response.status < 500) {
          return response;
        }
      } catch (error) {
        if (i === maxRetries - 1) throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
    throw new Error('Max retries reached');
  };

  // Récupérer les participants
  const fetchParticipants = async () => {
    if (!eventId) return;
    
    setLoading(true);
    
    try {
      const response = await fetchWithRetry(
        `/api/events/${eventId}/registrations`,
        createFetchOptions()
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des participants');
      }
      
      const data = await response.json();
      
      const formattedParticipants = data.registrations.map((reg: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        jobTitle?: string;
        company?: string;
        type?: string;
        createdAt: string;
        checkedIn?: boolean;
        checkedInAt?: string;
        shortCode?: string;
        qrCode?: string;
      }) => ({
        id: reg.id,
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        phone: reg.phone || '',
        jobTitle: reg.jobTitle,
        company: reg.company,
        type: reg.type || 'PARTICIPANT',
        registrationDate: new Date(reg.createdAt),
        checkedIn: reg.checkedIn || false,
        checkinTime: reg.checkedInAt ? new Date(reg.checkedInAt) : null,
        checkedInAt: reg.checkedInAt,
        shortCode: reg.shortCode,
        qrCode: reg.qrCode || reg.shortCode || reg.id.substring(0, 9)
      }));
      
      setParticipants(formattedParticipants);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des participants');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les détails de l'événement
  const fetchEventDetails = async () => {
    if (!eventId) return;
    
    try {
      const response = await fetchWithRetry(
        `/api/events/${eventId}`,
        createFetchOptions()
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'événement');
      }
      
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement de l\'événement');
    }
  };

  // Récupérer les billets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch(`/api/public/events/${eventId}/tickets`);
      if (response.ok) {
        const data = await response.json();
        const availableTickets = (data.tickets || []).filter(
          (ticket: Ticket) => ticket.status === 'ACTIVE' && ticket.visibility === 'VISIBLE'
        );
        setTickets(availableTickets);
        
        if (availableTickets.length > 0) {
          setNewParticipant(prev => ({
            ...prev,
            ticketId: availableTickets[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des billets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    if (eventId) {
      fetchParticipants();
      fetchEventDetails();
      fetchTickets();
    }
  }, [eventId]);

  // Filtrer les participants
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = searchTerm === '' || 
      `${participant.firstName} ${participant.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (participant.company && participant.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = participantType === 'all' || participant.type === participantType;
    const matchesCheckin = checkinStatus === 'all' || 
      (checkinStatus === 'checked' && participant.checkedIn) ||
      (checkinStatus === 'unchecked' && !participant.checkedIn);
    
    return matchesSearch && matchesType && matchesCheckin;
  });

  // Pagination
  const indexOfLastParticipant = currentPage * participantsPerPage;
  const indexOfFirstParticipant = indexOfLastParticipant - participantsPerPage;
  const currentParticipants = filteredParticipants.slice(indexOfFirstParticipant, indexOfLastParticipant);
  const totalPages = Math.ceil(filteredParticipants.length / participantsPerPage);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewParticipant(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetchWithRetry(
        `/api/events/${eventId}/registrations`,
        createFetchOptions('POST', newParticipant)
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'ajout');
      }
      
      toast.success('Participant ajouté avec succès');
      setShowAddModal(false);
      setNewParticipant({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        company: '',
        type: 'PARTICIPANT',
        ticketId: tickets.length > 0 ? tickets[0].id : ''
      });
      fetchParticipants();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du participant';
      toast.error(errorMessage);
    }
  };

  const handleUpdateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!participantToEdit) return;
    
    try {
      const response = await fetchWithRetry(
        `/api/events/${eventId}/registrations/${participantToEdit.id}`,
        createFetchOptions('PUT', {
          firstName: newParticipant.firstName,
          lastName: newParticipant.lastName,
          email: newParticipant.email,
          phone: newParticipant.phone,
          jobTitle: newParticipant.jobTitle,
          company: newParticipant.company,
          type: newParticipant.type,
        })
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }
      
      toast.success('Participant mis à jour avec succès');
      setShowEditModal(false);
      setParticipantToEdit(null);
      fetchParticipants();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
    }
  };

  const handleDeleteParticipant = async () => {
    if (!participantToDelete) return;
    
    try {
      const response = await fetchWithRetry(
        `/api/events/${eventId}/registrations/${participantToDelete.id}`,
        createFetchOptions('DELETE')
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }
      
      toast.success('Participant supprimé avec succès');
      setDeleteConfirmOpen(false);
      setParticipantToDelete(null);
      fetchParticipants();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      toast.error(errorMessage);
    }
  };

  const handleCheckIn = async (participantId: string) => {
    try {
      setProcessing({ ...processing, [participantId]: true });
      
      const response = await fetchWithRetry(
        `/api/events/${eventId}/registrations/${participantId}/checkin`,
        createFetchOptions('POST')
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
      }
      
      toast.success('Participant enregistré avec succès');
      fetchParticipants();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setProcessing({ ...processing, [participantId]: false });
    }
  };

  const openParticipantDetails = (participant: Participant) => {
    setSelectedParticipant(participant);
    setActiveTab("details");
    setShowParticipantModal(true);
  };

  const openBadgeModal = (participant: Participant) => {
    setBadgeParticipant(participant);
    setShowBadgeModal(true);
  };

  const exportParticipants = () => {
    const csvData = participants.map(participant => ({
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      phone: participant.phone,
      jobTitle: participant.jobTitle || '',
      company: participant.company || '',
      type: participant.type,
      checkedIn: participant.checkedIn ? 'Oui' : 'Non',
      registrationDate: format(participant.registrationDate, "dd/MM/yyyy", { locale: fr }),
      checkinTime: participant.checkinTime ? format(participant.checkinTime, "dd/MM/yyyy HH:mm", { locale: fr }) : ''
    }));

    const headers = [
      'Prénom', 'Nom', 'Email', 'Téléphone', 'Fonction', 'Entreprise', 'Type', 
      'Enregistré', 'Date d\'inscription', 'Heure d\'enregistrement'
    ];

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `participants_${event?.name || 'evenement'}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,firstName,lastName,email,phone,jobTitle,company,type\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_participants.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // État de chargement
  if (loading) {
    return (
      <div className="dashboard-container">
        <EventSidebar eventId={eventId} />
        <div className="dashboard-content">
          <main className="dashboard-main">
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#81B441] border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Chargement des données...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="participants-container bg-[#f9fafb] min-h-screen">
      <EventSidebar eventId={eventId} activeTab="participants" onExpandChange={setSidebarExpanded} />
      
      <div className={`transition-all duration-300 ease-in-out ${sidebarExpanded ? "md:ml-64" : "ml-0"} p-4 md:p-6`}>
        {/* En-tête de la page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
              Participants {event?.name && <span className="text-[#81B441]">• {event.name}</span>}
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-600 hover:text-[#81B441] hover:border-[#81B441]"
              onClick={downloadCsvTemplate}
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Modèle CSV
            </Button>
            
            <Button
              variant="outline"
              className="border-gray-300 text-gray-600 hover:text-[#81B441] hover:border-[#81B441]"
              onClick={exportParticipants}
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#81B441] hover:bg-[#72a339]"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Ajouter un participant
            </Button>
          </div>
        </div>
        
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total des participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{participants.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {participants.filter(p => p.checkedIn).length}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({participants.length > 0 ? `${Math.round((participants.filter(p => p.checkedIn).length / participants.length) * 100)}%` : '0%'})
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Intervenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {participants.filter(p => p.type === 'SPEAKER').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Exposants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {participants.filter(p => p.type === 'EXHIBITOR').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher par nom, email ou entreprise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={participantType}
                  onChange={(e) => setParticipantType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#81B441]"
                >
                  <option value="all">Tous les types</option>
                  <option value="PARTICIPANT">Participants</option>
                  <option value="SPEAKER">Intervenants</option>
                  <option value="EXHIBITOR">Exposants</option>
                </select>
                
                <select
                  value={checkinStatus}
                  onChange={(e) => setCheckinStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#81B441]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="checked">Enregistrés</option>
                  <option value="unchecked">Non enregistrés</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des participants */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Badge</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentParticipants.map((participant) => (
                  <TableRow 
                    key={participant.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openParticipantDetails(participant)}
                  >
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="p-1 h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openBadgeModal(participant);
                        }}
                      >
                        <QrCodeIcon className="h-4 w-4 text-[#81B441]" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-[#81B441]">
                          <AvatarFallback className="bg-white text-black border-[#81B441]">
                            {participant.firstName.charAt(0)}{participant.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.firstName} {participant.lastName}</p>
                          {participant.jobTitle && (
                            <p className="text-sm text-gray-500">{participant.jobTitle}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{participant.email}</p>
                        <p className="text-gray-500">{participant.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{participant.company || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        className="bg-[#EAF9D7] text-gray-800 hover:bg-[#EAF9D7] border-[#EAF9D7]"
                        variant="outline"
                      >
                        {participant.type === 'PARTICIPANT' ? 'Participant' : 
                         participant.type === 'SPEAKER' ? 'Intervenant' : 'Exposant'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {participant.checkedIn ? (
                        <Badge className="bg-[#EAF9D7] text-gray-800 hover:bg-[#EAF9D7] border-[#EAF9D7]">
                          <CheckBadgeIcon className="h-3 w-3 mr-1" />
                          Enregistré
                        </Badge>
                      ) : (
                        <Badge className="bg-[#EAF9D7] text-gray-800 hover:bg-[#EAF9D7] border-[#EAF9D7]" variant="outline">
                          Non enregistré
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            openParticipantDetails(participant);
                          }}>
                            <UserIcon className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          {!participant.checkedIn && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(participant.id);
                            }}>
                              <CheckBadgeIcon className="h-4 w-4 mr-2" />
                              Enregistrer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setParticipantToEdit(participant);
                            setNewParticipant({
                              firstName: participant.firstName,
                              lastName: participant.lastName,
                              email: participant.email,
                              phone: participant.phone,
                              jobTitle: participant.jobTitle || '',
                              company: participant.company || '',
                              type: participant.type as 'PARTICIPANT' | 'SPEAKER',
                              ticketId: ''
                            });
                            setShowEditModal(true);
                          }}>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setParticipantToDelete(participant);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-700">
                  Affichage de {indexOfFirstParticipant + 1} à {Math.min(indexOfLastParticipant, filteredParticipants.length)} sur {filteredParticipants.length} résultats
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={currentPage === pageNumber ? 'bg-[#81B441] hover:bg-[#72a339]' : ''}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal des détails du participant avec onglets */}
      <Dialog open={showParticipantModal} onOpenChange={setShowParticipantModal}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Détails du participant</DialogTitle>
          </DialogHeader>
          
          {selectedParticipant && (
            <div className="mt-4">
              {/* En-tête avec avatar et infos principales */}
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-[#81B441] text-white text-xl">
                    {selectedParticipant.firstName.charAt(0)}{selectedParticipant.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedParticipant.firstName} {selectedParticipant.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedParticipant.email}</p>
                  {selectedParticipant.jobTitle && (
                    <p className="text-sm text-gray-500">{selectedParticipant.jobTitle}</p>
                  )}
                  {selectedParticipant.company && (
                    <p className="text-sm text-gray-500">{selectedParticipant.company}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge 
                      className="bg-[#EAF9D7] text-gray-800 hover:bg-[#EAF9D7] border-[#EAF9D7]"
                      variant="outline"
                    >
                      {selectedParticipant.type === 'PARTICIPANT' ? 'Participant' : 
                       selectedParticipant.type === 'SPEAKER' ? 'Intervenant' : 'Exposant'}
                    </Badge>
                    {selectedParticipant.checkedIn && (
                      <Badge className="bg-[#EAF9D7] text-gray-800 hover:bg-[#EAF9D7] border-[#EAF9D7]">
                        <CheckBadgeIcon className="h-3 w-3 mr-1" />
                        Enregistré
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Onglets */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="badge">Badge</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="appointments">RDV</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[400px] pr-4">
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Téléphone</h4>
                        <p className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-[#81B441]" />
                          {selectedParticipant.phone || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                        <p className="flex items-center gap-2">
                          <EnvelopeIcon className="h-4 w-4 text-[#81B441]" />
                          {selectedParticipant.email}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Entreprise</h4>
                        <p className="flex items-center gap-2">
                          <BuildingOfficeIcon className="h-4 w-4 text-[#81B441]" />
                          {selectedParticipant.company || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Fonction</h4>
                        <p className="flex items-center gap-2">
                          <BriefcaseIcon className="h-4 w-4 text-[#81B441]" />
                          {selectedParticipant.jobTitle || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Date d&apos;inscription</h4>
                        <p className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-[#81B441]" />
                          {format(selectedParticipant.registrationDate, "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Code QR</h4>
                        <p className="flex items-center gap-2">
                          <QrCodeIcon className="h-4 w-4 text-[#81B441]" />
                          {selectedParticipant.shortCode || selectedParticipant.qrCode || 'Non défini'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      {!selectedParticipant.checkedIn && (
                        <Button 
                          onClick={() => handleCheckIn(selectedParticipant.id)}
                          className="bg-[#81B441] hover:bg-[#72a339]"
                        >
                          <CheckBadgeIcon className="h-4 w-4 mr-2" />
                          Enregistrer
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setParticipantToEdit(selectedParticipant);
                          setNewParticipant({
                            firstName: selectedParticipant.firstName,
                            lastName: selectedParticipant.lastName,
                            email: selectedParticipant.email,
                            phone: selectedParticipant.phone,
                            jobTitle: selectedParticipant.jobTitle || '',
                            company: selectedParticipant.company || '',
                            type: selectedParticipant.type as 'PARTICIPANT' | 'SPEAKER',
                            ticketId: ''
                          });
                          setShowEditModal(true);
                          setShowParticipantModal(false);
                        }}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setParticipantToDelete(selectedParticipant);
                          setDeleteConfirmOpen(true);
                          setShowParticipantModal(false);
                        }}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="badge">
                    <div className="space-y-4">
                      <ParticipantBadge
                        firstName={selectedParticipant.firstName}
                        lastName={selectedParticipant.lastName}
                        jobTitle={selectedParticipant.jobTitle}
                        company={selectedParticipant.company}
                        qrCode={selectedParticipant.qrCode}
                        eventName={event?.name || 'Événement'}
                        eventBanner={event?.banner}
                      />
                      
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline">
                          <ShareIcon className="h-4 w-4 mr-2" />
                          Partager
                        </Button>
                        <Button variant="outline">
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sessions">
                    <div className="space-y-4">
                      <p className="text-center text-gray-500 py-8">
                        <CalendarDaysIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        Aucune session pour ce participant
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="appointments">
                    <div className="space-y-4">
                      <p className="text-center text-gray-500 py-8">
                        <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        Aucun rendez-vous programmé
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline">
                    <div className="space-y-4">
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200"></div>
                        
                        <div className="relative -ml-1.5">
                          <div className="absolute top-2 left-0 w-3 h-3 bg-[#81B441] rounded-full"></div>
                          <div className="ml-6">
                            <p className="text-sm font-medium">Inscription</p>
                            <p className="text-xs text-gray-500">
                              {format(selectedParticipant.registrationDate, "dd MMMM yyyy à HH:mm", { locale: fr })}
                            </p>
                          </div>
                        </div>
                        
                        {selectedParticipant.checkedIn && selectedParticipant.checkinTime && (
                          <div className="relative -ml-1.5 mt-6">
                            <div className="absolute top-2 left-0 w-3 h-3 bg-green-500 rounded-full"></div>
                            <div className="ml-6">
                              <p className="text-sm font-medium">Check-in effectué</p>
                              <p className="text-xs text-gray-500">
                                {format(selectedParticipant.checkinTime, "dd MMMM yyyy à HH:mm", { locale: fr })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout de participant */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un participant</DialogTitle>
            <DialogDescription>
              Créez un nouveau participant pour cet événement.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddParticipant}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="text-sm font-medium">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    value={newParticipant.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    value={newParticipant.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={newParticipant.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="text-sm font-medium">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  name="phone"
                  required
                  value={newParticipant.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="jobTitle" className="text-sm font-medium">
                    Fonction
                  </label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={newParticipant.jobTitle}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="text-sm font-medium">
                    Entreprise
                  </label>
                  <Input
                    id="company"
                    name="company"
                    value={newParticipant.company}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="type" className="text-sm font-medium">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={newParticipant.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#81B441]"
                >
                  <option value="PARTICIPANT">Participant</option>
                  <option value="SPEAKER">Intervenant</option>
                </select>
              </div>

              {loadingTickets ? (
                <div className="text-center py-2">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#81B441] border-t-transparent"></div>
                  <span className="ml-2 text-sm">Chargement des billets...</span>
                </div>
              ) : tickets.length > 0 && (
                <div>
                  <label htmlFor="ticketId" className="text-sm font-medium">
                    Billet <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="ticketId"
                    name="ticketId"
                    required
                    value={newParticipant.ticketId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#81B441]"
                  >
                    {tickets.map((ticket) => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.name} - {ticket.price > 0 ? `${ticket.price} ${ticket.currency}` : 'Gratuit'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-[#81B441] hover:bg-[#72a339]">
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de modification */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le participant</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdateParticipant}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-firstName" className="text-sm font-medium">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    required
                    value={newParticipant.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-lastName" className="text-sm font-medium">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    required
                    value={newParticipant.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="edit-email" className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  required
                  value={newParticipant.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="edit-phone" className="text-sm font-medium">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-phone"
                  name="phone"
                  required
                  value={newParticipant.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-jobTitle" className="text-sm font-medium">
                    Fonction
                  </label>
                  <Input
                    id="edit-jobTitle"
                    name="jobTitle"
                    value={newParticipant.jobTitle}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-company" className="text-sm font-medium">
                    Entreprise
                  </label>
                  <Input
                    id="edit-company"
                    name="company"
                    value={newParticipant.company}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="edit-type" className="text-sm font-medium">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-type"
                  name="type"
                  required
                  value={newParticipant.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#81B441]"
                >
                  <option value="PARTICIPANT">Participant</option>
                  <option value="SPEAKER">Intervenant</option>
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-[#81B441] hover:bg-[#72a339]">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmer la suppression</DialogTitle>
            <DialogDescription>
              {participantToDelete && (
                <p>
                  Êtes-vous sûr de vouloir supprimer définitivement le participant{' '}
                  <strong>
                    {participantToDelete.firstName} {participantToDelete.lastName}
                  </strong>{' '}
                  ?
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteParticipant}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour afficher le badge */}
      <Dialog open={showBadgeModal} onOpenChange={setShowBadgeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Badge du participant</DialogTitle>
          </DialogHeader>
          
          {badgeParticipant && (
            <div className="space-y-4">
              <ParticipantBadge
                firstName={badgeParticipant.firstName}
                lastName={badgeParticipant.lastName}
                jobTitle={badgeParticipant.jobTitle}
                company={badgeParticipant.company}
                qrCode={badgeParticipant.qrCode}
                eventName={event?.name || 'Événement'}
                eventBanner={event?.banner}
              />
              
              <div className="flex gap-2 justify-center">
                <Button variant="outline">
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Partager
                </Button>
                <Button variant="outline">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 