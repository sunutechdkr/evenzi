"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeftIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Importer les composants Shadcn UI
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SponsorLogo } from "@/components/ui/sponsor-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Helper function to ensure URL has proper protocol
const ensureProtocol = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

// Types pour les sponsors
type SponsorLevel = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTNER' | 'MEDIA' | 'OTHER';

type Sponsor = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  level: SponsorLevel;
  visible: boolean;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
  stats?: {
    members: number;
    sessions: number;
    documents: number;
    appointments: number;
    products: number;
  };
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

export default function UserEventSponsorsPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<Event | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [sponsorMembers, setSponsorMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);

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
      fetchSponsors();
    }
  }, [eventId]);

  // Charger les membres quand l'onglet Membres est sélectionné
  useEffect(() => {
    if (selectedSponsor && activeTab === 'members') {
      fetchSponsorMembers(selectedSponsor.id);
    }
  }, [selectedSponsor, activeTab]);

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
   * Récupère la liste des sponsors (API publique)
   */
  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/public/events/${eventId}/sponsors`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des sponsors');
      
      const data = await response.json();
      const formattedSponsors = data.map((sponsor: {
        id: string;
        name: string;
        description?: string;
        logo?: string;
        website?: string;
        level: SponsorLevel;
        visible: boolean;
        eventId: string;
        createdAt: string;
        updatedAt: string;
        stats?: {
          members: number;
          sessions: number;
          documents: number;
          appointments: number;
          products: number;
        };
      }) => ({
        ...sponsor,
        createdAt: new Date(sponsor.createdAt),
        updatedAt: new Date(sponsor.updatedAt)
      }));
      setSponsors(formattedSponsors);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les sponsors');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupère les membres d'un sponsor
   */
  const fetchSponsorMembers = async (sponsorId: string) => {
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/public/events/${eventId}/sponsors/${sponsorId}/members`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des membres');
      
      const data = await response.json();
      setSponsorMembers(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les membres');
      setSponsorMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  /**
   * Affiche le profil d'un membre
   */
  const viewMemberProfile = (member: any) => {
    setSelectedMember(member);
    setShowMemberProfile(true);
  };

  /**
   * Retourne la classe CSS pour le badge de niveau
   */
  const getLevelBadgeClass = (level: SponsorLevel) => {
    switch(level) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'SILVER': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'BRONZE': return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'PARTNER': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'MEDIA': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'OTHER': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };
  
  /**
   * Retourne le texte pour chaque niveau
   */
  const getLevelText = (level: SponsorLevel) => {
    switch(level) {
      case 'PLATINUM': return 'Platinum';
      case 'GOLD': return 'Gold';
      case 'SILVER': return 'Silver';
      case 'BRONZE': return 'Bronze';
      case 'PARTNER': return 'Partenaire';
      case 'MEDIA': return 'Media';
      case 'OTHER': return 'Autre';
      default: return level;
    }
  };
  
  // Filtrer les sponsors en fonction de la recherche et du filtre de niveau
  const filteredSponsors = sponsors.filter(sponsor => 
    sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (levelFilter ? sponsor.level === levelFilter : true) &&
    sponsor.visible // Seulement les sponsors visibles pour les participants
  );

  const openSponsorDetails = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setActiveTab("details");
    setShowSponsorModal(true);
  };

  // État de chargement
  if (loading) {
    return (
      <div className="dashboard-container min-h-screen overflow-hidden">
        <UserEventSidebar 
          eventId={eventId}
          activeTab="sponsors"
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
              <p className="mt-4 text-gray-600">Chargement des sponsors...</p>
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
        activeTab="sponsors"
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
                  Sponsors et Partenaires • {event?.name || "Chargement..."}
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
                  <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher un sponsor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                
                {/* Filtre par niveau */}
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent"
                >
                  <option value="">Tous les niveaux</option>
                  <option value="PLATINUM">Platinum</option>
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                  <option value="BRONZE">Bronze</option>
                  <option value="PARTNER">Partenaire</option>
                  <option value="MEDIA">Media</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
            </div>

            {/* Grille des sponsors */}
            {filteredSponsors.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {filteredSponsors.map((sponsor) => (
                  <Card 
                    key={sponsor.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => openSponsorDetails(sponsor)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        {/* Logo */}
                        <div className="w-16 h-16">
                          <SponsorLogo 
                            src={sponsor.logo} 
                            alt={sponsor.name}
                            size="md"
                            className="w-full h-full"
                          />
                        </div>
                        
                        {/* Nom du sponsor */}
                        <div className="space-y-1">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {sponsor.name}
                          </h3>
                          
                          {/* Badge de niveau */}
                          <Badge className={`text-xs ${getLevelBadgeClass(sponsor.level)}`}>
                            {getLevelText(sponsor.level)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun sponsor</h3>
                <p className="text-sm text-gray-500">
                  {sponsors.length > 0 
                    ? "Aucun sponsor ne correspond à votre recherche."
                    : "Aucun sponsor n'a encore été ajouté à cet événement."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal des détails du sponsor */}
      <Dialog open={showSponsorModal} onOpenChange={setShowSponsorModal}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          {selectedSponsor && (
            <div className="flex flex-col h-full">
              {/* En-tête fixe */}
              <div className="flex-shrink-0 pb-4 border-b">
                <div className="flex items-start gap-4">
                  <SponsorLogo 
                    src={selectedSponsor.logo} 
                    alt={selectedSponsor.name}
                    size="lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{selectedSponsor.name}</h2>
                    <div className="flex gap-2 mt-2">
                      <Badge className={`text-xs ${getLevelBadgeClass(selectedSponsor.level)}`}>
                        {getLevelText(selectedSponsor.level)}
                      </Badge>
                      {selectedSponsor.visible ? (
                        <Badge className="bg-[#EAF9D7] text-gray-800 hover:bg-[#EAF9D7] border-[#EAF9D7]">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Visible
                        </Badge>
                      ) : (
                        <Badge className="bg-[#EAF9D7] text-gray-800 hover:bg-[#EAF9D7] border-[#EAF9D7]" variant="outline">
                          <EyeSlashIcon className="h-3 w-3 mr-1" />
                          Masqué
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu avec onglets */}
              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Informations</TabsTrigger>
                    <TabsTrigger value="members">Membres</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="flex-1 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="space-y-6 p-6">
                        {/* Description */}
                        {selectedSponsor.description && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-700 leading-relaxed">
                              {selectedSponsor.description}
                            </p>
                          </div>
                        )}

                        {/* Site web */}
                        {selectedSponsor.website && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Site web</h3>
                            <a 
                              href={ensureProtocol(selectedSponsor.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-[#81B441] hover:text-[#72a139] underline"
                            >
                              <GlobeAltIcon className="h-4 w-4 mr-2" />
                              {selectedSponsor.website}
                            </a>
                          </div>
                        )}

                        {/* Statistiques */}
                        {selectedSponsor.stats && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">Membres</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                  {selectedSponsor.stats.members}
                                </p>
                              </div>
                              
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">Sessions</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                  {selectedSponsor.stats.sessions}
                                </p>
                              </div>
                              
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">RDV</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                  {selectedSponsor.stats.appointments}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Informations de base */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Ajouté le</span>
                              <span className="text-gray-900">
                                {format(selectedSponsor.createdAt, "dd MMM yyyy", { locale: fr })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dernière mise à jour</span>
                              <span className="text-gray-900">
                                {format(selectedSponsor.updatedAt, "dd MMM yyyy", { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="members" className="flex-1 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Membres de l&apos;organisation ({sponsorMembers.length})
                        </h3>
                        
                        {loadingMembers ? (
                          <div className="text-center py-8">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#81B441] border-r-transparent"></div>
                            <p className="mt-4 text-sm text-gray-500">Chargement des membres...</p>
                          </div>
                        ) : sponsorMembers.length > 0 ? (
                          <div className="space-y-3">
                            {sponsorMembers.map((member) => (
                              <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                {/* Avatar */}
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-[#81B441] text-white font-semibold">
                                    {member.firstName?.[0]?.toUpperCase()}{member.lastName?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                
                                {/* Informations */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-sm">
                                    {member.firstName} {member.lastName}
                                  </h4>
                                  <div className="text-sm text-gray-600">
                                    {member.jobTitle && member.company ? (
                                      <span>{member.jobTitle} • {member.company}</span>
                                    ) : member.jobTitle ? (
                                      <span>{member.jobTitle}</span>
                                    ) : member.company ? (
                                      <span>{member.company}</span>
                                    ) : (
                                      <span className="text-gray-400">Aucune information</span>
                                    )}
                                  </div>
                                  {member.email && (
                                    <div className="text-xs text-gray-500 truncate">
                                      {member.email}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Actions */}
                                <div className="flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => viewMemberProfile(member)}
                                    className="text-[#81B441] border-[#81B441] hover:bg-[#81B441] hover:text-white"
                                  >
                                    <UserIcon className="h-4 w-4 mr-1" />
                                    Voir profil
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                              <UserIcon className="h-16 w-16 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre</h3>
                            <p className="text-gray-500">
                              Aucun participant n&apos;est associé à ce sponsor pour le moment.
                            </p>
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

      {/* Modal de profil du membre */}
      <Dialog open={showMemberProfile} onOpenChange={setShowMemberProfile}>
        <DialogContent className="sm:max-w-md">
          {selectedMember && (
            <div className="space-y-6">
              {/* Avatar et informations principales */}
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarFallback className="bg-[#81B441]/10 text-[#81B441] font-medium text-xl">
                    {selectedMember.firstName?.[0]?.toUpperCase()}{selectedMember.lastName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedMember.firstName} {selectedMember.lastName}
                </h4>
                
                {/* Informations professionnelles */}
                <div className="space-y-1 text-sm text-gray-600">
                  {selectedMember.jobTitle && (
                    <div className="flex items-center justify-center space-x-2">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>{selectedMember.jobTitle}</span>
                    </div>
                  )}
                  {selectedMember.company && (
                    <div className="flex items-center justify-center space-x-2">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>{selectedMember.company}</span>
                    </div>
                  )}
                  {selectedMember.email && (
                    <div className="flex items-center justify-center space-x-2">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span className="truncate">{selectedMember.email}</span>
                    </div>
                  )}
                </div>

                {/* Badge du type */}
                <Badge className="mt-3 bg-blue-100 text-blue-800">
                  {selectedMember.type === 'PARTICIPANT' ? 'Participant' : 
                   selectedMember.type === 'SPEAKER' ? 'Intervenant' : 
                   selectedMember.type === 'ORGANIZER' ? 'Organisateur' : 
                   selectedMember.type}
                </Badge>
              </div>

              {/* Actions CTA */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-[#81B441] text-[#81B441] hover:bg-[#81B441] hover:text-white"
                  onClick={() => {
                    toast.success(`Contact avec ${selectedMember.firstName} ${selectedMember.lastName} initié`);
                    setShowMemberProfile(false);
                  }}
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1 border-[#81B441] text-[#81B441] hover:bg-[#81B441] hover:text-white"
                  onClick={() => {
                    toast.success(`Demande de rendez-vous envoyée à ${selectedMember.firstName} ${selectedMember.lastName}`);
                    setShowMemberProfile(false);
                  }}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Prendre RV
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 