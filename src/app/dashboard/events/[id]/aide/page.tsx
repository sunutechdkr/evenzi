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
  VideoCameraIcon,
  DocumentTextIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  StarIcon,
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

// Articles d'aide
const helpArticles: HelpArticle[] = [
  {
    id: "1",
    title: "Créer votre premier événement",
    description: "Guide étape par étape pour créer et configurer votre événement",
    category: "Démarrage",
    readTime: "5 min",
    isPopular: true,
  },
  {
    id: "2",
    title: "Gérer les inscriptions",
    description: "Comment configurer et gérer les inscriptions à votre événement",
    category: "Inscriptions",
    readTime: "7 min",
    isPopular: true,
  },
  {
    id: "3",
    title: "Personnaliser les badges",
    description: "Créer et personnaliser les badges pour vos participants",
    category: "Badges",
    readTime: "10 min",
  },
  {
    id: "4",
    title: "Système de rendez-vous",
    description: "Configurer et utiliser le système de prise de rendez-vous",
    category: "Networking",
    readTime: "8 min",
    isPopular: true,
  },
  {
    id: "5",
    title: "Gérer les sessions",
    description: "Créer et organiser les sessions de votre événement",
    category: "Sessions",
    readTime: "12 min",
  },
  {
    id: "6",
    title: "Analyser les données",
    description: "Comprendre et utiliser les analytics de votre événement",
    category: "Analytics",
    readTime: "6 min",
  },
];

// Questions fréquentes
const faqs: FAQ[] = [
  {
    id: "1",
    question: "Comment modifier les informations de mon événement ?",
    answer: "Rendez-vous dans la section 'Réglages' de votre événement, puis cliquez sur 'Informations générales'. Vous pourrez y modifier le nom, la description, les dates et autres détails.",
    category: "Général",
    isPopular: true,
  },
  {
    id: "2",
    question: "Puis-je importer une liste de participants ?",
    answer: "Oui, vous pouvez importer vos participants via un fichier CSV dans la section 'Participants'. Assurez-vous que votre fichier contient les colonnes : prénom, nom, email.",
    category: "Participants",
    isPopular: true,
  },
  {
    id: "3",
    question: "Comment activer le système de rendez-vous ?",
    answer: "Le système de rendez-vous est activé par défaut. Vos participants peuvent demander des rendez-vous entre eux via l'application mobile ou l'interface web.",
    category: "Networking",
    isPopular: true,
  },
  {
    id: "4",
    question: "Puis-je personnaliser les emails automatiques ?",
    answer: "Oui, dans la section 'Communication', vous pouvez personnaliser tous les templates d'emails : confirmation d'inscription, rappels, etc.",
    category: "Communication",
  },
  {
    id: "5",
    question: "Comment exporter les données de mon événement ?",
    answer: "Vous pouvez exporter les données dans la section 'Analytique'. Plusieurs formats sont disponibles : PDF, Excel, CSV.",
    category: "Export",
  },
  {
    id: "6",
    question: "Que faire si un participant ne reçoit pas son QR code ?",
    answer: "Vérifiez d'abord que l'email n'est pas dans les spams. Si le problème persiste, vous pouvez renvoyer le QR code depuis la liste des participants.",
    category: "Badges",
  },
];

export default function AidePage() {
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
      <EventSidebar 
        eventId={id as string} 
        onExpandChange={(expanded) => setSidebarExpanded(expanded)}
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
                  Trouvez des réponses à vos questions et des guides pour utiliser Evenzi
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

          {/* Statistiques d&apos;aide */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BookOpenIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{helpArticles.length}</p>
                    <p className="text-sm text-muted-foreground">Articles d&apos;aide</p>
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
                    <p className="text-sm text-muted-foreground">Articles populaires</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal */}
          <Tabs defaultValue="articles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="articles">Articles d&apos;aide</TabsTrigger>
              <TabsTrigger value="faq">Questions fréquentes</TabsTrigger>
              <TabsTrigger value="contact">Nous contacter</TabsTrigger>
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
                  <p className="text-gray-500">Aucun article trouvé pour votre recherche</p>
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
                    Trouvez rapidement des réponses aux questions les plus courantes
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

            {/* Contact */}
            <TabsContent value="contact" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Support par email */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5" />
                      Support par email
                    </CardTitle>
                    <CardDescription>
                      Envoyez-nous un email et nous vous répondrons dans les 24h
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <a href="mailto:support@evenzi.io">
                        Contacter le support
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Support téléphonique */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PhoneIcon className="h-5 w-5" />
                      Support téléphonique
                    </CardTitle>
                    <CardDescription>
                      Appelez-nous du lundi au vendredi de 9h à 18h
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <a href="tel:+33123456789">
                        +33 1 23 45 67 89
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Rendez-vous vidéo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <VideoCameraIcon className="h-5 w-5" />
                      Consultation vidéo
                    </CardTitle>
                    <CardDescription>
                      Planifiez un appel vidéo avec notre équipe support
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <a href="https://calendly.com/evenzi-support" target="_blank" rel="noopener noreferrer">
                        Planifier un appel
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Documentation technique */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5" />
                      Documentation technique
                    </CardTitle>
                    <CardDescription>
                      Accédez à la documentation complète de l&apos;API
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <a href="https://docs.evenzi.com" target="_blank" rel="noopener noreferrer">
                        Voir la documentation
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Informations de contact supplémentaires */}
              <Card>
                <CardHeader>
                  <CardTitle>Autres moyens de nous contacter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Adresse postale</h4>
                      <p className="text-sm text-muted-foreground">
                        Evenzi SAS<br />
                        123 Avenue des Champs-Élysées<br />
                        75008 Paris, France
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Heures d&apos;ouverture</h4>
                      <p className="text-sm text-muted-foreground">
                        Lundi - Vendredi : 9h00 - 18h00<br />
                        Samedi : 10h00 - 16h00<br />
                        Dimanche : Fermé
                      </p>
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