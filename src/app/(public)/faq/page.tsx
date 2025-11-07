'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Compte et Profil",
    question: "Comment créer un compte sur Evenzi ?",
    answer: "Pour créer un compte, cliquez sur 'S'inscrire' sur la page d'accueil, remplissez vos informations (nom, email, mot de passe) et validez. Vous recevrez un email de confirmation pour activer votre compte."
  },
  {
    category: "Compte et Profil",
    question: "Comment modifier mon profil ?",
    answer: "Accédez à votre profil via le menu principal, cliquez sur 'Modifier mon profil', puis mettez à jour vos informations (nom, fonction, entreprise, bio). N'oubliez pas de sauvegarder vos modifications."
  },
  {
    category: "Événements",
    question: "Comment m'inscrire à un événement ?",
    answer: "Parcourez la liste des événements disponibles, cliquez sur l'événement qui vous intéresse, puis sur le bouton 'S'inscrire'. Remplissez le formulaire d'inscription et validez."
  },
  {
    category: "Événements",
    question: "Comment accéder à mon QR code de check-in ?",
    answer: "Après votre inscription, accédez à 'Mes Événements', sélectionnez l'événement concerné, et vous trouverez votre QR code personnel dans la section check-in."
  },
  {
    category: "Rendez-vous",
    question: "Comment prendre un rendez-vous avec un participant ?",
    answer: "Allez dans la section 'Rendez-vous' de l'événement, cliquez sur 'Nouveau rendez-vous', sélectionnez le participant, choisissez un lieu et une date, puis ajoutez un message personnalisé."
  },
  {
    category: "Rendez-vous",
    question: "Comment annuler un rendez-vous ?",
    answer: "Accédez à vos rendez-vous, sélectionnez celui que vous souhaitez annuler, et cliquez sur 'Annuler le rendez-vous'. Le participant sera notifié automatiquement."
  },
  {
    category: "Gamification",
    question: "Comment gagner des points ?",
    answer: "Vous gagnez des points en participant aux événements (check-in), en assistant aux sessions, en prenant des rendez-vous et en interagissant avec d'autres participants."
  },
  {
    category: "Gamification",
    question: "À quoi servent les points ?",
    answer: "Les points reflètent votre niveau d'engagement et peuvent déb loquer des badges spéciaux. Ils vous permettent également de voir votre classement parmi les participants."
  },
  {
    category: "Sécurité",
    question: "Mes données sont-elles sécurisées ?",
    answer: "Oui, nous utilisons des protocoles de sécurité standards de l'industrie (HTTPS, chiffrement des données) pour protéger vos informations personnelles."
  },
  {
    category: "Sécurité",
    question: "Comment changer mon mot de passe ?",
    answer: "Allez dans 'Profil' > 'Confidentialité et Sécurité', entrez votre mot de passe actuel, puis votre nouveau mot de passe (minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial)."
  }
];

export default function FAQPage() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Grouper les FAQs par catégorie
  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

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
              <HelpCircle className="h-10 w-10 text-[#81B441]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Questions Fréquentes
          </h1>
          <p className="text-lg text-gray-600">
            Trouvez rapidement des réponses à vos questions
          </p>
        </div>

        {/* FAQs par catégorie */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-8 bg-[#81B441] mr-3 rounded-full" />
              {category}
            </h2>
            
            <div className="space-y-3">
              {faqs
                .filter(faq => faq.category === category)
                .map((faq, index) => {
                  const globalIndex = faqs.indexOf(faq);
                  const isExpanded = expandedIndex === globalIndex;
                  
                  return (
                    <Card 
                      key={globalIndex}
                      className={`border-2 transition-all duration-200 ${
                        isExpanded ? 'border-[#81B441] shadow-lg' : 'border-gray-100'
                      }`}
                    >
                      <CardHeader 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleFAQ(globalIndex)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold text-gray-900 pr-4">
                            {faq.question}
                          </CardTitle>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-[#81B441] flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="pt-0">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Contact pour autres questions */}
        <Card className="mt-8 border-2 border-[#81B441]/20 bg-[#81B441]/5">
          <CardContent className="pt-6 text-center">
            <HelpCircle className="h-12 w-12 text-[#81B441] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Vous ne trouvez pas votre réponse ?
            </h3>
            <p className="text-gray-600 mb-4">
              Notre équipe support est là pour vous aider
            </p>
            <Button 
              onClick={() => router.push('/support')}
              className="bg-[#81B441] hover:bg-[#6a9636]"
            >
              Contacter le Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

