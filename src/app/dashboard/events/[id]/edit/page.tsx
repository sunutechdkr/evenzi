"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ArrowLeftIcon, 
  PhotoIcon,
} from "@heroicons/react/24/outline";

// Type d'événement
type Event = {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string;
  registrations?: number;
  banner?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  sector?: string;
  type?: string;
  format?: string;
  timezone?: string;
  startTime?: string;
  endTime?: string;
  videoUrl?: string;
  supportEmail?: string;
  logo?: string;
};

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id || '';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventData, setEventData] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  
  // Options pour les sélecteurs
  const sectors = ["Technologie", "Santé", "Éducation", "Finance", "Art et Culture", "Sport", "Environnement"];
  const types = ["Conférence", "Séminaire", "Workshop", "Exposition", "Gala", "Salon", "Forum", "Festival"];
  const formats = ["Présentiel", "En ligne", "Hybride"];
  
  // Charger les données de l'événement
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération de l'événement: ${response.status}`);
        }
        
        const data = await response.json();
        setEventData(data);
        setFormData(data);
        setPreviewImage(data.banner || null);
        setLogoPreview(data.logo || null);
        
        // Calculer le nombre de mots dans la description
        const words = data.description ? data.description.trim().split(/\s+/).length : 0;
        setWordCount(words);
      } catch (error) {
        setError("Impossible de charger l'événement. Veuillez réessayer.");
        console.error("Erreur lors du chargement de l'événement:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);
  
  // Détecter si l'écran est de taille mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Vérifier initialement
    checkMobile();
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkMobile);
    
    // Nettoyer
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (formData) {
      // Générer automatiquement le slug à partir du nom
      if (name === 'name') {
        const slug = value
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-');
        
        setFormData({
          ...formData,
          [name]: value,
          slug: slug
        });
      } else if (name === 'description') {
        // Compter les mots pour la description
        const words = value.trim() ? value.trim().split(/\s+/).length : 0;
        setWordCount(words);
        setFormData({
          ...formData,
          [name]: value
        });
      } else {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    }
  };
  
  // Gérer le changement d'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setPreviewImage(event.target.result as string);
          setFormData(prevData => prevData ? { ...prevData, banner: event.target.result as string } : null);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Gérer le changement de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setLogoPreview(event.target.result as string);
          setFormData(prevData => prevData ? { ...prevData, logo: event.target.result as string } : null);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Enregistrer les modifications
  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) {
      setError("Aucune donnée à enregistrer");
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Préparer les dates pour l'API
      let startDateFormatted = formData.startDate;
      let endDateFormatted = formData.endDate;
      
      if (typeof formData.startDate === 'object' && formData.startDate instanceof Date) {
        startDateFormatted = format(formData.startDate, 'yyyy-MM-dd');
      }
      
      if (typeof formData.endDate === 'object' && formData.endDate instanceof Date) {
        endDateFormatted = format(formData.endDate, 'yyyy-MM-dd');
      }
      
      // Préparer les données à sauvegarder
      const eventToSave = {
        ...formData,
        startDate: startDateFormatted,
        endDate: endDateFormatted
      };
      
      // Appel à l'API
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventToSave),
        credentials: 'include', // Important: inclure les cookies pour l'authentification
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour de l'événement");
      }
      
      const responseData = await response.json();
      setEventData(responseData);
      setFormData(responseData);
      setSuccessMessage("Événement mis à jour avec succès");
      
      // Rediriger vers la page des détails après 1.5 secondes
      setTimeout(() => {
        router.push(`/dashboard/events/${eventId}`);
      }, 1500);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="dashboard-container min-h-screen">
        <EventSidebar 
          eventId={eventId} 
          onExpandChange={(expanded) => setSidebarExpanded(expanded)}
        />
        <div 
          className={`dashboard-content bg-gray-50 ${!sidebarExpanded ? 'dashboard-content-collapsed' : ''}`}
          style={{ 
            marginLeft: isMobile ? 0 : sidebarExpanded ? '16rem' : 0
          }}
        >
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#81B441]"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-container min-h-screen">
      <EventSidebar 
        eventId={eventId} 
        onExpandChange={(expanded) => setSidebarExpanded(expanded)}
      />
      <div 
        className={`dashboard-content bg-gray-50 ${!sidebarExpanded ? 'dashboard-content-collapsed' : ''}`}
        style={{ 
          marginLeft: isMobile ? 0 : sidebarExpanded ? '16rem' : 0,
          transition: 'margin 0.3s ease-in-out'
        }}
      >
        {/* En-tête avec retour */}
        <div className="p-4 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/events/${eventId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span>Retour à l&apos;événement</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Modifier l&apos;événement</h1>
          </div>
        </div>
        
        {/* Formulaire de modification */}
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
              <p className="font-medium">Erreur</p>
              <p>{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">
              <p className="font-medium">Succès</p>
              <p>{successMessage}</p>
            </div>
          )}
          
          <form onSubmit={saveChanges} className="space-y-8">
            {/* Informations générales */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l&apos;événement *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData?.name || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData?.slug || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Cet identifiant sera utilisé dans l&apos;URL de l&apos;événement
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData?.description || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
                <p className="mt-1 text-xs text-gray-500">
                  {wordCount} mot{wordCount !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData?.location || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            {/* Dates et heures */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dates et heures</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData?.startDate instanceof Date 
                      ? format(formData.startDate, 'yyyy-MM-dd')
                      : typeof formData?.startDate === 'string' 
                        ? formData.startDate.substring(0, 10) 
                        : ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData?.endDate instanceof Date 
                      ? format(formData.endDate, 'yyyy-MM-dd')
                      : typeof formData?.endDate === 'string' 
                        ? formData.endDate.substring(0, 10) 
                        : ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData?.startTime || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData?.endTime || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Catégorisation */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Catégorisation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
                    Secteur
                  </label>
                  <select
                    id="sector"
                    name="sector"
                    value={formData?.sector || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Sélectionner...</option>
                    {sectors.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData?.type || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Sélectionner...</option>
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    id="format"
                    name="format"
                    value={formData?.format || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Sélectionner...</option>
                    {formats.map(format => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Média et visuel */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Média et visuel</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bannière de l&apos;événement
                  </label>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-full h-40 bg-gray-100 border border-gray-300 rounded-md overflow-hidden">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt="Aperçu de la bannière" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <PhotoIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="banner"
                      name="banner"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-[#81B441] file:text-white
                        hover:file:bg-[#6a9636]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo de l&apos;événement
                  </label>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-40 h-40 bg-gray-100 border border-gray-300 rounded-md overflow-hidden">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Aperçu du logo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <PhotoIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="logo"
                      name="logo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-[#81B441] file:text-white
                        hover:file:bg-[#6a9636]"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la vidéo
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  value={formData?.videoUrl || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>
            
            {/* Contact et support */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contact et support</h2>
              
              <div>
                <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email de support
                </label>
                <input
                  type="email"
                  id="supportEmail"
                  name="supportEmail"
                  value={formData?.supportEmail || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="support@monevenement.com"
                />
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="flex justify-end space-x-4">
              <Link 
                href={`/dashboard/events/${eventId}`}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </Link>
              
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#81B441] hover:bg-[#6a9636] text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Enregistrement...
                  </>
                ) : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 