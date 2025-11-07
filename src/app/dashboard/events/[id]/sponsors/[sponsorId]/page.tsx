"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeftIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

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
};

export default function SponsorDetailsPage({ params }: { params: Promise<{ id: string, sponsorId: string }> }) {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const router = useRouter();
  const eventId = params.id;
  const sponsorId = params.sponsorId;

  // Fetch sponsor data on load
  useEffect(() => {
    fetchSponsorDetails();
  }, []);

  /**
   * Récupère les détails du sponsor
   */
  const fetchSponsorDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/sponsors/${sponsorId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des détails du sponsor');
      
      const data = await response.json();
      setSponsor(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les détails du sponsor');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime un sponsor
   */
  const handleDeleteSponsor = async () => {
    setProcessing(true);
    
    try {
      const response = await fetch(`/api/events/${eventId}/sponsors/${sponsorId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erreur lors de la suppression du sponsor');
      
      toast.success('Sponsor supprimé avec succès');
      router.push(`/dashboard/events/${eventId}/sponsors`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de supprimer le sponsor');
      setProcessing(false);
    }
  };

  /**
   * Retourne la classe CSS pour le badge de niveau
   */
  const getLevelBadgeClass = (level: SponsorLevel) => {
    switch(level) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-800';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      case 'SILVER': return 'bg-gray-100 text-gray-800';
      case 'BRONZE': return 'bg-amber-100 text-amber-800';
      case 'PARTNER': return 'bg-blue-100 text-blue-800';
      case 'MEDIA': return 'bg-green-100 text-green-800';
      case 'OTHER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EventSidebar eventId={eventId} />
      
      <main className="flex-1 p-6 ml-0 md:ml-64 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6">
            <Link 
              href={`/dashboard/events/${eventId}/sponsors`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" />
              Retour aux sponsors
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Détails du sponsor</h1>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#81B441] mx-auto"></div>
              <p className="mt-4 text-gray-500">Chargement des détails...</p>
            </div>
          ) : sponsor ? (
            <>
              {/* Sponsor details card */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Header */}
                <div className="relative">
                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex space-x-2 z-10">
                    <Link
                      href={`/dashboard/events/${eventId}/sponsors/edit?id=${sponsorId}`}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-full text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-full text-gray-500 hover:text-red-700 bg-white hover:bg-gray-50 shadow-sm"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Logo */}
                  <div className="h-48 bg-gray-50 flex items-center justify-center p-6 border-b">
                    {sponsor.logo ? (
                      <img 
                        src={sponsor.logo} 
                        alt={sponsor.name} 
                        className="max-h-36 max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-24 w-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xl">Logo</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{sponsor.name}</h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeClass(sponsor.level)}`}>
                      {getLevelText(sponsor.level)}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    {sponsor.visible ? (
                      <div className="flex items-center text-green-600">
                        <EyeIcon className="h-5 w-5 mr-2" />
                        <span>Visible publiquement</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <EyeSlashIcon className="h-5 w-5 mr-2" />
                        <span>Non visible</span>
                      </div>
                    )}
                  </div>
                  
                  {sponsor.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{sponsor.description}</p>
                      </div>
                    </div>
                  )}
                  
                  {sponsor.website && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Site web</h3>
                      <a 
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 text-[#81B441] hover:text-[#72a139]"
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Visiter le site web
                      </a>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Ajouté le</h3>
                      <p className="text-gray-700">
                        {new Date(sponsor.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Dernière modification</h3>
                      <p className="text-gray-700">
                        {new Date(sponsor.updatedAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-red-500">Ce sponsor n&apos;existe pas ou a été supprimé.</p>
              <Link
                href={`/dashboard/events/${eventId}/sponsors`}
                className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#81B441] hover:bg-[#72a139]"
              >
                Retour à la liste
              </Link>
            </div>
          )}
        </div>
      </main>
      
      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-red-100 rounded-full p-3">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                Supprimer ce sponsor ?
              </h3>
              <p className="text-center text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer le sponsor &quot;{sponsor?.name}&quot; ? Cette action est irréversible.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={processing}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteSponsor}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression...
                    </>
                  ) : (
                    <>Supprimer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}