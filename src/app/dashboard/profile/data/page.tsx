'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Database,
  Download,
  Trash2,
  Loader2,
  FileText,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Exporter les données
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Simuler l'export (à implémenter avec une vraie API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dans une vraie implémentation, vous créeriez un fichier JSON à télécharger
      const userData = {
        profile: session?.user,
        exportDate: new Date().toISOString(),
        format: 'JSON'
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evenzi-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Vos données ont été exportées !');
    } catch (error) {
      toast.error('Erreur lors de l\'export des données');
    } finally {
      setIsExporting(false);
    }
  };

  // Supprimer le compte (simulation)
  const handleDeleteAccount = () => {
    toast.error('Cette fonctionnalité nécessite une confirmation par email. Contactez le support.');
    setShowDeleteDialog(false);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#81B441]" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-[#81B441]"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Titre de la page */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-[#81B441]/10 rounded-lg">
              <Database className="h-6 w-6 text-[#81B441]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Données et Stockage
            </h1>
          </div>
          <p className="text-gray-600 ml-14">
            Gérez vos données personnelles et téléchargements
          </p>
        </div>

        {/* Exporter les données */}
        <Card className="mb-6 border-2 border-gray-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Download className="h-5 w-5 mr-2 text-[#81B441]" />
              Exporter vos données
            </CardTitle>
            <CardDescription>
              Téléchargez une copie de toutes vos données personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                L'export inclut votre profil, vos inscriptions, rendez-vous, sessions et contacts.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full bg-[#81B441] hover:bg-[#6a9636] text-white py-6 text-lg font-semibold"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Télécharger mes données
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Espace de stockage */}
        <Card className="mb-6 border-2 border-gray-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Database className="h-5 w-5 mr-2 text-[#81B441]" />
              Espace de stockage
            </CardTitle>
            <CardDescription>
              Votre utilisation de l'espace de stockage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Avatar</span>
                  <span className="font-medium">
                    {session?.user?.image ? '< 1 MB' : '0 MB'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#81B441] h-2 rounded-full" 
                    style={{ width: session?.user?.image ? '2%' : '0%' }}
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Total utilisé</span>
                  <span className="text-gray-900 font-bold">
                    {session?.user?.image ? '< 1 MB' : '0 MB'} / 50 MB
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone dangereuse */}
        <Card className="border-2 border-red-100 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-red-900">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Zone dangereuse
            </CardTitle>
            <CardDescription className="text-red-700">
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-red-200 bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                La suppression de votre compte est définitive et ne peut pas être annulée. Toutes vos données seront perdues.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="w-full py-6 text-lg font-semibold"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Supprimer mon compte
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Êtes-vous absolument sûr ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées :
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Profil utilisateur</li>
                <li>Inscriptions aux événements</li>
                <li>Rendez-vous</li>
                <li>Sessions participées</li>
                <li>Contacts et interactions</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Oui, supprimer mon compte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

