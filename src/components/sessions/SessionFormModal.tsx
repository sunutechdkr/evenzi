"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { XMarkIcon, MapPinIcon, UserIcon, UsersIcon, ChevronDownIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
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
  video_url?: string;
};

type SessionFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  session?: Session;
  eventId: string;
  onSuccess: () => void;
};

// Fonction utilitaire pour valider les URLs
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const formatOptions = [
  { value: "physique", label: "Physique", description: "Session en présentiel" },
  { value: "visioconference", label: "Visioconférence", description: "Session en ligne" },
  { value: "table-ronde", label: "Table-ronde", description: "Discussion en groupe" },
  { value: "lien-video", label: "Lien vidéo", description: "Session avec vidéo externe" },
];

// Add a type for participants
interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
}

export default function SessionFormModal({
  isOpen,
  onClose,
  session,
  eventId,
  onSuccess,
}: SessionFormModalProps) {
  const [formData, setFormData] = useState<Partial<Session>>(
    session || {
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
      banner: "",
      video_url: ""
    }
  );

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [eventDates, setEventDates] = useState<{startDate: string, endDate: string} | null>(null);
  
  // États pour la bannière
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  // Référence pour l'input file de la bannière
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // New state for participants and selected speakers
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

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

  // État pour les dates sélectionnées avec DatePicker
  const [startDate, setStartDate] = useState<Date | undefined>(
    session?.start_date ? new Date(session.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    session?.end_date ? new Date(session.end_date) : undefined
  );

  // Mettre à jour formData lorsque les dates changent
  useEffect(() => {
    if (startDate) {
      const formattedDate = startDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, start_date: formattedDate }));
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      const formattedDate = endDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, end_date: formattedDate }));
    }
  }, [endDate]);

  // Récupérer les dates de l'événement
  useEffect(() => {
    const fetchEventDates = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération de l'événement");
        const data = await response.json();
        
        // Convertir les dates au format YYYY-MM-DD pour les inputs date
        const eventStartDate = new Date(data.startDate);
        const eventEndDate = new Date(data.endDate);
        
        setEventDates({
          startDate: eventStartDate.toISOString().split('T')[0],
          endDate: eventEndDate.toISOString().split('T')[0]
        });
        
        // Si c'est une nouvelle session, initialiser les dates avec la date de début de l'événement
        if (!session && !startDate) {
          setStartDate(eventStartDate);
          setEndDate(eventStartDate);
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de récupérer les informations de l'événement");
      }
    };

    if (isOpen) {
      fetchEventDates();
      fetchParticipants();
      fetchLocations();
    }
  }, [isOpen, eventId, session, startDate]);

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

  // Initialiser la prévisualisation de la bannière si elle existe déjà
  useEffect(() => {
    if (session?.banner) {
      setBannerPreview(session.banner);
    }
    if (session?.location) {
      setSelectedLocation(session.location);
    }
  }, [session]);

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

  // New useEffect to fetch participants when modal opens
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!isOpen || !eventId) return;
      
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
  }, [isOpen, eventId]);

  // Set initial selected speakers from the session speaker string
  useEffect(() => {
    if (session?.speaker && participants.length > 0) {
      // If speaker field contains comma-separated IDs
      const speakerIds = session.speaker.split(',').map(id => id.trim());
      const validIds = speakerIds.filter(id => 
        participants.some(p => p.id === id)
      );
      setSelectedSpeakers(validIds);
    }
  }, [session, participants]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) {
      newErrors.title = "Le titre est obligatoire";
    }

    if (!formData.start_date) {
      newErrors.start_date = "La date de début est obligatoire";
    }

    if (!formData.end_date) {
      newErrors.end_date = "La date de fin est obligatoire";
    }

    if (!formData.start_time) {
      newErrors.start_time = "L'heure de début est obligatoire";
    }

    if (!formData.end_time) {
      newErrors.end_time = "L'heure de fin est obligatoire";
    }

    // Vérifier si un lien vidéo est requis
    if (formData.format === "video" && !formData.video_url) {
      newErrors.video_url = "Le lien vidéo est obligatoire pour ce format";
    }

    // Valider le format d'URL du lien vidéo s'il est présent
    if (formData.video_url && !isValidUrl(formData.video_url)) {
      newErrors.video_url = "Le lien vidéo doit être une URL valide (commençant par http:// ou https://)";
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (startDate > endDate) {
        newErrors.end_date = "La date de fin doit être égale ou postérieure à la date de début";
      }
    }

    if (
      formData.start_date === formData.end_date &&
      formData.start_time &&
      formData.end_time &&
      formData.start_time > formData.end_time
    ) {
      newErrors.end_time = "L'heure de fin doit être postérieure à l'heure de début";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form (unchanged)
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
    
    setLoading(true);
    
    try {
      // Update formData with selectedSpeakers joined as a string
      const speakerString = selectedSpeakers.join(',');
      const updatedFormData = {
        ...formData,
        speaker: speakerString
      };
      
      const method = session ? "PUT" : "POST";
      const url = session
        ? `/api/events/${eventId}/sessions/${session.id}`
        : `/api/events/${eventId}/sessions`;
      
      // Upload the banner image if changed
      if (bannerPreview) {
        // File upload logic (unchanged)
        // ...
      }
      
      // Submit the form data
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFormData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save session");
      }
      
      toast.success(session ? "Session mise à jour" : "Session créée");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Function to get format label
  const getFormatLabel = (value: string | undefined) => {
    if (!value) return "Choisir un format";
    const option = formatOptions.find(opt => opt.value === value);
    return option ? option.label : "Format inconnu";
  };

  // Transform participants to options for MultiSelect
  const speakerOptions: Option[] = participants
    .filter(p => p.type === 'SPEAKER' || p.type === 'PARTICIPANT')
    .map(p => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName}`
    }));

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
                <div className="bg-[#81B441] py-4 px-6">
                  <div className="flex items-center justify-between">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-white"
                    >
                      {session ? "Modifier la session" : "Ajouter une session"}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md text-white hover:text-[#ecf3e4] focus:outline-none"
                      onClick={onClose}
                    >
                      <span className="sr-only">Fermer</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Titre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      className={`mt-1 block w-full rounded-md ${
                        errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#81B441] focus:ring-[#81B441]'
                      } shadow-sm sm:text-sm h-11 placeholder-gray-400`}
                      value={formData.title || ""}
                      placeholder="Titre de la session"
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="format"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Format <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Menu
                        as="div"
                        className="relative w-full text-left"
                      >
                        <Menu.Button
                          className={`flex w-full items-center justify-between rounded-md ${
                            errors.format ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border border-gray-300 focus:border-[#81B441] focus:ring-[#81B441]'
                          } px-4 py-2 text-left text-sm h-11`}
                        >
                          <span>{formData.format ? getFormatLabel(formData.format) : "Sélectionner un format"}</span>
                          <ChevronDownIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  className={`${
                                    active ? "bg-[#81B441] text-white" : "text-gray-900"
                                  } block w-full px-4 py-2 text-left`}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      format: "physical",
                                    })
                                  }
                                >
                                  Physique
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  className={`${
                                    active ? "bg-[#81B441] text-white" : "text-gray-900"
                                  } block w-full px-4 py-2 text-left`}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      format: "virtual",
                                    })
                                  }
                                >
                                  Visioconférence
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  className={`${
                                    active ? "bg-[#81B441] text-white" : "text-gray-900"
                                  } block w-full px-4 py-2 text-left`}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      format: "roundtable",
                                    })
                                  }
                                >
                                  Table-ronde
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  className={`${
                                    active ? "bg-[#81B441] text-white" : "text-gray-900"
                                  } block w-full px-4 py-2 text-left`}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      format: "video",
                                    })
                                  }
                                >
                                  Lien vidéo
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#81B441] focus:ring-[#81B441] sm:text-sm placeholder-gray-400"
                      value={formData.description || ""}
                      placeholder="Description de la session"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <DatePicker
                      date={startDate}
                      setDate={setStartDate}
                      minDate={eventDates ? new Date(eventDates.startDate) : undefined}
                      maxDate={eventDates ? new Date(eventDates.endDate) : undefined}
                      error={errors.start_date}
                      required={true}
                      label="Date de début"
                    />

                    <DatePicker
                      date={endDate}
                      setDate={setEndDate}
                      minDate={startDate || (eventDates ? new Date(eventDates.startDate) : undefined)}
                      maxDate={eventDates ? new Date(eventDates.endDate) : undefined}
                      error={errors.end_date}
                      required={true}
                      label="Date de fin"
                    />
                  </div>
                  
                  {eventDates && (
                    <p className="mt-1 text-xs text-gray-500 text-left">
                      Période de l&apos;événement: {new Date(eventDates.startDate).toLocaleDateString()} - {new Date(eventDates.endDate).toLocaleDateString()}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TimePicker
                      value={formData.start_time || ""}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      label="Heure de début"
                      error={errors.start_time}
                    />

                    <TimePicker
                      value={formData.end_time || ""}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                      label="Heure de fin"
                      error={errors.end_time}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Lieu
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Select
                        value={selectedLocation}
                        onValueChange={(value) => {
                          setSelectedLocation(value);
                          setFormData({ ...formData, location: value });
                        }}
                      >
                        <SelectTrigger className="pl-10 h-11">
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
                  </div>

                  {/* Champ lien vidéo affiché conditionnellement pour les formats virtuel et lien vidéo */}
                  {(formData.format === "virtual" || formData.format === "video") && (
                    <div>
                      <label
                        htmlFor="video_url"
                        className="block text-sm font-medium text-gray-700 text-left"
                      >
                        Lien vidéo {(formData.format === "video") && <span className="text-red-500">*</span>}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="url"
                          name="video_url"
                          id="video_url"
                          className={`pl-10 block w-full rounded-md ${
                            formData.format === "video" && !formData.video_url ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#81B441] focus:ring-[#81B441]'
                          } sm:text-sm h-11 placeholder-gray-400`}
                          value={formData.video_url || ""}
                          placeholder={formData.format === "virtual" ? "Lien Zoom, Teams, etc." : "Lien YouTube, Vimeo, etc."}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              video_url: e.target.value,
                            })
                          }
                          required={formData.format === "video"}
                        />
                      </div>
                      {formData.format === "video" && !formData.video_url && errors.video_url && (
                        <p className="mt-1 text-sm text-red-600">{errors.video_url}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 text-left">
                        {formData.format === "virtual" 
                          ? "Lien de la visioconférence (Zoom, Teams, Google Meet, etc.)" 
                          : "Lien de la vidéo (YouTube, Vimeo, etc.)"}
                      </p>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="speaker"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Intervenant
                    </label>
                    <div className="mt-1 relative">
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

                  <div>
                    <label
                      htmlFor="capacity"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Capacité
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UsersIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="capacity"
                        id="capacity"
                        min="0"
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#81B441] focus:ring-[#81B441] sm:text-sm h-11 placeholder-gray-400"
                        value={formData.capacity || ""}
                        placeholder="Capacité maximale"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            capacity: parseInt(e.target.value) || undefined,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Bannière de la session */}
                  <div className="mt-4">
                    <label
                      htmlFor="banner"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Bannière
                    </label>
                    <div className="mt-1">
                      {bannerPreview ? (
                        <div className="relative">
                          <img
                            src={bannerPreview}
                            alt="Aperçu de la bannière"
                            className="h-32 w-full rounded-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveBanner}
                            className="absolute top-2 right-2 rounded-full bg-white p-1 text-gray-500 shadow-sm hover:text-[#81B441] focus:outline-none"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => bannerInputRef.current?.click()}
                          className="flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-[#81B441] bg-gray-50 hover:bg-[#f5f9f0]"
                        >
                          <div className="text-center">
                            <ArrowUpTrayIcon
                              className="mx-auto h-8 w-8 text-gray-400 hover:text-[#81B441]"
                              aria-hidden="true"
                            />
                            <span className="mt-2 block text-sm text-gray-500">
                              Cliquez pour ajouter une bannière
                            </span>
                            <span className="mt-1 block text-xs text-gray-400">
                              PNG, JPG, GIF (max 2Mo)
                            </span>
                          </div>
                        </div>
                      )}
                      <input
                        ref={bannerInputRef}
                        type="file"
                        id="banner"
                        name="banner"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBannerChange}
                      />
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-[#81B441] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#71a137] focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="ml-2">Chargement...</span>
                        </span>
                      ) : session ? "Mettre à jour" : "Créer"}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-[#f5f9f0] focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                      onClick={onClose}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 