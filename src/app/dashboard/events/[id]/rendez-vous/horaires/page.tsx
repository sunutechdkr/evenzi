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
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Types pour les créneaux horaires
type TimeSlot = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  isActive: boolean;
  eventId: string;
  createdAt: string;
};

export default function AdminHorairesPage() {
  const { id } = useParams();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slotAppointments, setSlotAppointments] = useState<Array<{
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
    startTime: "",
    endTime: "",
    description: "",
    isActive: true
  });

  // Fetch time slots
  useEffect(() => {
    const handleFetchTimeSlots = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call
        const mockSlots: TimeSlot[] = [
          {
            id: "1",
            name: "Matinée networking",
            startTime: "09:00",
            endTime: "12:00",
            description: "Sessions de networking du matin",
            isActive: true,
            eventId: id as string,
            createdAt: new Date().toISOString()
          },
          {
            id: "2",
            name: "Pause déjeuner",
            startTime: "12:00",
            endTime: "14:00",
            description: "Rendez-vous informels pendant le déjeuner",
            isActive: true,
            eventId: id as string,
            createdAt: new Date().toISOString()
          },
          {
            id: "3",
            name: "Après-midi business",
            startTime: "14:00",
            endTime: "17:00",
            description: "Créneaux pour rendez-vous d'affaires",
            isActive: true,
            eventId: id as string,
            createdAt: new Date().toISOString()
          }
        ];
        setTimeSlots(mockSlots);
      } catch (error) {
        console.error("Error fetching time slots:", error);
      } finally {
        setLoading(false);
      }
    };

    handleFetchTimeSlots();

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
    setEditingSlot(null);
    setFormData({
      name: "",
      startTime: "",
      endTime: "",
      description: "",
      isActive: true
    });
    setShowCreateModal(true);
  };

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setFormData({
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      description: slot.description || "",
      isActive: slot.isActive
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/events/${id}/time-slots${editingSlot ? `/${editingSlot.id}` : ''}`, {
        method: editingSlot ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      toast.success(editingSlot ? "Créneau modifié" : "Créneau créé");
      setShowCreateModal(false);
      // fetchTimeSlots(); // Refresh the list
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Impossible de sauvegarder le créneau");
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce créneau ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${id}/time-slots/${slotId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Créneau supprimé");
      // fetchTimeSlots();
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Impossible de supprimer le créneau");
    }
  };

  const handleSlotClick = async (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setShowDetailsModal(true);
    
    // Fetch appointments for this time slot
    try {
      const response = await fetch(`/api/events/${id}/appointments?timeSlot=${slot.startTime}-${slot.endTime}`);
      if (response.ok) {
        const appointments = await response.json();
        setSlotAppointments(appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setSlotAppointments([]);
    }
  };

  const formatTime = (time: string) => {
    return time || "Non défini";
  };

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
        <main className="dashboard-main flex-1">
          {/* En-tête */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/dashboard/events/${id}/rendez-vous`}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-2" />
                  <span>Retour aux rendez-vous</span>
                </Link>
                <h1 className="text-xl font-bold text-gray-900">
                  Gestion des Horaires
                </h1>
              </div>
              
              <Button 
                onClick={handleCreate}
                className="bg-[#81B441] text-white border-none"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Nouveau créneau
              </Button>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-[#81B441]" />
                  Créneaux horaires disponibles
                </CardTitle>
                <CardDescription>
                  Gérez les créneaux horaires pour organiser les rendez-vous
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <p>Chargement des créneaux...</p>
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {timeSlots.map((slot) => (
                      <div 
                        key={slot.id} 
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                        onClick={() => handleSlotClick(slot)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-medium text-gray-900">{slot.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={slot.isActive ? "default" : "secondary"}
                              className={slot.isActive ? "bg-[#81B441] text-white" : ""}
                            >
                              {slot.isActive ? "Actif" : "Inactif"}
                            </Badge>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(slot)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(slot.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                          </div>
                          {slot.description && (
                            <p className="text-xs text-gray-500">{slot.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Aucun créneau horaire configuré</p>
                    <Button 
                      onClick={handleCreate}
                      className="bg-[#81B441] text-white border-none"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Créer un créneau
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Modal de création/édition */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? "Modifier le créneau" : "Nouveau créneau horaire"}
            </DialogTitle>
            <DialogDescription>
              Configurez un créneau horaire pour les rendez-vous
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du créneau</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Matinée networking"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Heure de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du créneau..."
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
              <Label htmlFor="isActive">Créneau actif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-[#81B441] text-white border-none"
              disabled={!formData.name || !formData.startTime || !formData.endTime}
            >
              {editingSlot ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détails du créneau avec onglets */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-[#81B441]" />
              {selectedSlot?.name}
            </DialogTitle>
            <DialogDescription>
              Détails du créneau et rendez-vous associés
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Informations</TabsTrigger>
                <TabsTrigger value="appointments">
                  Rendez-vous ({slotAppointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nom du créneau</Label>
                    <p className="text-gray-900">{selectedSlot.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Statut</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedSlot.isActive ? "default" : "secondary"}
                        className={selectedSlot.isActive ? "bg-[#81B441] text-white" : ""}
                      >
                        {selectedSlot.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Heure de début</Label>
                    <p className="text-gray-900">{formatTime(selectedSlot.startTime)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Heure de fin</Label>
                    <p className="text-gray-900">{formatTime(selectedSlot.endTime)}</p>
                  </div>
                </div>
                {selectedSlot.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedSlot.description}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="appointments" className="space-y-4">
                {slotAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {slotAppointments.map((appointment, index) => (
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
                    <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p>Aucun rendez-vous prévu pour ce créneau</p>
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
