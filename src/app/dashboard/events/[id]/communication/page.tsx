'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  PlusIcon, 
  TrashIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SendEmailModal from "@/components/templates/SendEmailModal";
import Link from 'next/link';

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
  type: string;
  htmlContent: string;
  textContent?: string;
  isActive: boolean;
  isDefault: boolean;
  isGlobal: boolean;
  createdAt: string;
}

export default function CommunicationPage() {
  const { id: eventId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  // États pour le modal de création
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    target: ''
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, [eventId]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/campaigns`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des campagnes');
      }
      const data = await response.json();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await fetch(`/api/events/${eventId}/templates`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des templates');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      console.error('Erreur templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Fonction pour obtenir les informations de campagne d'un template
  const getTemplateStatus = (template: EmailTemplate) => {
    // Chercher une campagne liée à ce template
    const templateCampaigns = campaigns.filter(c => 
      c.subject.includes(template.name) ||
      c.description?.includes(template.name)
    );

    if (templateCampaigns.length > 0) {
      // Prendre la campagne la plus récente
      const latestCampaign = templateCampaigns.sort((a, b) => 
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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      DRAFT: { label: 'Brouillon', variant: 'secondary' as const },
      SCHEDULED: { label: 'Programmé', variant: 'default' as const },
      SENDING: { label: 'Envoi en cours', variant: 'default' as const },
      SENT: { label: 'Envoyé', variant: 'default' as const },
      FAILED: { label: 'Échec', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getRecipientTypeLabel = (type: string) => {
    const typeMap = {
      ALL_PARTICIPANTS: 'Tous les participants',
      PARTICIPANTS: 'Participants',
      SPEAKERS: 'Intervenants',
      EXHIBITORS: 'Exposants',
      SPONSORS: 'Sponsors',
      CUSTOM_LIST: 'Liste personnalisée',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // Fonction pour créer un nouveau template
  const createTemplate = async () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.target) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Mapper les cibles vers les catégories techniques
    const targetToCategory = {
      'participants': 'BIENVENUE_PARTICIPANT',
      'exposants': 'GUIDE_EXPOSANT',
      'speakers': 'CONFIRMATION_SPEAKER',
      'autres': 'INFOS_PRATIQUES'
    };

    try {
      setCreating(true);
      const response = await fetch(`/api/events/${eventId}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          description: formData.description.trim() || null,
          category: targetToCategory[formData.target as keyof typeof targetToCategory],
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center;">{{eventName}}</h1>
              <p style="color: #666; line-height: 1.6;">
                Bonjour {{participantName}},
              </p>
              <p style="color: #666; line-height: 1.6;">
                Contenu de votre email ici...
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <img src="{{eventBanner}}" alt="Bannière de l'événement" style="max-width: 100%; height: auto; border-radius: 8px;" />
              </div>
              <p style="color: #666; line-height: 1.6;">
                Cordialement,<br>
                L'équipe {{eventName}}
              </p>
            </div>
          `.trim(),
          textContent: `
            {{eventName}}
            
            Bonjour {{participantName}},
            
            Contenu de votre email ici...
            
            Cordialement,
            L'équipe {{eventName}}
          `.trim(),
          isActive: false,
          isDefault: false,
          isGlobal: false
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du template');
      }

      const newTemplate = await response.json();
      
      // Fermer le modal et réinitialiser le formulaire
      setCreateModalOpen(false);
      setFormData({ name: '', subject: '', description: '', target: '' });
      
      // Rediriger vers l'édition du nouveau template
      router.push(`/dashboard/events/${eventId}/communication/templates/${newTemplate.id}/edit`);
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du template');
    } finally {
      setCreating(false);
    }
  };

  // Fonction pour ouvrir le modal avec une cible spécifique
  const openCreateModal = (defaultTarget?: string) => {
    setFormData({
      name: '',
      subject: '',
      description: '',
      target: defaultTarget || ''
    });
    setCreateModalOpen(true);
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

  const activeCampaigns = campaigns.filter(c => c.status === 'SCHEDULED' || c.status === 'SENDING').length;
  const activeTemplates = templates.filter(t => t.isActive).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EventSidebar eventId={eventId as string} activeTab={`/dashboard/events/${eventId}/communication`} />
      
      <div className="flex-1 md:ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
                <p className="text-gray-600 mt-1">Gérez vos campagnes emails et templates pour cet événement</p>
              </div>
              <Button 
                className="bg-[#81B441] hover:bg-[#6a9636]"
                onClick={() => openCreateModal()}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle campagne
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campagnes totales</CardTitle>
                <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates actifs</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeTemplates}</div>
                <p className="text-xs text-muted-foreground">sur {templates.length} disponibles</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails envoyés</CardTitle>
                <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + (c.successCount || 0), 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campagnes actives</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCampaigns}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList>
              <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns">
              <Card>
                <CardHeader>
                  <CardTitle>Campagnes Email</CardTitle>
                  <CardDescription>
                    Gérez vos campagnes email pour cet événement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500">Chargement des campagnes...</div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <div className="text-red-600 mb-4">{error}</div>
                      <Button onClick={fetchCampaigns} variant="outline">
                        Réessayer
                      </Button>
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune campagne</h3>
                      <p className="text-gray-600 mb-4">Commencez par créer votre première campagne email.</p>
                      <Button 
                        className="bg-[#81B441] hover:bg-[#6a9636]"
                        onClick={() => openCreateModal()}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Créer une campagne
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                                {getStatusBadge(campaign.status)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{getRecipientTypeLabel(campaign.recipientType)}</span>
                                {campaign.totalRecipients && (
                                  <span>{campaign.totalRecipients} destinataires</span>
                                )}
                                {campaign.scheduledAt && (
                                  <span>Programmé le {new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                                )}
                                {campaign.sentAt && (
                                  <span>Envoyé le {new Date(campaign.sentAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteCampaign(campaign.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates">
              <div className="space-y-6">
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Chargement des templates...</div>
                  </div>
                ) : (
                  <>
                    {/* Section Registration/Participants */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-blue-900">Campagnes pour les participants</CardTitle>
                            <CardDescription className="text-blue-700">Templates pour les participants et inscriptions</CardDescription>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => openCreateModal('participants')}
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Créer un email
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {templates.filter(t => ['CONFIRMATION_INSCRIPTION', 'BIENVENUE_PARTICIPANT', 'RAPPEL_EVENEMENT', 'INFOS_PRATIQUES'].includes(t.category || '')).map((template) => {
                            const { campaign } = getTemplateStatus(template);
                            return (
                              <Link 
                                key={template.id} 
                                href={`/dashboard/events/${eventId}/communication/templates/${template.id}/edit`}
                                className="block"
                              >
                                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                      <div>
                                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                                        <p className="text-sm text-gray-600">{template.subject}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-sm font-medium">
                                        {template.isActive ? (
                                          <span className="text-green-600">● Active</span>
                                        ) : (
                                          <span className="text-gray-500">● Inactive</span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">Participants</div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {campaign && (
                                        <div className="text-xs text-gray-500">
                                          {campaign.totalRecipients || 0} envoyés • {Math.round(((campaign.successCount || 0) / (campaign.totalRecipients || 1)) * 100)}% ouvert
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Section Exhibitors */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-purple-900">Campagnes pour les exposants</CardTitle>
                            <CardDescription className="text-purple-700">Templates pour les exposants</CardDescription>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                            onClick={() => openCreateModal('exposants')}
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Créer un email
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {templates.filter(t => ['GUIDE_EXPOSANT', 'RAPPEL_INSTALLATION', 'INFOS_TECHNIQUES_STAND'].includes(t.category || '')).map((template) => {
                            const { status, campaign } = getTemplateStatus(template);
                            return (
                              <Link 
                                key={template.id} 
                                href={`/dashboard/events/${eventId}/communication/templates/${template.id}/edit`}
                                className="block"
                              >
                                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                      <div>
                                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                                        <p className="text-sm text-gray-600">{template.subject}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-sm font-medium">
                                        {status === 'SENT' ? (
                                          <span className="text-green-600">● Envoyé</span>
                                        ) : status === 'SCHEDULED' ? (
                                          <span className="text-orange-600">● Programmé</span>
                                        ) : template.isActive ? (
                                          <span className="text-green-600">● Active</span>
                                        ) : (
                                          <span className="text-gray-500">● Inactive</span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {status === 'SENT' && campaign ? formatDate(campaign.sentAt || campaign.createdAt) : 
                                         status === 'SCHEDULED' && campaign ? formatDate(campaign.scheduledAt || campaign.createdAt) : 
                                         'En attente'}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {campaign && (
                                        <div className="text-xs text-gray-500">
                                          {campaign.totalRecipients || 0} • {Math.round(((campaign.successCount || 0) / (campaign.totalRecipients || 1)) * 100)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Section Speakers */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-orange-900">Campagnes pour les intervenants</CardTitle>
                            <CardDescription className="text-orange-700">Templates pour les intervenants</CardDescription>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            onClick={() => openCreateModal('speakers')}
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Créer un email
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {templates.filter(t => ['CONFIRMATION_SPEAKER', 'INFOS_TECHNIQUES_PRESENTATION', 'RAPPEL_PRESENTATION'].includes(t.category || '')).map((template) => {
                            const { status, campaign } = getTemplateStatus(template);
                            return (
                              <Link 
                                key={template.id} 
                                href={`/dashboard/events/${eventId}/communication/templates/${template.id}/edit`}
                                className="block"
                              >
                                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                      <div>
                                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                                        <p className="text-sm text-gray-600">{template.subject}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-sm font-medium">
                                        {status === 'SENT' ? (
                                          <span className="text-green-600">● Envoyé</span>
                                        ) : status === 'SCHEDULED' ? (
                                          <span className="text-orange-600">● Programmé</span>
                                        ) : template.isActive ? (
                                          <span className="text-green-600">● Active</span>
                                        ) : (
                                          <span className="text-gray-500">● Inactive</span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {status === 'SENT' && campaign ? formatDate(campaign.sentAt || campaign.createdAt) : 
                                         status === 'SCHEDULED' && campaign ? formatDate(campaign.scheduledAt || campaign.createdAt) : 
                                         'En attente'}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {campaign && (
                                        <div className="text-xs text-gray-500">
                                          {campaign.totalRecipients || 0} • {Math.round(((campaign.successCount || 0) / (campaign.totalRecipients || 1)) * 100)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Section Autres */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-gray-900">Autres campagnes</CardTitle>
                            <CardDescription className="text-gray-700">Templates divers et personnalisés</CardDescription>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-200 text-gray-700 hover:bg-gray-50"
                            onClick={() => openCreateModal('autres')}
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Créer un email
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {templates.filter(t => !['CONFIRMATION_INSCRIPTION', 'BIENVENUE_PARTICIPANT', 'RAPPEL_EVENEMENT', 'INFOS_PRATIQUES', 'GUIDE_EXPOSANT', 'RAPPEL_INSTALLATION', 'INFOS_TECHNIQUES_STAND', 'CONFIRMATION_SPEAKER', 'INFOS_TECHNIQUES_PRESENTATION', 'RAPPEL_PRESENTATION'].includes(t.category || '')).map((template) => {
                            const { status, campaign } = getTemplateStatus(template);
                            return (
                              <Link 
                                key={template.id} 
                                href={`/dashboard/events/${eventId}/communication/templates/${template.id}/edit`}
                                className="block"
                              >
                                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                      <div>
                                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                                        <p className="text-sm text-gray-600">{template.subject}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-sm font-medium">
                                        {status === 'SENT' ? (
                                          <span className="text-green-600">● Envoyé</span>
                                        ) : status === 'SCHEDULED' ? (
                                          <span className="text-orange-600">● Programmé</span>
                                        ) : template.isActive ? (
                                          <span className="text-green-600">● Active</span>
                                        ) : (
                                          <span className="text-gray-500">● Inactive</span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {status === 'SENT' && campaign ? formatDate(campaign.sentAt || campaign.createdAt) : 
                                         status === 'SCHEDULED' && campaign ? formatDate(campaign.scheduledAt || campaign.createdAt) : 
                                         'En attente'}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {campaign && (
                                        <div className="text-xs text-gray-500">
                                          {campaign.totalRecipients || 0} • {Math.round(((campaign.successCount || 0) / (campaign.totalRecipients || 1)) * 100)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal d'envoi d'email */}
      <SendEmailModal
        isOpen={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        eventId={eventId as string}
      />

      {/* Modal de création de template */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-0 shadow-xl">
          <DialogHeader className="bg-gradient-to-r from-[#81B441] to-[#6a9636] text-white p-6 rounded-t-lg -m-6 mb-4">
            <DialogTitle className="text-xl font-semibold text-white">Créer un nouveau template</DialogTitle>
            <DialogDescription className="text-green-50 mt-2">
              Remplissez les champs ci-dessous pour créer un nouveau template email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 px-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-medium text-gray-700">
                Nom *
              </Label>
              <Input
                id="name"
                placeholder="Nom du template"
                className="col-span-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#81B441] focus:ring-opacity-20 shadow-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right font-medium text-gray-700">
                Sujet *
              </Label>
              <Input
                id="subject"
                placeholder="Sujet de l'email"
                className="col-span-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#81B441] focus:ring-opacity-20 shadow-sm"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Description optionnelle du template"
                className="col-span-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#81B441] focus:ring-opacity-20 shadow-sm resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target" className="text-right font-medium text-gray-700">
                Cible *
              </Label>
              <Select
                value={formData.target}
                onValueChange={(value) => setFormData({ ...formData, target: value })}
              >
                <SelectTrigger className="col-span-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#81B441] focus:ring-opacity-20 shadow-sm">
                  <SelectValue placeholder="Sélectionnez une cible" />
                </SelectTrigger>
                <SelectContent className="border-0 shadow-lg">
                  <SelectItem value="participants">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Participants
                    </div>
                  </SelectItem>
                  <SelectItem value="exposants">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Exposants
                    </div>
                  </SelectItem>
                  <SelectItem value="speakers">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Speakers
                    </div>
                  </SelectItem>
                  <SelectItem value="autres">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      Autres
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-3 pt-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              onClick={() => setCreateModalOpen(false)}
              className="border-0 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Annuler
            </Button>
            <Button 
              onClick={createTemplate}
              disabled={creating}
              className="bg-[#81B441] hover:bg-[#6a9636] text-white border-0 shadow-md"
            >
              {creating ? (
                <>
                  <span className="animate-spin mr-2">⚪</span>
                  Création...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Créer le template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 