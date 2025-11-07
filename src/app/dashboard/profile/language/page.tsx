'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Check,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export default function LanguagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [selectedLanguage, setSelectedLanguage] = useState('fr'); // Français par défaut
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectLanguage = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setIsSaving(true);
    
    try {
      // Simuler la sauvegarde (dans une vraie app, sauvegarder dans la DB)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const language = languages.find(l => l.code === languageCode);
      toast.success(`Langue changée en ${language?.nativeName} !`);
      
      // Dans une vraie app, vous reloaderiez la page ou changeriez la locale
      // window.location.reload();
    } catch (error) {
      toast.error('Erreur lors du changement de langue');
    } finally {
      setIsSaving(false);
    }
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
              <Globe className="h-6 w-6 text-[#81B441]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Langage
            </h1>
          </div>
          <p className="text-gray-600 ml-14">
            Choisissez votre langue préférée
          </p>
        </div>

        {/* Liste des langues */}
        <Card className="border-2 border-gray-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Globe className="h-5 w-5 mr-2 text-[#81B441]" />
              Langues disponibles
            </CardTitle>
            <CardDescription>
              Sélectionnez la langue d'affichage de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleSelectLanguage(language.code)}
                  disabled={isSaving}
                  className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group ${
                    selectedLanguage === language.code ? 'bg-[#81B441]/5' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{language.flag}</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{language.nativeName}</p>
                      <p className="text-sm text-gray-500">{language.name}</p>
                    </div>
                  </div>
                  {selectedLanguage === language.code && (
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-[#81B441]" />
                      <span className="text-sm font-medium text-[#81B441]">Sélectionné</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mt-6 border-2 border-blue-100 bg-blue-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Le changement de langue affectera l'interface de l'application, 
              les emails et les notifications. Certaines fonctionnalités peuvent nécessiter un rechargement de la page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

