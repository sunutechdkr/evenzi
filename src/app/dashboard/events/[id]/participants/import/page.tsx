"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HomeIcon, ArrowLeftIcon, ArrowUpTrayIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function ImportParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Télécharger le modèle CSV
  const downloadCsvTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Définir les en-têtes du CSV
    const headers = ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'company', 'type'];
    
    // Créer le contenu CSV (uniquement les en-têtes)
    const csvContent = headers.join(',');
    
    // Créer un Blob avec le contenu CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Créer une URL pour le Blob
    const url = URL.createObjectURL(blob);
    
    // Créer un élément d'ancrage temporaire pour le téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'participants-template.csv');
    document.body.appendChild(link);
    
    // Déclencher le téléchargement
    link.click();
    
    // Nettoyer
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Gérer le changement de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Gérer le drag & drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Vérifier que c'est bien un fichier CSV
      if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
        toast.error('Veuillez sélectionner un fichier CSV valide');
        return;
      }
      setFile(droppedFile);
    }
  };

  // Soumettre le fichier CSV
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }
    
    // Vérifier que c'est bien un fichier CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV valide');
      return;
    }
    
    // Vérifier la taille du fichier (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Le fichier est trop volumineux. Taille maximale: 10MB');
      return;
    }
    
    setLoading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const csvContent = event.target?.result as string;
          if (!csvContent) throw new Error('Impossible de lire le fichier');
          
          // Diviser par lignes et extraire les en-têtes
          const lines = csvContent.split('\n');
          const headers = lines[0].split(',');
          
          // Vérifier que les en-têtes requis sont présents
          const requiredHeaders = ['firstName', 'lastName', 'email', 'phone', 'type'];
          const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
          
          if (missingHeaders.length > 0) {
            toast.error(`Format de CSV invalide. Colonnes manquantes: ${missingHeaders.join(', ')}`);
            setLoading(false);
            return;
          }
          
          // Afficher une notification de chargement
          toast.loading(`Importation de ${lines.length - 1} participants...`, { id: 'import-csv' });
          
          let importedCount = 0;
          let errorCount = 0;
          
          // Parser les données du CSV et importer chaque participant via l'API
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Ignorer les lignes vides
            
            const values = lines[i].split(',');
            if (values.length !== headers.length) {
              console.warn(`Ligne ${i} ignorée: nombre de colonnes incorrect`);
              continue;
            }
            
            // Créer un objet participant à partir des données CSV
            const rowData: Record<string, string> = {};
            headers.forEach((header, index) => {
              rowData[header] = values[index];
            });
            
            try {
              // Appeler l'API pour créer le participant
              const response = await fetch(`/api/events/${params.id}/registrations`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  firstName: rowData.firstName,
                  lastName: rowData.lastName,
                  email: rowData.email,
                  phone: rowData.phone,
                  jobTitle: rowData.jobTitle || '',
                  company: rowData.company || '',
                  type: (rowData.type === 'SPEAKER' ? 'SPEAKER' : 'PARTICIPANT'),
                }),
              });
              
              if (!response.ok) {
                errorCount++;
                continue;
              }
              
              importedCount++;
              
            } catch (error) {
              console.error('Erreur lors de l\'importation d\'un participant:', error);
              errorCount++;
            }
          }
          
          // Mettre à jour le toast
          toast.dismiss('import-csv');
          
          // Afficher le résultat
          if (importedCount > 0) {
            toast.success(`${importedCount} participant(s) importé(s) avec succès`);
          }
          if (errorCount > 0) {
            toast.error(`${errorCount} participant(s) n'ont pas pu être importés`);
          }
          
          // Rediriger après un court délai
          setTimeout(() => {
            router.push(`/dashboard/events/${params.id}/participants`);
          }, 2000);
          
        } catch (error) {
          console.error('Erreur lors du traitement du CSV:', error);
          toast.error('Une erreur est survenue lors du traitement du fichier CSV');
          toast.dismiss('import-csv');
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        toast.error('Erreur lors de la lecture du fichier');
        setLoading(false);
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'importation des participants');
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <EventSidebar eventId={params.id} />
      <div className="dashboard-content">
        <main className="dashboard-main">
          {/* Navigation Links */}
          <div className="flex gap-4 mb-4">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <HomeIcon className="h-5 w-5 mr-1" />
              <span>Accueil</span>
            </Link>
            <Link href={`/dashboard/events/${params.id}/participants`} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              <span>Retour aux participants</span>
            </Link>
          </div>
          
          {/* En-tête de la page */}
          <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Importer des participants</h1>
              <p className="text-sm text-gray-500 mt-1">
                Importez plusieurs participants à partir d&apos;un fichier CSV
              </p>
            </div>
          </div>
          
          {/* Formulaire d'importation */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Comment importer des participants</h3>
                    <ol className="list-decimal ml-5 text-sm text-blue-700 space-y-2">
                      <li>Téléchargez notre modèle CSV ou créez votre propre fichier</li>
                      <li>Remplissez les informations des participants (prénom, nom, email et téléphone sont obligatoires)</li>
                      <li>Enregistrez le fichier au format CSV</li>
                      <li>Téléversez le fichier ci-dessous</li>
                    </ol>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={downloadCsvTemplate}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                        Télécharger le modèle CSV
                      </button>
                    </div>
                  </div>
                  
                  {/* Zone de dépôt de fichier */}
                  <div
                    className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-lg cursor-pointer ${
                      isDragging ? 'border-[#81B441] bg-green-50' : 'border-gray-300 bg-gray-50'
                    } ${file ? 'border-green-300 bg-green-50' : ''} hover:bg-gray-100 transition-colors`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('csvUpload')?.click()}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {file ? (
                        <>
                          <ArrowUpTrayIcon className="w-10 h-10 mb-3 text-green-500" />
                          <p className="mb-2 text-sm text-gray-700">
                            <span className="font-semibold">Fichier sélectionné:</span> {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </>
                      ) : (
                        <>
                          <ArrowUpTrayIcon className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Cliquez pour importer</span> ou glissez-déposez
                          </p>
                          <p className="text-xs text-gray-500">CSV uniquement (Max 10MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      id="csvUpload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Link
                      href={`/dashboard/events/${params.id}/participants`}
                      className="btn-cancel px-4 py-2"
                    >
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      className="btn-primary px-4 py-2"
                      disabled={!file || loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Importation en cours...
                        </span>
                      ) : 'Importer les participants'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 