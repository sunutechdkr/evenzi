'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeftIcon, EnvelopeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from 'next/image';
import Link from 'next/link';

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  category: string;
  htmlContent: string;
  textContent?: string;
  isActive: boolean;
  isDefault: boolean;
  isGlobal: boolean;
  createdAt: string;
}

interface Event {
  id: string;
  name: string;
  description?: string;
  banner?: string;
  logo?: string;
  startDate: string;
  endDate: string;
  location: string;
}

export default function TemplateViewPage() {
  const { id: eventId, templateId } = useParams();
  const { data: session } = useSession();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchTemplate();
    fetchEvent();
  }, [eventId, templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/templates`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du template');
      }
      const templates = await response.json();
      const foundTemplate = templates.find((t: EmailTemplate) => t.id === templateId);
      if (!foundTemplate) {
        throw new Error('Template non trouvé');
      }
      setTemplate(foundTemplate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l&apos;événement');
      }
      const eventData = await response.json();
      setEvent(eventData);
    } catch (err) {
      console.error('Erreur event:', err);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap = {
      CONFIRMATION_INSCRIPTION: 'Confirmation d\'inscription',
      BIENVENUE_PARTICIPANT: 'Bienvenue participant',
      RAPPEL_EVENEMENT: 'Rappel événement',
      INFOS_PRATIQUES: 'Informations pratiques',
      SUIVI_POST_EVENEMENT: 'Suivi post-événement',
      GUIDE_EXPOSANT: 'Guide exposant',
      RAPPEL_INSTALLATION: 'Rappel installation',
      INFOS_TECHNIQUES_STAND: 'Informations techniques stand',
      BILAN_PARTICIPATION: 'Bilan participation',
      CONFIRMATION_SPEAKER: 'Confirmation speaker',
      INFOS_TECHNIQUES_PRESENTATION: 'Informations techniques présentation',
      RAPPEL_PRESENTATION: 'Rappel présentation',
      REMERCIEMENT_SPEAKER: 'Remerciement speaker',
    };
    return categoryMap[category as keyof typeof categoryMap] || category;
  };

  const getPreviewContent = (content: string) => {
    if (!event) return content;
    
    // Utiliser le logo evenzi comme bannière par défaut
    const bannerUrl = `${window.location.origin}/evenzi_logo.png`;
    
    return content
      .replace(/\{\{eventBanner\}\}/g, bannerUrl)
      .replace(/\{\{eventName\}\}/g, event.name)
      .replace(/\{\{participantName\}\}/g, 'Jean Dupont')
      .replace(/\{\{eventDate\}\}/g, new Date(event.startDate).toLocaleDateString())
      .replace(/\{\{eventTime\}\}/g, '14h00')
      .replace(/\{\{eventLocation\}\}/g, event.location)
      .replace(/\{\{organizerName\}\}/g, 'Organisateur')
                  .replace(/\{\{supportEmail\}\}/g, 'support@evenzi.io');
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !template) return;

    setSendingTest(true);
    try {
      const response = await fetch(`/api/events/${eventId}/templates/${templateId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: testEmail,
          previewContent: getPreviewContent(template.htmlContent),
          subject: getPreviewContent(template.subject)
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email de test');
      }

      alert('Email de test envoyé avec succès !');
      setIsTestModalOpen(false);
      setTestEmail('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
    } finally {
      setSendingTest(false);
    }
  };

  if (!session?.user || (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Vous n&apos;avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EventSidebar eventId={eventId as string} activeTab={`/dashboard/events/${eventId}/communication`} />
        <div className="flex-1 md:ml-64">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500">Chargement du template...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EventSidebar eventId={eventId as string} activeTab={`/dashboard/events/${eventId}/communication`} />
        <div className="flex-1 md:ml-64">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-red-600 mb-4">{error || 'Template non trouvé'}</div>
              <Link href={`/dashboard/events/${eventId}/communication`}>
                <Button variant="outline">Retour à la communication</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EventSidebar eventId={eventId as string} activeTab={`/dashboard/events/${eventId}/communication`} />
      
      <div className="flex-1 md:ml-64">
        <div className="p-6">
          {/* Header avec bannière de l'événement */}
          {event?.banner && (
            <div className="mb-6 relative h-48 rounded-lg overflow-hidden">
              <Image
                src={event.banner}
                alt={event.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                <div className="p-6 text-white">
                  <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
                  <p className="text-lg opacity-90">{event.location}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mb-6">
            <Link href={`/dashboard/events/${eventId}/communication`}>
              <Button variant="outline" className="mb-4">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Retour à la communication
              </Button>
            </Link>
          </div>

          {/* Template Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
                  <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                  {template.isDefault && (
                    <Badge variant="outline" className="text-xs">Par défaut</Badge>
                  )}
                  {template.isActive ? (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">Actif</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Inactif</Badge>
                  )}
                </div>
                {template.description && (
                  <p className="text-gray-600">{template.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsTestModalOpen(true)}
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Envoyer un test
                </Button>
                <Link href={`/dashboard/events/${eventId}/communication/templates/${templateId}/edit`}>
                  <Button className="bg-[#81B441] hover:bg-[#6a9636]">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Éditer
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Template Preview */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Sujet</Label>
                  <p className="text-gray-900 mt-1">{getPreviewContent(template.subject)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Catégorie</Label>
                  <p className="text-gray-900 mt-1">{getCategoryLabel(template.category)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: getPreviewContent(template.htmlContent) 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour l'email de test */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EnvelopeIcon className="h-5 w-5" />
              Envoyer un email de test
            </DialogTitle>
            <DialogDescription>
              Entrez une adresse email pour recevoir un aperçu de ce template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="testEmail">Adresse email</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsTestModalOpen(false)}
              disabled={sendingTest}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSendTestEmail}
              disabled={!testEmail || sendingTest}
              className="bg-[#81B441] hover:bg-[#6a9636]"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              {sendingTest ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 