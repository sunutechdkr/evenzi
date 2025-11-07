"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  StarIcon,
  QrCodeIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// Types pour les articles d'aide
type HelpArticle = {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  isPopular?: boolean;
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPopular?: boolean;
};

// Articles d'aide pour les participants
const helpArticles: HelpArticle[] = [
  {
    id: "1",
    title: "Utiliser votre badge numérique",
    description: "Comment accéder et utiliser votre QR code pour l'événement",
    category: "Badge",
    readTime: "3 min",
    isPopular: true,
  },
  {
    id: "2",
    title: "Planifier des rendez-vous",
    description: "Comment demander et gérer vos rendez-vous avec d'autres participants",
    category: "Networking",
    readTime: "5 min",
    isPopular: true,
  },
  {
    id: "3",
    title: "Naviguer dans l'événement",
    description: "Comprendre le programme et trouver les sessions qui vous intéressent",
    category: "Navigation",
    readTime: "4 min",
    isPopular: true,
  },
  {
    id: "4",
    title: "Contacter les exposants",
    description: "Comment entrer en contact avec les exposants présents",
    category: "Exposants",
    readTime: "3 min",
  },
  {
    id: "5",
    title: "Participer aux sessions",
    description: "Rejoindre les conférences et ateliers de l'événement",
    category: "Sessions",
    readTime: "6 min",
  },
  {
    id: "6",
    title: "Gérer votre profil",
    description: "Mettre à jour vos informations et préférences",
    category: "Profil",
    readTime: "4 min",
  },
];

// Questions fréquentes pour les participants
const faqs: FAQ[] = [
  {
    id: "1",
    question: "Où puis-je trouver mon QR code d'accès ?",
    answer: "Votre QR code est disponible dans la section 'Mon Badge'. Vous pouvez l'afficher directement sur votre écran ou l'imprimer. Il vous sera demandé à l'entrée de l'événement.",
    category: "Badge",
    isPopular: true,
  },
  {
    id: "2",
    question: "Comment demander un rendez-vous avec un autre participant ?",
    answer: "Rendez-vous dans la section 'Participants', trouvez la personne souhaitée et cliquez sur 'Demander un rendez-vous'. Vous pourrez proposer plusieurs créneaux horaires.",
    category: "Networking",
    isPopular: true,
  },
  {
    id: "3",
    question: "Puis-je modifier mes informations de profil ?",
    answer: "Oui, vous pouvez mettre à jour vos informations dans la section 'Mon Profil'. Les modifications seront visibles par les autres participants.",
    category: "Profil",
    isPopular: true,
  },
  {
    id: "4",
    question: "Comment savoir si ma demande de rendez-vous a été acceptée ?",
    answer: "Vous recevrez une notification directement sur la plateforme et par email. Vous pouvez aussi consulter vos rendez-vous confirmés dans votre espace personnel.",
    category: "Networking",
  },
  {
    id: "5",
    question: "Que faire si je ne trouve pas une session dans le programme ?",
    answer: "Utilisez la fonction de recherche dans la section 'Sessions' ou contactez l'équipe organisatrice via le support intégré.",
    category: "Sessions",
  },
  {
    id: "6",
    question: "Comment contacter un exposant spécifique ?",
    answer: "Dans la section 'Exposants', cliquez sur la fiche de l'exposant qui vous intéresse. Vous trouverez ses coordonnées et pourrez lui envoyer un message direct.",
    category: "Exposants",
  },
  {
    id: "7",
    question: "L'événement est-il accessible en ligne ?",
    answer: "Certaines sessions peuvent être diffusées en ligne. Consultez le programme pour voir quelles sessions proposent un accès virtuel.",
    category: "Sessions",
  },
  {
    id: "8",
    question: "Comment télécharger les supports de présentation ?",
    answer: "Les supports seront disponibles après chaque session dans la section correspondante. Vous recevrez aussi un email avec les liens de téléchargement.",
    category: "Sessions",
  },
];

export default function UserAidePage() {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filtrer les articles selon la recherche et la catégorie
  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtrer les FAQs selon la recherche et la catégorie
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Catégories disponibles
  const categories = Array.from(new Set([
    ...helpArticles.map(a => a.category),
    ...faqs.map(f => f.category)
  ]));

  return (
    <div className="dashboard-container min-h-screen overflow-hidden">
      <UserEventSidebar 
        eventId={id as string} 
        onExpandChange={(expanded) => setSidebarExpanded(expanded)}
        activeTab="aide"
      />
      
      <div 
        className={`dashboard-content bg-gray-50 ${!sidebarExpanded ? 'dashboard-content-collapsed' : ''}`}
        style={{ 
          marginLeft: sidebarExpanded ? '16rem' : '4rem',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <div className="container mx-auto py-6">
          {/* En-tête */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <QuestionMarkCircleIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Centre d&apos;aide</h1>
                <p className="text-muted-foreground">
                  Trouvez des réponses pour profiter pleinement de votre participation à l&apos;événement
                </p>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative max-w-2xl">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rechercher dans l&apos;aide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* Liens rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <QrCodeIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Mon Badge</p>
                    <p className="text-sm text-muted-foreground">Accéder à votre QR code</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Rendez-vous</p>
                    <p className="text-sm text-muted-foreground">Planifier des rencontres</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Programme</p>
                    <p className="text-sm text-muted-foreground">Sessions et horaires</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques d'aide */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BookOpenIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{helpArticles.length}</p>
                    <p className="text-sm text-muted-foreground">Guides pratiques</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{faqs.length}</p>
                    <p className="text-sm text-muted-foreground">Questions fréquentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <LightBulbIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{categories.length}</p>
                    <p className="text-sm text-muted-foreground">Catégories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <StarIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {helpArticles.filter(a => a.isPopular).length + faqs.filter(f => f.isPopular).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Conseils populaires</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal */}
          <Tabs defaultValue="articles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="articles">Guides pratiques</TabsTrigger>
              <TabsTrigger value="faq">Questions fréquentes</TabsTrigger>
              <TabsTrigger value="contact">Assistance</TabsTrigger>
            </TabsList>

            {/* Articles d'aide */}
            <TabsContent value="articles" className="space-y-6">
              {/* Filtres de catégorie */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  Toutes les catégories
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Liste des articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2 flex items-center gap-2">
                            {article.title}
                            {article.isPopular && (
                              <Badge variant="secondary" className="text-xs">
                                <StarIcon className="h-3 w-3 mr-1" />
                                Populaire
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{article.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{article.category}</Badge>
                        <span className="text-sm text-muted-foreground">{article.readTime}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun guide trouvé pour votre recherche</p>
                </div>
              )}
            </TabsContent>

            {/* Questions fréquentes */}
            <TabsContent value="faq" className="space-y-6">
              {/* Filtres de catégorie */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  Toutes les catégories
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Liste des FAQs */}
              <Card>
                <CardHeader>
                  <CardTitle>Questions fréquemment posées</CardTitle>
                  <CardDescription>
                    Réponses aux questions les plus courantes des participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFAQs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            {faq.question}
                            {faq.isPopular && (
                              <Badge variant="secondary" className="text-xs">
                                <StarIcon className="h-3 w-3 mr-1" />
                                Populaire
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2">
                            <p className="text-gray-700 mb-3">{faq.answer}</p>
                            <Badge variant="outline" className="text-xs">
                              {faq.category}
                            </Badge>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFAQs.length === 0 && (
                    <div className="text-center py-12">
                      <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune FAQ trouvée pour votre recherche</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact/Assistance */}
            <TabsContent value="contact" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Support de l'événement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5" />
                      Support événement
                    </CardTitle>
                    <CardDescription>
                      Contactez directement l&apos;équipe organisatrice
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <a href="mailto:contact@tif-africa.com">
                        Contacter les organisateurs
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Assistance technique */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PhoneIcon className="h-5 w-5" />
                      Assistance technique
                    </CardTitle>
                    <CardDescription>
                      Problème technique avec la plateforme ?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <a href="mailto:support@evenzi.io">
                        Support technique
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Accueil sur place */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserGroupIcon className="h-5 w-5" />
                      Accueil sur place
                    </CardTitle>
                    <CardDescription>
                      Assistance directe pendant l&apos;événement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Stand d&apos;information à l&apos;entrée principale
                      </p>
                      <p className="text-sm font-medium">
                        Ouvert pendant toute la durée de l&apos;événement
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Chat en ligne */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      Chat en direct
                    </CardTitle>
                    <CardDescription>
                      Assistance immédiate par chat
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <a href="#" onClick={() => {/* Ouvrir le chat */}}>
                        Démarrer une conversation
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Informations pratiques */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations pratiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Horaires de l&apos;événement</h4>
                      <p className="text-sm text-muted-foreground">
                        Consultez le programme pour les horaires détaillés<br />
                        Accueil dès 8h30<br />
                        Dernière session jusqu&apos;à 18h00
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Conseils utiles</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Gardez votre QR code accessible</li>
                        <li>• Consultez régulièrement vos rendez-vous</li>
                        <li>• N&apos;hésitez pas à contacter les exposants</li>
                        <li>• Participez aux sessions de networking</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 