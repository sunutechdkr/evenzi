'use client';

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Shield,
  Users,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
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
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-[#81B441]/10 rounded-full">
              <FileText className="h-10 w-10 text-[#81B441]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Termes et Conditions
          </h1>
          <p className="text-lg text-gray-600">
            Dernière mise à jour : Novembre 2024
          </p>
        </div>

        {/* Contenu */}
        <Card className="border-2 border-[#81B441]/20 bg-white mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Shield className="h-6 w-6 mr-2 text-[#81B441]" />
              1. Acceptation des Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              En accédant et en utilisant la plateforme Evenzi, vous acceptez d'être lié par ces termes et conditions d'utilisation, toutes les lois et réglementations applicables, et vous acceptez que vous êtes responsable du respect de toutes les lois locales applicables.
            </p>
            <p>
              Si vous n'acceptez pas l'un de ces termes, vous n'êtes pas autorisé à utiliser ou à accéder à ce site.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-100 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Users className="h-6 w-6 mr-2 text-[#81B441]" />
              2. Utilisation du Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <h3 className="font-semibold text-lg">2.1 Compte Utilisateur</h3>
            <p>
              Pour accéder à certaines fonctionnalités de la plateforme, vous devez créer un compte. Vous êtes responsable de :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintenir la confidentialité de votre mot de passe</li>
              <li>Toutes les activités qui se produisent sous votre compte</li>
              <li>Notifier immédiatement Evenzi de toute utilisation non autorisée</li>
            </ul>

            <h3 className="font-semibold text-lg mt-6">2.2 Comportement Acceptable</h3>
            <p>
              Vous acceptez de ne pas :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Utiliser le service à des fins illégales</li>
              <li>Harceler, abuser ou nuire à d'autres utilisateurs</li>
              <li>Publier du contenu offensant ou inapproprié</li>
              <li>Tenter de contourner les mesures de sécurité</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-100 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Shield className="h-6 w-6 mr-2 text-[#81B441]" />
              3. Confidentialité et Données Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              Nous collectons et utilisons vos données personnelles conformément à notre politique de confidentialité. En utilisant Evenzi, vous consentez à cette collecte et utilisation.
            </p>
            <p>
              Vos données peuvent inclure :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Informations de profil (nom, email, photo)</li>
              <li>Données d'utilisation (événements, rendez-vous, sessions)</li>
              <li>Informations de gamification (points, badges)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-100 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-[#81B441]" />
              4. Propriété Intellectuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              Tout le contenu présent sur Evenzi, incluant mais non limité aux textes, graphiques, logos, images, et logiciels, est la propriété d'Evenzi ou de ses fournisseurs de contenu et est protégé par les lois sur la propriété intellectuelle.
            </p>
            <p>
              Vous ne pouvez pas reproduire, distribuer, ou créer des œuvres dérivées de ce contenu sans autorisation écrite expresse.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-100 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-[#81B441]" />
              5. Limitation de Responsabilité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              Evenzi ne sera pas responsable des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs résultant de votre accès ou utilisation du service.
            </p>
            <p>
              Le service est fourni "tel quel" sans garantie d'aucune sorte, expresse ou implicite.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-100 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-2 text-[#81B441]" />
              6. Modifications des Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              Evenzi se réserve le droit de modifier ces termes à tout moment. Les modifications entreront en vigueur immédiatement après leur publication sur la plateforme.
            </p>
            <p>
              Votre utilisation continue du service après la publication des modifications constitue votre acceptation de ces modifications.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-100 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Users className="h-6 w-6 mr-2 text-[#81B441]" />
              7. Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              Pour toute question concernant ces termes et conditions, veuillez nous contacter :
            </p>
            <ul className="space-y-2">
              <li><strong>Email :</strong> legal@evenzi.io</li>
              <li><strong>Adresse :</strong> Evenzi, Paris, France</li>
              <li><strong>Téléphone :</strong> +33 1 23 45 67 89</li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>© 2024 Evenzi. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}

