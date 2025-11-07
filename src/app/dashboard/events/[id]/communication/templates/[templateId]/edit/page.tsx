'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeftIcon, CheckIcon, XMarkIcon, EnvelopeIcon, CalendarIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SendEmailModal from "@/components/templates/SendEmailModal";
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Import dynamique pour l'éditeur riche
const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-md" />
});

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  recipientType: string;
  subject: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients?: number;
  successCount?: number;
  failureCount?: number;
  createdAt: string;
}

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

export default function TemplateEditPage() {
  const { id: eventId, templateId } = useParams();
  const { data: session } = useSession();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    htmlContent: ''
  });

  // Test email modal state
  const [testEmail, setTestEmail] = useState('');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Template management state
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    fetchTemplate();
    fetchEvent();
    fetchCampaigns();
  }, [eventId, templateId]);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        subject: template.subject,
        htmlContent: template.htmlContent
      });
    }
  }, [template]);

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

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/campaigns`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des campagnes');
      }
      const data = await response.json();
      setCampaigns(data);
    } catch (err) {
      console.error('Erreur campaigns:', err);
    }
  };

  const toggleTemplate = async (isActive: boolean) => {
    if (!template) return;

    setTemplateLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du template');
      }

      const updatedTemplate = await response.json();
      setTemplate(updatedTemplate);
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du template');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleSendEmail = () => {
    setSendModalOpen(true);
  };

  const getTemplateStatus = () => {
    // Chercher une campagne liée à ce template
    const templateCampaigns = campaigns.filter((c: Campaign) => 
      c.subject.includes(template?.name || '') ||
      c.description?.includes(template?.name || '')
    );

    if (templateCampaigns.length > 0) {
      // Prendre la campagne la plus récente
      const latestCampaign = templateCampaigns.sort((a: Campaign, b: Campaign) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return {
        status: latestCampaign.status,
        campaign: latestCampaign
      };
    }

    return { status: null, campaign: null };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    
    // Utiliser la même image SVG compacte que dans l'email
    const logoBase64 = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100"><rect width="400" height="100" fill="#81B441"/><text x="200" y="60" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="white">Evenzi App</text></svg>`).toString('base64')}`;
    
    return content
      .replace(/\{\{eventBanner\}\}/g, logoBase64)
      .replace(/\{\{eventName\}\}/g, event.name)
      .replace(/\{\{participantName\}\}/g, 'Jean Dupont')
      .replace(/\{\{eventDate\}\}/g, new Date(event.startDate).toLocaleDateString())
      .replace(/\{\{eventTime\}\}/g, '14h00')
      .replace(/\{\{eventLocation\}\}/g, event.location)
      .replace(/\{\{organizerName\}\}/g, 'Organisateur')
                  .replace(/\{\{supportEmail\}\}/g, 'support@evenzi.io');
  };

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch(`/api/events/${eventId}/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          subject: formData.subject,
          htmlContent: formData.htmlContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      setSaveSuccess(true);
      
      // Animation de succès puis reset automatique
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
      
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !template) return;

    setSendingTest(true);
    setTestSuccess(false);
    try {
      const response = await fetch(`/api/events/${eventId}/templates/${templateId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: testEmail,
          previewContent: getPreviewContent(formData.htmlContent),
          subject: getPreviewContent(formData.subject)
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email de test');
      }

      await response.json();
      setTestSuccess(true);
      
      // Animation de succès puis fermeture automatique
      setTimeout(() => {
        setIsTestModalOpen(false);
        setTestEmail('');
        setTestSuccess(false);
      }, 2000);
      
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
      setTestSuccess(false);
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
          {/* Header */}
          <div className="mb-6">
            <Link href={`/dashboard/events/${eventId}/communication`}>
              <Button variant="outline" className="mb-4">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Retour à la communication
              </Button>
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">Édition : {template.name}</h1>
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
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsTestModalOpen(true)}
                  disabled={saving}
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Envoyer un test
                </Button>
                <Link href={`/dashboard/events/${eventId}/communication`}>
                  <Button variant="outline" disabled={saving}>
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </Link>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#81B441] hover:bg-[#6a9636]"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </div>

          {/* Animation de succès de sauvegarde */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Template sauvegardé avec succès !</h3>
                  <p className="text-sm text-green-600">Vos modifications ont été enregistrées.</p>
                </div>
              </div>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Informations du template</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom du template</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Sujet de l&apos;email</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Template Activation and Campaign Management */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Activation et campagnes</h2>
                <div className="space-y-6">
                  {/* Template Activation */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Statut du template</h3>
                      <p className="text-sm text-gray-600">
                        {template?.isActive ? 'Template activé et prêt à être utilisé' : 'Template désactivé'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${
                        template?.isActive ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {template?.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <Switch
                        checked={template?.isActive || false}
                        disabled={templateLoading}
                        onCheckedChange={(checked) => toggleTemplate(checked)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                  </div>

                  {/* Campaign Info */}
                  {template?.isActive && (() => {
                    const { status, campaign } = getTemplateStatus();
                    return (
                      <div className="space-y-4">
                        {/* Campaign Status */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-blue-500" />
                            <div>
                              <h4 className="font-medium text-gray-900">État de la campagne</h4>
                              <p className="text-sm text-gray-600">
                                {status === 'SENT' ? 'Campagne envoyée' :
                                 status === 'SCHEDULED' ? 'Campagne programmée' :
                                 'Aucune campagne active'}
                              </p>
                            </div>
                          </div>
                          {status && (
                            <Badge variant={status === 'SENT' ? 'default' : 'secondary'}>
                              {status === 'SENT' ? 'Envoyé' : 
                               status === 'SCHEDULED' ? 'Programmé' : status}
                            </Badge>
                          )}
                        </div>

                        {/* Campaign Details */}
                        {campaign && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-blue-900 mb-2">Détails de la dernière campagne</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-blue-700 font-medium">Destinataires:</span>
                                <span className="ml-2">{campaign.totalRecipients || 0}</span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Succès:</span>
                                <span className="ml-2 text-green-600">{campaign.successCount || 0}</span>
                              </div>
                              {campaign.sentAt && (
                                <div className="col-span-2">
                                  <span className="text-blue-700 font-medium">Date d&apos;envoi:</span>
                                  <span className="ml-2">{formatDate(campaign.sentAt)}</span>
                                </div>
                              )}
                              {campaign.scheduledAt && !campaign.sentAt && (
                                <div className="col-span-2">
                                  <span className="text-blue-700 font-medium">Programmé pour:</span>
                                  <span className="ml-2">{formatDate(campaign.scheduledAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          onClick={handleSendEmail}
                          className="w-full bg-[#81B441] hover:bg-[#6a9636]"
                          disabled={!template?.isActive}
                        >
                          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                          Programmer une nouvelle campagne
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Contenu HTML</h2>
                <RichTextEditor
                  value={formData.htmlContent}
                  onChange={(value) => setFormData({ ...formData, htmlContent: value })}
                />
              </div>
            </div>

            {/* Right column: Preview */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border sticky top-6">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Aperçu en temps réel</h2>
                  <p className="text-sm text-gray-600 mt-1">Les modifications sont visibles instantanément</p>
                </div>
                
                <div className="p-6">
                  <div className="mb-4 pb-4 border-b">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Sujet:</strong> {getPreviewContent(formData.subject)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Catégorie:</strong> {getCategoryLabel(template.category)}
                    </div>
                  </div>
                  
                  <div 
                    className="prose max-w-none min-h-[400px] border rounded p-4 bg-gray-50"
                    dangerouslySetInnerHTML={{ 
                      __html: getPreviewContent(formData.htmlContent) || '<p class="text-gray-400">Le contenu apparaîtra ici...</p>'
                    }}
                  />
                </div>
              </div>
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
              Entrez une adresse email pour recevoir un aperçu de ce template avec vos modifications actuelles
            </DialogDescription>
          </DialogHeader>

          {testSuccess ? (
            /* Animation de succès */
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckIcon className="h-8 w-8 text-green-600" />
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Email envoyé avec succès !</h3>
              <p className="text-green-600 text-center">Vérifiez votre boîte de réception</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="testEmail">Adresse email</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div className="flex justify-end gap-2">
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
                  {sendingTest ? 'Envoi...' : 'Envoyer le test'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'envoi d'email */}
      <SendEmailModal
        isOpen={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false);
        }}
        template={template}
        eventId={eventId as string}
      />
    </div>
  );
} 