"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  UserPlusIcon, 
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SponsorLogo } from "@/components/ui/sponsor-logo";
import { SponsorDetailsTab, SponsorMembersTab, SponsorSessionsTab, SponsorDocumentsTab } from "@/components/sponsors/SponsorTabs";

// Types pour les sponsors
type SponsorLevel = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTNER' | 'MEDIA' | 'OTHER';

type SponsorStats = {
  members: number;
  sessions: number;
  documents: number;
  appointments: number;
  products: number;
};

type Sponsor = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  level: SponsorLevel;
  visible: boolean;
  location?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  documents?: { name: string; size: string; type: string }[];
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
  stats?: SponsorStats;
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

export default function EventSponsorsPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<Event | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 sponsors par page
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editedSponsor, setEditedSponsor] = useState<Partial<Sponsor> | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const router = useRouter();

  // Extraction des paramètres
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);
    };
    extractParams();
  }, [params]);

  // Fetch data on load
  useEffect(() => {
    const handleFetch = async () => {
      if (eventId) {
        await fetchEventDetails();
        await fetchSponsors();
      }
    };
    handleFetch();
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
   * Récupère la liste des sponsors
   */
  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/sponsors`);
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
    (levelFilter ? sponsor.level === levelFilter : true)
  );

  // Pagination des résultats filtrés
  const totalItems = filteredSponsors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSponsors = filteredSponsors.slice(startIndex, endIndex);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, levelFilter]);

  // Helper function to handle edited sponsor updates
  const handleEditedSponsorUpdate = (updatedData: Record<string, any>) => {
    setEditedSponsor(updatedData);
  };

  /**
   * Rafraîchit la liste des sponsors
   */
  const handleRefresh = () => {
    toast.loading('Actualisation des sponsors...', { id: 'refresh-toast' });
    fetchSponsors().then(() => {
      toast.success('Liste des sponsors actualisée', { id: 'refresh-toast' });
    });
  };

  /**
   * Exporte les sponsors au format Excel
   */
  const handleExportSponsors = () => {
    const exportUrl = `/api/events/${eventId}/export/sponsors`;
    
    toast.loading('Exportation des sponsors en cours...', { id: 'export-toast' });

    const downloadLink = document.createElement('a');
    downloadLink.href = exportUrl;
    downloadLink.target = '_blank';
    downloadLink.download = 'sponsors.xlsx';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    setTimeout(() => {
      toast.success('Les sponsors ont été exportés avec succès', { id: 'export-toast' });
    }, 1000);
  };

  const getSponsorTabData = (sponsor: Sponsor) => ({
    ...sponsor,
    eventId,
    createdAt: sponsor.createdAt instanceof Date ? sponsor.createdAt.toISOString() : sponsor.createdAt,
    updatedAt: sponsor.updatedAt instanceof Date ? sponsor.updatedAt.toISOString() : sponsor.updatedAt,
  });

  const openSponsorDetails = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setActiveTab("details");
    setShowSponsorModal(true);
    setIsEditing(false);
    setEditedSponsor(null);
  };

  /**
   * Sauvegarde les modifications du sponsor
   */
  const handleSaveSponsor = async () => {
    if (!editedSponsor || !selectedSponsor) return;
    
    try {
      setProcessing(true);
      
      const response = await fetch(`/api/events/${eventId}/sponsors/${selectedSponsor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedSponsor.name,
          description: editedSponsor.description,
          website: editedSponsor.website,
          level: editedSponsor.level,
          visible: editedSponsor.visible,
          location: editedSponsor.location,
          address: editedSponsor.address,
          phone: editedSponsor.phone,
          mobile: editedSponsor.mobile,
          email: editedSponsor.email,
          linkedinUrl: editedSponsor.linkedinUrl,
          twitterUrl: editedSponsor.twitterUrl,
          facebookUrl: editedSponsor.facebookUrl,
          documents: editedSponsor.documents,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
      
      const updatedSponsor = await response.json();
      
      // Convertir les dates en objets Date si nécessaire
      const formattedSponsor = {
        ...updatedSponsor,
        createdAt: typeof updatedSponsor.createdAt === 'string' ? new Date(updatedSponsor.createdAt) : updatedSponsor.createdAt,
        updatedAt: typeof updatedSponsor.updatedAt === 'string' ? new Date(updatedSponsor.updatedAt) : updatedSponsor.updatedAt,
      };

      // Mettre à jour la liste locale
      setSponsors(prev => prev.map(s => s.id === selectedSponsor.id ? formattedSponsor : s));
      setSelectedSponsor(formattedSponsor);
      
      toast.success('Sponsor mis à jour avec succès');
      
      // Délai pour permettre à l'utilisateur de voir le message
      setTimeout(() => {
        setIsEditing(false);
        setEditedSponsor(null);
      }, 1500);
    } catch (error: unknown) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSponsor = async () => {
    if (!sponsorToDelete) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/events/${eventId}/sponsors/${sponsorToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erreur lors de la suppression du sponsor');
      
      toast.success('Sponsor supprimé avec succès');
      setDeleteConfirmOpen(false);
      setSponsorToDelete(null);
      setShowSponsorModal(false); // Fermer le modal des détails
      setSelectedSponsor(null);
      fetchSponsors();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de supprimer le sponsor');
    } finally {
      setProcessing(false);
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EventSidebar eventId={eventId} />
        <div className="flex-1 p-6 ml-0 md:ml-64 transition-all duration-300">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#81B441] border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Chargement des données...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sponsors-container bg-[#f9fafb] min-h-screen">
      <EventSidebar eventId={eventId} activeTab="sponsors" />
      
      <div className="ml-0 md:ml-64 transition-all duration-300 p-4 md:p-6">
        {/* En-tête de la page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
              Sponsors et Partenaires {event?.name && <span className="text-[#81B441]">• {event.name}</span>}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les sponsors et partenaires pour votre événement
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-600 hover:text-[#81B441] hover:border-[#81B441]"
              onClick={handleRefresh}
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            
            <Button
              variant="outline"
              className="border-gray-300 text-gray-600 hover:text-[#81B441] hover:border-[#81B441]"
              onClick={handleExportSponsors}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Exporter Excel
            </Button>
            
            <Link
              href={`/dashboard/events/${eventId}/sponsors/edit`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#81B441] hover:bg-[#72a139] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter un sponsor
            </Link>
            
            {/* Bouton Réglages */}
            <Button 
              variant="outline" 
              className="ml-2"
              onClick={() => setShowSettingsModal(true)}
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Réglages
            </Button>
          </div>
        </div>
        
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total des sponsors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sponsors.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Sponsors visibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {sponsors.filter(s => s.visible).length}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({sponsors.length > 0 ? `${Math.round((sponsors.filter(s => s.visible).length / sponsors.length) * 100)}%` : '0%'})
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Platinum/Gold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {sponsors.filter(s => s.level === 'PLATINUM' || s.level === 'GOLD').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Partenaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {sponsors.filter(s => s.level === 'PARTNER').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options de vue et recherche */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Barre de recherche */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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

        {/* Tableau des sponsors */}
        {sponsors.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5" />
                Sponsors et Partenaires ({totalItems})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] sticky left-0 bg-white z-10">Logo</TableHead>
                        <TableHead className="min-w-[200px] sticky left-[80px] bg-white z-10">Sponsor</TableHead>
                        <TableHead className="w-[120px]">Niveau</TableHead>
                        <TableHead className="w-[100px]">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            Membres
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px]">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            Sessions
                          </div>
                        </TableHead>
                        <TableHead className="w-[110px]">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Documents
                          </div>
                        </TableHead>
                        <TableHead className="w-[80px]">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            RDV
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px]">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Produits
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[200px]">Site web</TableHead>
                        <TableHead className="w-[100px]">Statut</TableHead>
                        <TableHead className="w-[140px]">Date d&apos;ajout</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSponsors.map((sponsor) => (
                        <TableRow 
                          key={sponsor.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openSponsorDetails(sponsor)}
                        >
                          {/* Logo */}
                          <TableCell className="py-4 sticky left-0 bg-white z-10">
                            <SponsorLogo 
                              src={sponsor.logo} 
                              alt={sponsor.name}
                              size="md"
                            />
                          </TableCell>
                          
                          {/* Informations sponsor */}
                          <TableCell className="py-4 sticky left-[80px] bg-white z-10">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">
                                {sponsor.name}
                              </div>
                              {!sponsor.logo && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/dashboard/events/${eventId}/sponsors/edit?id=${sponsor.id}`);
                                  }}
                                  className="text-xs text-[#81B441] hover:text-[#72a139] underline"
                                >
                                  Ajouter un logo
                                </button>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Niveau */}
                          <TableCell className="py-4">
                            <Badge className={`${getLevelBadgeClass(sponsor.level)} text-xs`}>
                              {getLevelText(sponsor.level)}
                            </Badge>
                          </TableCell>
                          
                          {/* Membres */}
                          <TableCell className="py-4">
                            <span className="font-medium text-gray-900">{sponsor.stats?.members || 0}</span>
                          </TableCell>
                          
                          {/* Sessions */}
                          <TableCell className="py-4">
                            <span className="font-medium text-gray-900">{sponsor.stats?.sessions || 0}</span>
                          </TableCell>
                          
                          {/* Documents */}
                          <TableCell className="py-4">
                            <span className="font-medium text-gray-900">{sponsor.stats?.documents || 0}</span>
                          </TableCell>
                          
                          {/* RDV */}
                          <TableCell className="py-4">
                            <span className="font-medium text-gray-900">{sponsor.stats?.appointments || 0}</span>
                          </TableCell>
                          
                          {/* Produits */}
                          <TableCell className="py-4">
                            <span className="font-medium text-gray-900">{sponsor.stats?.products || 0}</span>
                          </TableCell>
                          
                          {/* Site web */}
                          <TableCell className="py-4">
                            {sponsor.website ? (
                              <div className="flex items-center gap-2">
                                <GlobeAltIcon className="h-4 w-4 text-blue-600" />
                                <a
                                  href={sponsor.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-[150px]"
                                >
                                  {sponsor.website.replace(/^https?:\/\//, '')}
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          
                          {/* Statut */}
                          <TableCell className="py-4">
                            {sponsor.visible ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <EyeIcon className="h-3 w-3 mr-1" />
                                Visible
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">
                                <EyeSlashIcon className="h-3 w-3 mr-1" />
                                Masqué
                              </Badge>
                            )}
                          </TableCell>
                          
                          {/* Date d'ajout */}
                          <TableCell className="py-4">
                            <span className="text-sm text-gray-500">
                              {format(sponsor.createdAt, "dd MMM yyyy", { locale: fr })}
                            </span>
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="py-4 text-right">
                            <div className="flex items-center justify-end gap-1">

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSponsorDetails(sponsor);
                                }}
                                className="h-8 w-8 p-0"
                                title="Voir les détails"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-gray-700">
                    Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} sponsors
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? "bg-[#81B441] hover:bg-[#72a139]" : ""}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* État vide */
          <Card className="p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UserPlusIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Aucun sponsor</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              Vous n&apos;avez pas encore ajouté de sponsors à cet événement. Les sponsors apparaîtront ici.
            </p>
            <Link
              href={`/dashboard/events/${eventId}/sponsors/edit`}
              className="mt-5 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#81B441] hover:bg-[#72a139] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter votre premier sponsor
            </Link>
          </Card>
        )}
      </div>

      {/* Modal des détails du sponsor */}
      <Dialog open={showSponsorModal} onOpenChange={setShowSponsorModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] h-[80vh] flex flex-col">
          {selectedSponsor && (
            <div className="flex flex-col h-full">
              {/* En-tête fixe */}
              <div className="flex-shrink-0 pb-4 border-b">
                <div className="flex items-start justify-between">
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
                  
                  {/* Boutons d'actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setEditedSponsor(selectedSponsor);
                      }}
                      variant={isEditing ? "outline" : "default"}
                      className={!isEditing ? "bg-[#81B441] hover:bg-[#72a139]" : ""}
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {isEditing ? 'Annuler' : 'Modifier'}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setSponsorToDelete(selectedSponsor);
                        setDeleteConfirmOpen(true);
                      }}
                      variant="outline"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>

              {/* Onglets */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="members">Membres</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="appointments">RDV</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="timeline">Historique</TabsTrigger>
                </TabsList>

                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Onglet Détails */}
                  <TabsContent value="details" className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-6 space-y-6">
                        <SponsorDetailsTab 
                          sponsor={getSponsorTabData(selectedSponsor)} 
                          isEditing={isEditing}
                          editedSponsor={editedSponsor as any}
                          setEditedSponsor={handleEditedSponsorUpdate}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Onglet Membres */}
                  <TabsContent value="members" className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-6 space-y-6">
                        <SponsorMembersTab 
                          sponsor={getSponsorTabData(selectedSponsor)}
                          isEditing={isEditing}
                          editedSponsor={editedSponsor as any}
                          setEditedSponsor={handleEditedSponsorUpdate}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Onglet Sessions */}
                  <TabsContent value="sessions" className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-6 space-y-6">
                        <SponsorSessionsTab 
                          sponsor={getSponsorTabData(selectedSponsor)}
                          isEditing={isEditing}
                          editedSponsor={editedSponsor as any}
                          setEditedSponsor={handleEditedSponsorUpdate}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Onglet RDV */}
                  <TabsContent value="appointments" className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="text-center py-8">
                          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous planifié</h3>
                          <p className="text-gray-500">Les rendez-vous avec ce sponsor apparaîtront ici.</p>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Onglet Documents */}
                  <TabsContent value="documents" className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-6 space-y-6">
                        <SponsorDocumentsTab 
                          sponsor={getSponsorTabData(selectedSponsor)}
                          isEditing={isEditing}
                          editedSponsor={editedSponsor as any}
                          setEditedSponsor={handleEditedSponsorUpdate}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Onglet Historique */}
                  <TabsContent value="timeline" className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CalendarIcon className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">Sponsor créé</div>
                              <div className="text-xs text-gray-500">
                                {format(selectedSponsor.createdAt, "dd MMMM yyyy à HH:mm", { locale: fr })}
                              </div>
                            </div>
                          </div>
                          
                          {selectedSponsor.updatedAt && selectedSponsor.updatedAt.getTime() !== selectedSponsor.createdAt.getTime() && (
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <PencilIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">Dernière modification</div>
                                <div className="text-xs text-gray-500">
                                  {format(selectedSponsor.updatedAt, "dd MMMM yyyy à HH:mm", { locale: fr })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </div>

                {/* Footer avec boutons d'action en mode édition */}
                {isEditing && (
                  <div className="flex-shrink-0 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedSponsor(null);
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSaveSponsor}
                        disabled={processing}
                        className="bg-[#81B441] hover:bg-[#72a139]"
                      >
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </div>
                  </div>
                )}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmer la suppression</DialogTitle>
            <DialogDescription>
              {sponsorToDelete && (
                <p>
                  Êtes-vous sûr de vouloir supprimer définitivement le sponsor{' '}
                  <strong>{sponsorToDelete.name}</strong> ?
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
              onClick={handleDeleteSponsor}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de réglages sponsors */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <Cog6ToothIcon className="h-6 w-6 text-[#81B441]" />
              Réglages des sponsors
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-8 p-1">
                
                {/* Configuration générale */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Configuration générale</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Affichage public des sponsors</Label>
                        <p className="text-xs text-gray-500">Autoriser l&apos;affichage des sponsors sur la page publique de l&apos;événement</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Ordre d&apos;affichage par défaut</Label>
                        <p className="text-xs text-gray-500">Choisir l&apos;ordre d&apos;affichage des sponsors</p>
                      </div>
                      <Select defaultValue="level">
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="level">Par niveau</SelectItem>
                          <SelectItem value="name">Par nom</SelectItem>
                          <SelectItem value="date">Par date d&apos;ajout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Gestion des niveaux */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Gestion des niveaux de partenariat</h3>
                  <div className="space-y-6">
                    
                    {/* Liste des niveaux actuels */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Niveaux disponibles</Label>
                      <div className="space-y-2">
                        {[
                          { value: 'PLATINUM', label: 'Platinum', color: 'bg-gray-200 text-gray-800' },
                          { value: 'GOLD', label: 'Gold', color: 'bg-yellow-100 text-yellow-800' },
                          { value: 'SILVER', label: 'Silver', color: 'bg-gray-100 text-gray-700' },
                          { value: 'BRONZE', label: 'Bronze', color: 'bg-orange-100 text-orange-700' },
                          { value: 'PARTNER', label: 'Partenaire', color: 'bg-blue-100 text-blue-800' },
                          { value: 'MEDIA', label: 'Média', color: 'bg-purple-100 text-purple-800' },
                          { value: 'OTHER', label: 'Autre', color: 'bg-gray-50 text-gray-600' }
                        ].map((level) => (
                          <div key={level.value} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Badge className={`${level.color} hover:${level.color}`}>
                                {level.label}
                              </Badge>
                              <span className="text-sm text-gray-600">Niveau {level.label.toLowerCase()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <PencilIcon className="h-3 w-3" />
                              </Button>
                              {level.value !== 'OTHER' && (
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <TrashIcon className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Bouton d'ajout de niveau */}
                      <Button variant="outline" className="mt-3 w-full border-dashed border-2 text-[#81B441] border-[#81B441] hover:bg-[#81B441]/5">
                        + Ajouter un niveau personnalisé
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Affichage des badges de niveau</Label>
                        <p className="text-xs text-gray-500">Afficher les badges de niveau sur les logos des sponsors</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Actions en masse */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Actions en masse</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <DocumentDuplicateIcon className="h-4 w-4" />
                          <span className="font-medium">Dupliquer sponsors</span>
                        </div>
                        <p className="text-xs text-gray-500">Dupliquer les sponsors sélectionnés</p>
                      </div>
                    </Button>

                    <Button variant="outline" className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          <span className="font-medium">Import en masse</span>
                        </div>
                        <p className="text-xs text-gray-500">Importer plusieurs sponsors via CSV</p>
                      </div>
                    </Button>

                    <Button variant="outline" className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <ArchiveBoxIcon className="h-4 w-4" />
                          <span className="font-medium">Archivage automatique</span>
                        </div>
                        <p className="text-xs text-gray-500">Archiver les sponsors inactifs</p>
                      </div>
                    </Button>

                    <Button variant="outline" className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <BanknotesIcon className="h-4 w-4" />
                          <span className="font-medium">Gestion tarifaire</span>
                        </div>
                        <p className="text-xs text-gray-500">Configurer les tarifs par niveau</p>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Notifications de nouveaux sponsors</Label>
                        <p className="text-xs text-gray-500">Recevoir une notification lors de l&apos;ajout d&apos;un nouveau sponsor</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Rappels de renouvellement</Label>
                        <p className="text-xs text-gray-500">Envoyer des rappels avant expiration des contrats</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowSettingsModal(false)} className="bg-[#81B441] hover:bg-[#72a139]">
              Enregistrer les réglages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le sponsor</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le sponsor &quot;{sponsorToDelete?.name}&quot; ? 
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setSponsorToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSponsor}
              disabled={processing}
            >
              {processing ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 