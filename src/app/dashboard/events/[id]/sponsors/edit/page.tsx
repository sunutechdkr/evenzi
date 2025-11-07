"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeftIcon,
  XMarkIcon,
  LinkIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

// Types pour les sponsors
type SponsorLevel = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTNER' | 'MEDIA' | 'OTHER';

export default function EditSponsorPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const sponsorId = searchParams.get('id');
  const router = useRouter();
  const eventId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sponsor, setSponsor] = useState<{
    name: string;
    description: string;
    website: string;
    level: SponsorLevel;
    visible: boolean;
  }>({
    name: '',
    description: '',
    website: '',
    level: 'GOLD',
    visible: true
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Fetch sponsor data on load
  useEffect(() => {
    if (sponsorId) {
      fetchSponsorDetails();
    } else {
      setLoading(false);
    }
  }, [sponsorId]);

  /**
   * Récupère les détails du sponsor
   */
  const fetchSponsorDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/sponsors/${sponsorId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des détails du sponsor');
      
      const data = await response.json();
      setSponsor({
        name: data.name,
        description: data.description || '',
        website: data.website || '',
        level: data.level,
        visible: data.visible
      });
      
      if (data.logo) {
        setLogoPreview(data.logo);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les détails du sponsor');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère les changements dans le formulaire
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'visible' && type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setSponsor({
        ...sponsor,
        [name]: target.checked
      });
    } else {
      setSponsor({
        ...sponsor,
        [name]: value
      });
    }
  };

  /**
   * Gère l'upload du logo
   */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }
    
    // Vérifier la taille du fichier (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('L\'image est trop volumineuse. Taille maximale: 2MB');
      return;
    }
    
    setLogoFile(file);
    
    // Créer une URL pour l'aperçu
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  /**
   * Met à jour un sponsor existant
   */
  const handleUpdateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Construire le FormData
      const formData = new FormData();
      formData.append('name', sponsor.name.trim());
      formData.append('description', sponsor.description || '');
      formData.append('website', sponsor.website || '');
      formData.append('level', sponsor.level);
      formData.append('visible', String(sponsor.visible));
      
      if (logoFile) {
        console.log("Ajout du logo:", logoFile.name);
        formData.append('logo', logoFile);
      }
      
      // Déterminer l'URL et la méthode
      const url = sponsorId 
        ? `/api/events/${eventId}/sponsors/${sponsorId}` 
        : `/api/events/${eventId}/sponsors`;
      
      const method = sponsorId ? 'PUT' : 'POST';
      
      console.log("Envoi de la requête:", method, url);
      console.log("Données:", {
        name: sponsor.name,
        level: sponsor.level,
        visible: sponsor.visible
      });
      
      const response = await fetch(url, {
        method,
        body: formData
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Erreur de réponse:", response.status, responseData);
        throw new Error(responseData.message || `Erreur ${response.status}`);
      }
      
      console.log("Réponse réussie:", responseData);
      toast.success(`Sponsor ${sponsorId ? 'mis à jour' : 'créé'} avec succès`);
      
      // Afficher l'animation de succès avant de rediriger
      setSuccess(true);
      
      // Attendre que l'animation de succès se termine avant de rediriger
      setTimeout(() => {
        if (sponsorId) {
          router.push(`/dashboard/events/${eventId}/sponsors/${sponsorId}`);
        } else {
          router.push(`/dashboard/events/${eventId}/sponsors`);
        }
      }, 1500);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EventSidebar eventId={eventId} />
      
      <main className="flex-1 p-6 ml-0 md:ml-64 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6">
            <Link 
              href={sponsorId ? `/dashboard/events/${eventId}/sponsors/${sponsorId}` : `/dashboard/events/${eventId}/sponsors`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" />
              {sponsorId ? 'Retour aux détails du sponsor' : 'Retour aux sponsors'}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {sponsorId ? 'Modifier le sponsor' : 'Ajouter un sponsor'}
            </h1>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#81B441] mx-auto"></div>
              <p className="mt-4 text-gray-500">Chargement des détails...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#81B441] to-[#6a9636] text-white">
                <h2 className="text-xl font-bold">
                  {sponsorId ? 'Informations du sponsor' : 'Nouveau sponsor'}
                </h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleUpdateSponsor}>
                  {/* Logo upload */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Logo
                      </label>
                    </div>
                    
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#81B441] transition-colors"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {logoPreview ? (
                        <div className="relative w-full h-32 flex items-center justify-center">
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogoFile(null);
                              setLogoPreview('');
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Cliquez pour ajouter un logo</span>
                        </>
                      )}
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Formats recommandés: PNG, JPG. Max 2 MB.</p>
                  </div>
                  
                  {/* Nom */}
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500">*</span> Nom du sponsor
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent"
                      value={sponsor.name}
                      onChange={handleInputChange}
                      placeholder="Nom de l'entreprise ou de l'organisation"
                    />
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent"
                      value={sponsor.description}
                      onChange={handleInputChange}
                      placeholder="Description du sponsor (optionnel)"
                    />
                  </div>
                  
                  {/* Site web */}
                  <div className="mb-4">
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                      Site web
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent"
                        value={sponsor.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  
                  {/* Niveau de sponsor */}
                  <div className="mb-4">
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500">*</span> Niveau de sponsor
                    </label>
                    <select
                      id="level"
                      name="level"
                      required
                      className="w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent"
                      value={sponsor.level}
                      onChange={handleInputChange}
                    >
                      <option value="PLATINUM">Platinum</option>
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                      <option value="BRONZE">Bronze</option>
                      <option value="PARTNER">Partenaire</option>
                      <option value="MEDIA">Media</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                  
                  {/* Visibilité */}
                  <div className="flex items-center mb-6">
                    <input
                      type="checkbox"
                      id="visible"
                      name="visible"
                      className="h-4 w-4 text-[#81B441] focus:ring-[#81B441] border-gray-300 rounded"
                      checked={sponsor.visible}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="visible" className="ml-2 block text-sm text-gray-700">
                      Afficher publiquement ce sponsor
                    </label>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex justify-end gap-3 mt-6">
                    <Link
                      href={sponsorId ? `/dashboard/events/${eventId}/sponsors/${sponsorId}` : `/dashboard/events/${eventId}/sponsors`}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#81B441] hover:bg-[#72a137] text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441] flex items-center"
                      disabled={saving || success}
                    >
                      {saving && !success ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enregistrement...
                        </>
                      ) : success ? (
                        <>
                          <svg className="h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Succès !
                        </>
                      ) : (
                        <>
                          {sponsorId ? 'Mettre à jour' : 'Ajouter'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Animation de succès en plein écran qui apparaît lorsque la modification est réussie */}
      {success && (
        <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                <svg className="h-16 w-16 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">
              {sponsorId ? 'Sponsor mis à jour avec succès !' : 'Sponsor créé avec succès !'}
            </h2>
            <p className="mt-2 text-gray-600 animate-pulse">Redirection en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
} 