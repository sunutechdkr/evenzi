"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  IdentificationIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "react-hot-toast";

// Types
type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  location: string;
  banner?: string;
  slug?: string;
};

type Badge = {
  id: string;
  name: string;
  canvasData: string;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function EventBadgesPage({ params }: { params: Promise<{ id: string }> }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  
  const eventId = params.id;

  // Récupérer les détails de l'événement et les badges au chargement
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les détails de l'événement
        const eventResponse = await fetch(`/api/events/${eventId}`);
        if (!eventResponse.ok) throw new Error('Erreur lors de la récupération des détails de l\'événement');
        const eventData = await eventResponse.json();
        setEvent(eventData);

        // Récupérer les badges
        const badgesResponse = await fetch(`/api/events/${eventId}/badges`);
        if (badgesResponse.ok) {
          const badgesData = await badgesResponse.json();
          setBadges(badgesData);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  // Fonction pour exporter tous les badges au format PDF
  const handleExportBadges = () => {
    // Préparation de l'URL de l'API d'exportation
    const exportUrl = `/api/events/${eventId}/export/badges`;
    
    // Afficher un loading toast
    toast.loading('Exportation des badges en cours...', { id: 'export-toast' });

    // Ouvrir l'URL dans un nouvel onglet ou télécharger directement le fichier
    const downloadLink = document.createElement('a');
    downloadLink.href = exportUrl;
    downloadLink.target = '_blank';
    downloadLink.download = 'badges.pdf';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Mettre à jour le toast pour indiquer le succès
    setTimeout(() => {
      toast.success('Les badges ont été exportés avec succès', { id: 'export-toast' });
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EventSidebar eventId={eventId} />
      
      <main className="flex-1 p-6 ml-0 md:ml-64 transition-all duration-300 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header with back button and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des badges</h1>
              <p className="mt-1 text-sm text-gray-500">
                Créez et personnalisez les badges pour votre événement {event?.name || ''}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <button
                onClick={handleExportBadges}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Exporter tous les badges (PDF)
              </button>
              
              <Link
                href={`/dashboard/events/${eventId}/badges/create`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#81B441] hover:bg-[#72a139] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441]"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Créer un modèle de badge
              </Link>
            </div>
          </div>
          
          {/* Content */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#81B441] rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500">Chargement des badges...</p>
              </div>
            ) : badges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map((badge) => (
                  <div key={badge.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-40 bg-gray-100 border-b flex items-center justify-center">
                      {/* Prévisualisation du badge */}
                      <div className="text-center text-gray-500">
                        <IdentificationIcon className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                        <span>Aperçu du modèle</span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900">{badge.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Dernière modification: {new Date(badge.updatedAt).toLocaleDateString()}
                      </p>
                      
                      <div className="mt-4 flex justify-between">
                        <div className="flex space-x-2">
                          <Link 
                            href={`/dashboard/events/${eventId}/badges/${badge.id}/edit`}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <PencilIcon className="w-3.5 h-3.5 mr-1" />
                            Modifier
                          </Link>
                          
                          <button
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <DocumentDuplicateIcon className="w-3.5 h-3.5 mr-1" />
                            Dupliquer
                          </button>
                        </div>
                        
                        <button
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-red-200 text-red-600 bg-white hover:bg-red-50"
                        >
                          <TrashIcon className="w-3.5 h-3.5 mr-1" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <IdentificationIcon className="w-16 h-16 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun modèle de badge</h3>
                <p className="mt-1 text-sm text-gray-500">Commencez par créer un modèle de badge pour votre événement.</p>
                <div className="mt-6">
                  <Link
                    href={`/dashboard/events/${eventId}/badges/create`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#81B441] hover:bg-[#72a139]"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Créer un modèle de badge
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
 