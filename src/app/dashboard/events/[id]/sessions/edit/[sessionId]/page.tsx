"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeftIcon, XMarkIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon, UsersIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { MultiSelect, Option } from "@/components/ui/multi-select";

// Types
type Session = {
  id: string;
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

// Add the Participant interface
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

export default function EditSessionPage({ params }: { params: Promise<{ id: string, sessionId: string }> }) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");

  const [formData, setFormData] = useState<Partial<Session>>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    speaker: "",
    capacity: undefined,
    format: "physique",
    banner: ""
  });

  const [loading, setLoading] = useState(true);
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

  // Extraire les paramètres une fois au chargement du composant
  useEffect(() => {
    if (params && params.id && params.sessionId) {
      setEventId(params.id);
      setSessionId(params.sessionId);
    }
  }, [params]);

  // Add useEffect to fetch participants
  useEffect(() => {
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
  }, [eventId]);
  
  // Fetch event dates
  useEffect(() => {
    const fetchEventDates = async () => {
      if (!eventId) return;
      
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event dates");
        }
        
        const eventData = await response.json();
        
        // Convert dates to YYYY-MM-DD format for date inputs
        const startDate = new Date(eventData.startDate);
        const endDate = new Date(eventData.endDate);
        
        setEventDates({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
      } catch (error) {
        console.error("Error fetching event dates:", error);
      }
    };
    
    fetchEventDates();
  }, [eventId]);

  // Fetch session data (existing effect)
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch session data");
        }
        
        const sessionData = await response.json();
        
        // Parse speaker IDs from comma-separated string
        if (sessionData.speaker) {
          const speakerIds = sessionData.speaker.split(',').map((id: string) => id.trim());
          setSelectedSpeakers(speakerIds);
        }
        
        setFormData(sessionData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching session:", error);
        toast.error("Failed to load session data");
        setLoading(false);
      }
    };

    if (eventId && sessionId) {
      fetchSessionData();
    }
  }, [eventId, sessionId, participants]);

  // Gérer le changement dans les inputs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value ? parseInt(value) : undefined
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
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

      // Update the session
      const response = await fetch(`/api/events/${eventId}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formDataToSend)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update session");
      }
      
      setSuccess(true);
      toast.success("Session updated successfully!");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/events/${eventId}/sessions`);
      }, 2000);
      
    } catch (error) {
      console.error("Error updating session:", error);
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EventSidebar eventId={eventId} />
        <main className="flex-1 p-6 ml-0 md:ml-64 transition-all duration-300 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81B441]"></div>
            <p className="mt-4 text-gray-500">Chargement de la session...</p>
          </div>
        </main>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Modifier la session</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              {/* Titre */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nom de la session"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Description de la session (optionnel)"
                />
              </div>
              
              {/* Dates et heures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date || ''}
                      onChange={handleChange}
                      min={eventDates?.startDate}
                      max={eventDates?.endDate}
                      className={`w-full pl-10 p-2 border rounded-md ${errors.start_date ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date || ''}
                      onChange={handleChange}
                      min={formData.start_date || eventDates?.startDate}
                      max={eventDates?.endDate}
                      className={`w-full pl-10 p-2 border rounded-md ${errors.end_date ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de début <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={formData.start_time || ''}
                      onChange={handleChange}
                      className={`w-full pl-10 p-2 border rounded-md ${errors.start_time ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {errors.start_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de fin <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      value={formData.end_time || ''}
                      onChange={handleChange}
                      className={`w-full pl-10 p-2 border rounded-md ${errors.end_time ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {errors.end_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
                  )}
                </div>
              </div>
              
              {/* Location */}
              <div className="mb-4">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                    placeholder="Salle, amphithéâtre, etc."
                  />
                </div>
              </div>
              
              {/* Speaker */}
              <div className="mb-4">
                <label htmlFor="speaker" className="block text-sm font-medium text-gray-700 mb-1">
                  Intervenant
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
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
              </div>
              
              {/* Capacity */}
              <div className="mb-4">
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacité
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UsersIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                    placeholder="Nombre de places disponibles"
                  />
                </div>
              </div>
              
              {/* Format */}
              <div className="mb-4">
                <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  id="format"
                  name="format"
                  value={formData.format || 'physique'}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {formatOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Banner upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bannière
                </label>
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
                <button
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
                    "Enregistrer"
                  )}
                </button>
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Session modifiée avec succès!</h2>
            <p className="text-gray-600">Redirection en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
} 