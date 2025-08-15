"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import UserEventSidebar from "@/components/dashboard/UserEventSidebar";
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
  MapPinIcon,
  ChevronLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import Link from "next/link";

// Types pour les lieux
type MeetingLocation = {
  id: string;
  name: string;
  address?: string;
  description?: string;
  capacity?: number;
  isActive: boolean;
  type: "CONFERENCE_ROOM" | "CAFE" | "OUTDOOR" | "VIRTUAL" | "OTHER";
  equipment?: string[];
  createdAt: string;
};

export default function LieuxPage() {
  const { id } = useParams();

  const [locations, setLocations] = useState<MeetingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<MeetingLocation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<MeetingLocation | null>(null);
  const [locationAppointments, setLocationAppointments] = useState<Array<{
    id?: string; 
    requester?: {firstName: string; lastName: string}; 
    recipient?: {firstName: string; lastName: string}; 
    message?: string; 
    proposedTime?: string; 
    status: string; 
    location?: string
  }>>([]);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    capacity: "",
    type: "CONFERENCE_ROOM" as MeetingLocation["type"],
    equipment: [] as string[],
    isActive: true
  });

  // Fetch meeting locations
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${id}/meeting-locations`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des lieux");
      }
      
      const data = await response.json();
      setLocations(data || []);
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Erreur lors du chargement des lieux");
      // Si l'API n'existe pas encore, on utilise des données de démonstration
      setLocations([
        {
          id: "1",
          name: "Salle de réunion A",
          address: "1er étage, Aile Est",
          description: "Salle climatisée avec équipement audiovisuel",
          capacity: 8,
          type: "CONFERENCE_ROOM",
          equipment: ["Projecteur", "Écran", "Wi-Fi"],
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "2", 
          name: "Espace café",
          address: "Rez-de-chaussée, Hall principal",
          description: "Espace décontracté pour échanges informels",
          capacity: 4,
          type: "CAFE",
          equipment: ["Wi-Fi"],
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "3",
          name: "Visioconférence",
          description: "Rendez-vous virtuel via la plateforme",
          type: "VIRTUAL",
          equipment: ["Zoom", "Teams"],
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleFetchLocations = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call
        const mockLocations: MeetingLocation[] = [
          {
            id: "1",
            name: "Salle de réunion A",
            address: "1er étage, aile gauche",
            description: "Grande salle équipée pour les présentations",
            capacity: "12",
            type: "CONFERENCE_ROOM",
            equipment: ["Projecteur", "Écran", "Tableau blanc"],
            isActive: true,
            eventId: id as string,
            createdAt: new Date().toISOString()
          },
          {
            id: "2",
            name: "Espace café",
            address: "Hall principal",
            description: "Zone détendue pour discussions informelles",
            capacity: "8",
            type: "CAFE",
            equipment: ["Tables hautes", "Machine à café"],
            isActive: true,
            eventId: id as string,
            createdAt: new Date().toISOString()
          },
          {
            id: "3",
            name: "Terrasse",
            address: "3ème étage",
            description: "Espace extérieur avec vue panoramique",
            capacity: "15",
            type: "OUTDOOR",
            equipment: ["Tables", "Parasols"],
            isActive: true,
            eventId: id as string,
            createdAt: new Date().toISOString()
          }
        ];
        setLocations(mockLocations);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };

    handleFetchLocations();

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

  const handleCreate = () => {
    setEditingLocation(null);
    setFormData({
      name: "",
      address: "",
      description: "",
      capacity: "",
      type: "CONFERENCE_ROOM",
      equipment: [],
      isActive: true
    });
    setShowCreateModal(true);
  };

  const handleEdit = (location: MeetingLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || "",
      description: location.description || "",
      capacity: location.capacity ? location.capacity.toString() : "",
      type: location.type,
      equipment: location.equipment || [],
      isActive: location.isActive
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editingLocation 
        ? `/api/events/${id}/meeting-locations/${editingLocation.id}`
        : `/api/events/${id}/meeting-locations`;
      
      const method = editingLocation ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      toast.success(editingLocation ? "Lieu modifié" : "Lieu créé");
      setShowCreateModal(false);
      fetchLocations();
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Impossible de sauvegarder le lieu");
    }
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lieu ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${id}/meeting-locations/${locationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Lieu supprimé");
      fetchLocations();
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Impossible de supprimer le lieu");
    }
  };

  const handleLocationClick = async (location: MeetingLocation) => {
    setSelectedLocation(location);
    setShowDetailsModal(true);
    
    // Fetch appointments for this location
    try {
      const response = await fetch(`/api/events/${id}/appointments?location=${encodeURIComponent(location.name)}`);
      if (response.ok) {
        const appointments = await response.json();
        setLocationAppointments(appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setLocationAppointments([]);
    }
  };

  const getLocationTypeLabel = (type: MeetingLocation["type"]) => {
    const types = {
      CONFERENCE_ROOM: "Salle de réunion",
      CAFE: "Espace café",
      OUTDOOR: "Extérieur",
      VIRTUAL: "Virtuel",
      OTHER: "Autre"
    };
    return types[type] || type;
  };

  const getLocationIcon = (type: MeetingLocation["type"]) => {
    switch (type) {
      case "CONFERENCE_ROOM":
        return <BuildingOfficeIcon className="h-4 w-4" />;
      case "VIRTUAL":
        return <span className="text-sm">💻</span>;
      case "CAFE":
        return <span className="text-sm">☕</span>;
      case "OUTDOOR":
        return <span className="text-sm">🌳</span>;
      default:
        return <MapPinIcon className="h-4 w-4" />;
    }
  };

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
                  href={`/dashboard/user/events/${id}/rendez-vous`}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-2" />
                  <span>Retour aux rendez-vous</span>
                </Link>
                <h1 className="text-xl font-bold text-gray-900">
                  Gestion des Lieux
                </h1>
              </div>
              
              <Button 
                onClick={handleCreate}
                className="bg-[#81B441] text-white border-none"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Nouveau lieu
              </Button>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-[#81B441]" />
                  Lieux de rendez-vous disponibles
                </CardTitle>
                <CardDescription>
                  Gérez les lieux disponibles pour organiser les rendez-vous
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <p>Chargement des lieux...</p>
                  </div>
                ) : locations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map((location) => (
                      <div 
                        key={location.id} 
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                        onClick={() => handleLocationClick(location)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            {getLocationIcon(location.type)}
                            <h3 className="font-medium text-gray-900">{location.name}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={location.isActive ? "default" : "secondary"}
                              className={location.isActive ? "bg-[#81B441] text-white" : ""}
                            >
                              {location.isActive ? "Actif" : "Inactif"}
                            </Badge>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(location)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(location.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Badge variant="outline" className="text-xs">
                            {getLocationTypeLabel(location.type)}
                          </Badge>
                          
                          {location.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPinIcon className="h-4 w-4" />
                              <span>{location.address}</span>
                            </div>
                          )}
                          
                          {location.capacity && (
                            <div className="text-sm text-gray-600">
                              <span>Capacité: {location.capacity} personnes</span>
                            </div>
                          )}
                          
                          {location.description && (
                            <p className="text-xs text-gray-500">{location.description}</p>
                          )}
                          
                          {location.equipment && location.equipment.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {location.equipment.map((eq, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                                  {eq}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Aucun lieu configuré</p>
                    <Button 
                      onClick={handleCreate}
                      className="bg-[#81B441] text-white border-none"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Créer le premier lieu
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Modal de création/modification */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Modifier le lieu" : "Nouveau lieu de rendez-vous"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation 
                ? "Modifiez les informations du lieu de rendez-vous"
                : "Créez un nouveau lieu pour organiser les rendez-vous"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du lieu</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Salle de réunion A, Espace café..."
              />
            </div>

            <div>
              <Label htmlFor="type">Type de lieu</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as MeetingLocation["type"] }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="CONFERENCE_ROOM">Salle de réunion</option>
                <option value="CAFE">Espace café</option>
                <option value="OUTDOOR">Extérieur</option>
                <option value="VIRTUAL">Virtuel</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <Label htmlFor="address">Adresse/Localisation</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Ex: 1er étage, Aile Est"
              />
            </div>

            <div>
              <Label htmlFor="capacity">Capacité (nombre de personnes)</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                placeholder="Ex: 8"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du lieu, équipements disponibles..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Lieu actif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-[#81B441] text-white border-none"
              disabled={!formData.name}
            >
              {editingLocation ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détails du lieu avec onglets */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-[#81B441]" />
              {selectedLocation?.name}
            </DialogTitle>
            <DialogDescription>
              Détails du lieu et rendez-vous associés
            </DialogDescription>
          </DialogHeader>

          {selectedLocation && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Informations</TabsTrigger>
                <TabsTrigger value="appointments">
                  Rendez-vous ({locationAppointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nom du lieu</Label>
                    <p className="text-gray-900">{selectedLocation.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Type</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-gray-50">
                        {getLocationTypeLabel(selectedLocation.type)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Adresse</Label>
                    <p className="text-gray-900">{selectedLocation.address || "Non spécifiée"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Capacité</Label>
                    <p className="text-gray-900">
                      {selectedLocation.capacity ? `${selectedLocation.capacity} personnes` : "Non spécifiée"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Statut</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedLocation.isActive ? "default" : "secondary"}
                        className={selectedLocation.isActive ? "bg-[#81B441] text-white" : ""}
                      >
                        {selectedLocation.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>
                </div>
                {selectedLocation.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLocation.description}</p>
                  </div>
                )}
                {selectedLocation.equipment && selectedLocation.equipment.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Équipements</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedLocation.equipment.map((item, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="appointments" className="space-y-4">
                {locationAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {locationAppointments.map((appointment, index) => (
                      <div key={appointment.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {appointment.requester?.firstName} {appointment.requester?.lastName} → {appointment.recipient?.firstName} {appointment.recipient?.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">{appointment.message || "Aucun message"}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Proposé: {appointment.proposedTime ? new Date(appointment.proposedTime).toLocaleString('fr-FR') : 'Non spécifié'}
                            </p>
                            {appointment.location && (
                              <p className="text-xs text-gray-500">
                                Lieu: {appointment.location}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              appointment.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-300' :
                              appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              appointment.status === 'DECLINED' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-blue-100 text-blue-800 border-blue-300'
                            }
                          >
                            {appointment.status === 'ACCEPTED' ? 'Accepté' :
                             appointment.status === 'PENDING' ? 'En attente' :
                             appointment.status === 'DECLINED' ? 'Refusé' :
                             'Terminé'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p>Aucun rendez-vous prévu dans ce lieu</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
