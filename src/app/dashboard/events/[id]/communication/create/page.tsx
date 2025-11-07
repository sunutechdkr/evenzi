'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeftIcon,
  EyeIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Import dynamique pour l'éditeur riche
const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-md" />
});

export default function CreateCampaignPage() {
  const { id: eventId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CUSTOM',
    recipientType: 'ALL_PARTICIPANTS',
    subject: '',
    htmlContent: '',
    textContent: '',
    scheduledAt: '',
  });

  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent, sendNow = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          scheduledAt: sendNow ? null : formData.scheduledAt || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la campagne');
      }

      const campaign = await response.json();

      if (sendNow) {
        // Envoyer immédiatement
        const sendResponse = await fetch(`/api/events/${eventId}/campaigns/${campaign.id}/send`, {
          method: 'POST',
        });

        if (!sendResponse.ok) {
          throw new Error('Erreur lors de l\'envoi de la campagne');
        }
      }

      router.push(`/dashboard/events/${eventId}/communication`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user || (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EventSidebar eventId={eventId as string} activeTab={`/dashboard/events/${eventId}/communication`} />
      
      <div className="flex-1 md:ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href={`/dashboard/events/${eventId}/communication`}>
                  <Button variant="outline" size="sm">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Nouvelle campagne email</h1>
                  <p className="text-gray-600 mt-1">Créez et envoyez une campagne email personnalisée</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {previewMode ? 'Éditer' : 'Aperçu'}
                </Button>
              </div>
            </div>
          </div>

          {previewMode ? (
            /* Mode aperçu */
            <Card>
              <CardHeader>
                <CardTitle>Aperçu de l'email</CardTitle>
                <CardDescription>Voici comment votre email apparaîtra aux destinataires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white">
                  <div className="mb-4 pb-4 border-b">
                    <div className="text-sm text-gray-600">
                      <strong>Sujet:</strong> {formData.subject || 'Pas de sujet'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Destinataires:</strong> {
                        formData.recipientType === 'ALL_PARTICIPANTS' ? 'Tous les participants' :
                        formData.recipientType === 'PARTICIPANTS' ? 'Participants' :
                        formData.recipientType === 'SPEAKERS' ? 'Intervenants' :
                        formData.recipientType === 'EXHIBITORS' ? 'Exposants' :
                        'Destinataires personnalisés'
                      }
                    </div>
                  </div>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.htmlContent || '<p>Contenu vide</p>' }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Mode édition */
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulaire principal */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nom de la campagne *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Email de bienvenue"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Description de la campagne..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="type">Type de campagne</Label>
                          <Select 
                            value={formData.type} 
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ANNOUNCEMENT">Annonce</SelectItem>
                              <SelectItem value="REMINDER">Rappel</SelectItem>
                              <SelectItem value="INVITATION">Invitation</SelectItem>
                              <SelectItem value="FOLLOW_UP">Suivi</SelectItem>
                              <SelectItem value="CUSTOM">Personnalisé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="recipientType">Destinataires</Label>
                          <Select 
                            value={formData.recipientType} 
                            onValueChange={(value) => setFormData({ ...formData, recipientType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL_PARTICIPANTS">Tous les participants</SelectItem>
                              <SelectItem value="PARTICIPANTS">Participants seulement</SelectItem>
                              <SelectItem value="SPEAKERS">Intervenants</SelectItem>
                              <SelectItem value="EXHIBITORS">Exposants</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Contenu de l'email</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="subject">Sujet de l'email *</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Sujet de votre email..."
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="htmlContent">Contenu HTML *</Label>
                        <div className="mt-2">
                          <RichTextEditor
                            value={formData.htmlContent}
                            onChange={(value) => setFormData({ ...formData, htmlContent: value })}
                            placeholder="Rédigez votre email ici..."
                          />
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Utilisez {{name}} pour insérer le nom du destinataire
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="textContent">Version texte (optionnel)</Label>
                        <Textarea
                          id="textContent"
                          value={formData.textContent}
                          onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                          placeholder="Version texte de votre email..."
                          rows={6}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar d'options */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Options d'envoi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="scheduledAt">Programmer l'envoi</Label>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          value={formData.scheduledAt}
                          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          Laissez vide pour envoyer immédiatement
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        type="submit"
                        className="w-full bg-[#81B441] hover:bg-[#6a9636]"
                        disabled={loading || !formData.name || !formData.subject || !formData.htmlContent}
                      >
                        {loading ? 'Création...' : 'Sauvegarder comme brouillon'}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={loading || !formData.name || !formData.subject || !formData.htmlContent}
                      >
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        {loading ? 'Envoi...' : 'Créer et envoyer'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Variables disponibles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-2">
                        <div>
                          <code className="bg-gray-100 px-2 py-1 rounded">{"{{name}}"}</code>
                          <div className="text-gray-600">Nom du destinataire</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 