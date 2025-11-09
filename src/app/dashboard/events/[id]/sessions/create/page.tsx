"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeftIcon, XMarkIcon, MapPinIcon, UserIcon, UsersIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Types
type Session = {
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
};

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
}

const formatOptions = [
  { value: "physique", label: "Physique", description: "Session en présentiel" },
  { value: "visioconference", label: "Visioconférence", description: "Session en ligne" },
  { value: "table-ronde", label: "Table-ronde", description: "Discussion en groupe" },
  { value: "lien-video", label: "Lien vidéo", description: "Session avec vidéo externe" },
];

export default function CreateSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string>("");

  const [formData, setFormData] = useState<Session>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    speaker: "",
    capacity: undefined,
    format: "physique"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [eventDates, setEventDates] = useState<{startDate: string, endDate: string} | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // États pour la bannière
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  // Référence pour l'input file de la bannière
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Add new state for participants
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // États pour les sponsors
  const [sponsors, setSponsors] = useState<Array<{
    id: string;
    name: string;
    logo?: string;
    level: string;
  }>>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(false);

  // États pour les lieux de rendez-vous
  const [locations, setLocations] = useState<Array<{
    id: string;
    name: string;
    address?: string;
    capacity?: number;
    amenities?: string[];
  }>>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Extraire les paramètres une fois au chargement du composant
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      if (resolvedParams && resolvedParams.id) {
        setEventId(resolvedParams.id);
      }
    };
    extractParams();
  }, [params]);

  // Récupérer les dates de l'événement
  useEffect(() => {
    if (!eventId) return;

    const fetchEventDates = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération de l'événement");
        const data = await response.json();
        
        // Convertir les dates au format YYYY-MM-DD pour les inputs date
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        
        setEventDates({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
        
        // Initialiser les dates avec la date de début de l'événement
        setFormData(prev => ({
          ...prev,
          start_date: startDate.toISOString().split('T')[0],
          end_date: startDate.toISOString().split('T')[0]
        }));
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de récupérer les informations de l'événement");
      }
    };

    fetchEventDates();
  }, [eventId]);

  // Add useEffect to fetch participants
  useEffect(() => {
    if (!eventId) return;

    const fetchParticipants = async () => {
      setLoadingParticipants(true);
      try {
        const response = await fetch(`/api/events/${eventId}/registrations`);
        if (!response.ok) {
          throw new Error("Failed to fetch participants");
        }
        
        const data = await response.json();
        if (data && data.registrations) {
          setParticipants(data.registrations);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
        toast.error("Failed to load participants");
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchParticipants();
    fetchLocations();
    fetchSponsors();
  }, [eventId]);

  const fetchLocations = async () => {
    if (!eventId) return;
    setLoadingLocations(true);
    try {
      const response = await fetch(`/api/events/${eventId}/meeting-locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.filter((loc: any) => loc.isActive));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des lieux:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchSponsors = async () => {
    if (!eventId) return;
    setLoadingSponsors(true);
    try {
      const response = await fetch(`/api/events/${eventId}/sponsors`);
      if (response.ok) {
        const data = await response.json();
        setSponsors(data.filter((sponsor: any) => sponsor.visible));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sponsors:', error);
    } finally {
      setLoadingSponsors(false);
    }
  };

  // Gestion des changements de formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Gestion du changement de format
  const handleFormatChange = (value: string) => {
    setFormData(prev => ({ ...prev, format: value }));
    if (errors.format) {
      setErrors(prev => ({ ...prev, format: "" }));
    }
  };

  // Gestion des changements de date
  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Gestion des changements d'heure
  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Gérer le changement de bannière
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBannerPreview(result);
        setFormData({ ...formData, banner: result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer la bannière
  const handleRemoveBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerPreview(null);
    setFormData({ ...formData, banner: undefined });
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = "Le titre est requis";
    }
    
    if (!formData.start_date) {
      newErrors.start_date = "La date de début est requise";
    } else if (eventDates && new Date(formData.start_date) < new Date(eventDates.startDate)) {
      newErrors.start_date = "La date doit être ≥ à la date de début de l'événement";
    } else if (eventDates && new Date(formData.start_date) > new Date(eventDates.endDate)) {
      newErrors.start_date = "La date doit être ≤ à la date de fin de l'événement";
    }
    
    if (!formData.end_date) {
      newErrors.end_date = "La date de fin est requise";
    } else if (formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      newErrors.end_date = "La date de fin doit être ≥ à la date de début";
    }
    
    if (!formData.start_time) {
      newErrors.start_time = "L'heure de début est requise";
    }
    
    if (!formData.end_time) {
      newErrors.end_time = "L'heure de fin est requise";
    } else if (
      formData.start_date === formData.end_date && 
      formData.start_time && 
      formData.end_time && 
      formData.end_time <= formData.start_time
    ) {
      newErrors.end_time = "L'heure de fin doit être > à l'heure de début";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // Errors handled in validateForm
      return;
    }
    
    setSaving(true);
    
    try {
      // Convert selected speakers array to comma-separated string
      const speakerString = selectedSpeakers.join(',');
      
      // Prepare form data with speakers
      const formDataToSend = {
        ...formData,
        speaker: speakerString
      };
      
      // Handle banner upload
      if (bannerPreview) {
        // ... existing banner upload code ...
      }

      // Create the session
      const response = await fetch(`/api/events/${eventId}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formDataToSend)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create session");
      }
      
      const sessionData = await response.json();
      const sessionId = sessionData.id;
      
      // Link selected sponsors to the session
      if (selectedSponsors.length > 0 && sessionId) {
        await Promise.all(
          selectedSponsors.map(async (sponsorId) => {
            try {
              await fetch(`/api/events/${eventId}/sessions/${sessionId}/sponsors`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sponsorId })
              });
            } catch (error) {
              console.error(`Error linking sponsor ${sponsorId}:`, error);
              // Continue even if one sponsor link fails
            }
          })
        );
      }
      
      setSuccess(true);
      toast.success("Session created successfully!");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/events/${eventId}/sessions`);
      }, 2000);
      
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setSaving(false);
    }
  };

  // Transform participants to options for MultiSelect
  const speakerOptions: Option[] = participants
    .filter(p => p.type === 'SPEAKER' || p.type === 'PARTICIPANT')
    .map(p => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName}`
    }));

  // Transform sponsors to options for MultiSelect
  const sponsorOptions: Option[] = sponsors.map(s => ({
    value: s.id,
    label: s.name
  }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EventSidebar eventId={eventId} />
      
      <main className="flex-1 p-6 ml-0 md:ml-64 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6">
            <Link 
              href={`/dashboard/events/${eventId}/sessions`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" />
              Retour au programme
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Ajouter une session</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              {/* Titre */}
              <div className="mb-4">
                <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Titre <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nom de la session"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Description de la session (optionnel)"
                />
              </div>
              
              {/* Dates et heures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    id="start_date"
                    name="start_date"
                    value={formData.start_date || ''}
                    onChange={(date) => handleDateChange('start_date', date)}
                    minDate={eventDates?.startDate}
                    maxDate={eventDates?.endDate}
                    className="w-full"
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    id="end_date"
                    name="end_date"
                    value={formData.end_date || ''}
                    onChange={(date) => handleDateChange('end_date', date)}
                    minDate={formData.start_date || eventDates?.startDate}
                    maxDate={eventDates?.endDate}
                    className="w-full"
                  />
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de début <span className="text-red-500">*</span>
                  </Label>
                  <TimePicker
                    id="start_time"
                    name="start_time"
                    value={formData.start_time || ''}
                    onChange={(time) => handleTimeChange('start_time', time)}
                    className="w-full"
                  />
                  {errors.start_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de fin <span className="text-red-500">*</span>
                  </Label>
                  <TimePicker
                    id="end_time"
                    name="end_time"
                    value={formData.end_time || ''}
                    onChange={(time) => handleTimeChange('end_time', time)}
                    className="w-full"
                  />
                  {errors.end_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
                  )}
                </div>
              </div>
              
              {/* Location */}
              <div className="mb-4">
                <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu
                </Label>
                <Select
                  value={selectedLocation}
                  onValueChange={(value) => {
                    setSelectedLocation(value);
                    setFormData(prev => ({ ...prev, location: value }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingLocations ? "Chargement des lieux..." : "Sélectionnez un lieu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length > 0 ? (
                      locations.map((location) => (
                        <SelectItem key={location.id} value={location.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{location.name}</span>
                            <span className="text-xs text-gray-500">
                              {location.address && `${location.address}`}
                              {location.capacity && ` • ${location.capacity} personnes`}
                              {location.amenities && location.amenities.length > 0 && (
                                <span className="ml-2">
                                  {location.amenities.slice(0, 2).join(', ')}
                                  {location.amenities.length > 2 && '...'}
                                </span>
                              )}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-locations" disabled>
                        {loadingLocations ? "Chargement..." : "Aucun lieu disponible"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Speaker */}
              <div className="mb-4">
                <Label htmlFor="speaker" className="block text-sm font-medium text-gray-700 mb-1">
                  Intervenant
                </Label>
                <MultiSelect
                  options={speakerOptions}
                  selected={selectedSpeakers}
                  onChange={setSelectedSpeakers}
                  placeholder="Sélectionner un ou plusieurs intervenants"
                  searchPlaceholder="Rechercher un participant..."
                  loading={loadingParticipants}
                  className="pl-10"
                />
              </div>
              
              {/* Sponsors */}
              <div className="mb-4">
                <Label htmlFor="sponsors" className="block text-sm font-medium text-gray-700 mb-1">
                  Sponsors (optionnel)
                </Label>
                <MultiSelect
                  options={sponsorOptions}
                  selected={selectedSponsors}
                  onChange={setSelectedSponsors}
                  placeholder="Sélectionner un ou plusieurs sponsors"
                  searchPlaceholder="Rechercher un sponsor..."
                  loading={loadingSponsors}
                  className="pl-10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ajoutez les sponsors qui soutiennent cette session
                </p>
              </div>
              
              {/* Capacity */}
              <div className="mb-4">
                <Label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacité
                </Label>
                <Input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Nombre de places disponibles"
                />
              </div>
              
              {/* Format */}
              <div className="mb-4">
                <Label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </Label>
                <Select onValueChange={handleFormatChange} defaultValue={formData.format || 'physique'}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Banner upload */}
              <div className="mb-6">
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Bannière
                </Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#81B441] transition-colors"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {bannerPreview ? (
                    <div className="relative w-full">
                      <img 
                        src={bannerPreview} 
                        alt="Banner preview" 
                        className="max-h-40 max-w-full mx-auto object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveBanner}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Cliquer pour ajouter une bannière</span>
                    </>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    id="banner"
                    name="banner"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                <Link
                  href={`/dashboard/events/${eventId}/sessions`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </Link>
                <Button
                  type="submit"
                  disabled={saving || success}
                  className="px-4 py-2 bg-[#81B441] text-white rounded-md hover:bg-[#72a139] flex items-center justify-center min-w-[100px]"
                >
                  {saving ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : success ? (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Succès
                    </div>
                  ) : (
                    "Créer la session"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      {/* Animation de succès */}
      {success && (
        <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-12 w-12 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Session créée avec succès!</h2>
            <p className="text-gray-600">Redirection en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
} 