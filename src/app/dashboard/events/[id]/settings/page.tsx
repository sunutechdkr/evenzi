"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Cog6ToothIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  LinkIcon,
  CloudArrowUpIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function EventSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [settings, setSettings] = useState({
    // Informations générales
    name: "Sommet Tech 2024",
    description: "Le plus grand événement technologique de l'année",
    location: "Centre de Congrès, Paris",
    timezone: "Europe/Paris",
    language: "fr",
    currency: "EUR",
    
    // Paramètres d'inscription
    registrationEnabled: true,
    registrationDeadline: "2024-12-15",
    maxParticipants: 500,
    requireApproval: false,
    allowWaitlist: true,
    emailConfirmation: true,
    
    // Networking
    networkingEnabled: true,
    allowPrivateMessages: true,
    autoMatchmaking: false,
    requireProfileCompletion: true,
    
    // Communication
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newsletterSignup: true,
    
    // Branding
    primaryColor: "#81B441",
    logo: null,
    banner: null,
    customDomain: "",
    
    // Sécurité
    twoFactorEnabled: false,
    dataRetention: "2years",
    gdprCompliant: true,
    
    // Intégrations
    googleAnalytics: "",
    zoomIntegration: false,
    calendlyIntegration: false,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Logique de sauvegarde
    console.log("Saving settings:", settings);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <EventSidebar 
        eventId={params.id} 
        onExpandChange={setIsSidebarExpanded}
      />
      
      {/* Contenu principal */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-0'} overflow-auto`}>
        {/* En-tête */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#81B441]/10 rounded-lg">
                <Cog6ToothIcon className="h-6 w-6 text-[#81B441]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Réglages de l&apos;événement</h1>
                <p className="text-gray-600">Configurez tous les aspects de votre événement</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <EyeIcon className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
              <Button onClick={handleSave} className="bg-[#81B441] hover:bg-[#6a9636] text-white">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general" className="flex items-center space-x-2">
                <GlobeAltIcon className="h-4 w-4" />
                <span>Général</span>
              </TabsTrigger>
              <TabsTrigger value="registration" className="flex items-center space-x-2">
                <UserGroupIcon className="h-4 w-4" />
                <span>Inscription</span>
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex items-center space-x-2">
                <EnvelopeIcon className="h-4 w-4" />
                <span>Communication</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center space-x-2">
                <PaintBrushIcon className="h-4 w-4" />
                <span>Branding</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-4 w-4" />
                <span>Sécurité</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center space-x-2">
                <LinkIcon className="h-4 w-4" />
                <span>Intégrations</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Général */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de l&apos;événement</CardTitle>
                  <CardDescription>
                    Configurez les informations de base de votre événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventName">Nom de l&apos;événement</Label>
                      <Input
                        id="eventName"
                        value={settings.name}
                        onChange={(e) => handleSettingChange('name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Lieu</Label>
                      <Input
                        id="location"
                        value={settings.location}
                        onChange={(e) => handleSettingChange('location', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      value={settings.description}
                      onChange={(e) => handleSettingChange('description', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuseau horaire</Label>
                      <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Langue</Label>
                      <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Devise</Label>
                      <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de visibilité</CardTitle>
                  <CardDescription>
                    Contrôlez qui peut voir et accéder à votre événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Événement public</Label>
                      <p className="text-sm text-gray-600">Votre événement sera visible dans les recherches publiques</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Indexation moteurs de recherche</Label>
                      <p className="text-sm text-gray-600">Permet aux moteurs de recherche d&apos;indexer votre événement</p>
                    </div>
                    <Switch checked={false} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Inscription */}
            <TabsContent value="registration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres d&apos;inscription</CardTitle>
                  <CardDescription>
                    Configurez le processus d&apos;inscription à votre événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Inscriptions ouvertes</Label>
                      <p className="text-sm text-gray-600">Permettre aux participants de s&apos;inscrire</p>
                    </div>
                    <Switch 
                      checked={settings.registrationEnabled}
                      onCheckedChange={(checked) => handleSettingChange('registrationEnabled', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Date limite d&apos;inscription</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={settings.registrationDeadline}
                        onChange={(e) => handleSettingChange('registrationDeadline', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxParticipants">Nombre maximum de participants</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        value={settings.maxParticipants}
                        onChange={(e) => handleSettingChange('maxParticipants', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Approbation manuelle</Label>
                        <p className="text-sm text-gray-600">Approuver manuellement chaque inscription</p>
                      </div>
                      <Switch 
                        checked={settings.requireApproval}
                        onCheckedChange={(checked) => handleSettingChange('requireApproval', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Liste d&apos;attente</Label>
                        <p className="text-sm text-gray-600">Permettre une liste d&apos;attente si l&apos;événement est complet</p>
                      </div>
                      <Switch 
                        checked={settings.allowWaitlist}
                        onCheckedChange={(checked) => handleSettingChange('allowWaitlist', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Confirmation par email</Label>
                        <p className="text-sm text-gray-600">Envoyer un email de confirmation après inscription</p>
                      </div>
                      <Switch 
                        checked={settings.emailConfirmation}
                        onCheckedChange={(checked) => handleSettingChange('emailConfirmation', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Networking et rendez-vous</CardTitle>
                  <CardDescription>
                    Paramètres pour les fonctionnalités de networking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Networking activé</Label>
                      <p className="text-sm text-gray-600">Permettre aux participants de prendre des rendez-vous</p>
                    </div>
                    <Switch 
                      checked={settings.networkingEnabled}
                      onCheckedChange={(checked) => handleSettingChange('networkingEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Messages privés</Label>
                      <p className="text-sm text-gray-600">Permettre l&apos;envoi de messages privés entre participants</p>
                    </div>
                    <Switch 
                      checked={settings.allowPrivateMessages}
                      onCheckedChange={(checked) => handleSettingChange('allowPrivateMessages', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Profil complet requis</Label>
                      <p className="text-sm text-gray-600">Exiger un profil complet pour accéder au networking</p>
                    </div>
                    <Switch 
                      checked={settings.requireProfileCompletion}
                      onCheckedChange={(checked) => handleSettingChange('requireProfileCompletion', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Communication */}
            <TabsContent value="communication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Gérez les préférences de notification pour votre événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <div className="space-y-0.5">
                        <Label>Notifications par email</Label>
                        <p className="text-sm text-gray-600">Envoyer des notifications par email</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                      <div className="space-y-0.5">
                        <Label>Notifications SMS</Label>
                        <p className="text-sm text-gray-600">Envoyer des notifications par SMS</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BellIcon className="h-5 w-5 text-gray-400" />
                      <div className="space-y-0.5">
                        <Label>Notifications push</Label>
                        <p className="text-sm text-gray-600">Envoyer des notifications push</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Templates d&apos;emails</CardTitle>
                  <CardDescription>
                    Personnalisez vos templates d&apos;emails automatiques
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Email de confirmation</p>
                        <p className="text-sm text-gray-600">Envoyé après inscription</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Email de rappel</p>
                        <p className="text-sm text-gray-600">Envoyé avant l&apos;événement</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Email de remerciement</p>
                        <p className="text-sm text-gray-600">Envoyé après l&apos;événement</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Branding */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Identité visuelle</CardTitle>
                  <CardDescription>
                    Personnalisez l&apos;apparence de votre événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Couleur principale</Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        placeholder="#81B441"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Logo de l&apos;événement</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Glissez votre logo ici ou cliquez pour parcourir</p>
                        <p className="text-xs text-gray-500">PNG, JPG jusqu&apos;à 2MB</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Bannière de l&apos;événement</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Glissez votre bannière ici ou cliquez pour parcourir</p>
                        <p className="text-xs text-gray-500">PNG, JPG jusqu&apos;à 5MB - 1920x400px recommandé</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customDomain">Domaine personnalisé</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="customDomain"
                        placeholder="mon-evenement.com"
                        value={settings.customDomain}
                        onChange={(e) => handleSettingChange('customDomain', e.target.value)}
                      />
                      <Badge variant="secondary">Optionnel</Badge>
                    </div>
                    <p className="text-xs text-gray-500">Utilisez votre propre domaine pour la page d&apos;inscription</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Sécurité */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sécurité et confidentialité</CardTitle>
                  <CardDescription>
                    Paramètres de sécurité pour votre événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Authentification à deux facteurs</Label>
                      <p className="text-sm text-gray-600">Exiger la 2FA pour les organisateurs</p>
                    </div>
                    <Switch 
                      checked={settings.twoFactorEnabled}
                      onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataRetention">Rétention des données</Label>
                    <Select value={settings.dataRetention} onValueChange={(value) => handleSettingChange('dataRetention', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1year">1 an</SelectItem>
                        <SelectItem value="2years">2 ans</SelectItem>
                        <SelectItem value="5years">5 ans</SelectItem>
                        <SelectItem value="indefinite">Indéfinie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Conformité RGPD</Label>
                      <p className="text-sm text-gray-600">Appliquer les règles RGPD</p>
                    </div>
                    <Switch 
                      checked={settings.gdprCompliant}
                      onCheckedChange={(checked) => handleSettingChange('gdprCompliant', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    Zone de danger
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    Actions irréversibles - procédez avec prudence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">Supprimer l&apos;événement</p>
                        <p className="text-sm text-red-600">Cette action est irréversible</p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Intégrations */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Outils d&apos;analyse</CardTitle>
                  <CardDescription>
                    Connectez vos outils d&apos;analyse préférés
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                    <Input
                      id="googleAnalytics"
                      placeholder="GA-XXXXXXXXX-X"
                      value={settings.googleAnalytics}
                      onChange={(e) => handleSettingChange('googleAnalytics', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Intégrations tierces</CardTitle>
                  <CardDescription>
                    Connectez vos applications favorites
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <LinkIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Zoom</p>
                        <p className="text-sm text-gray-600">Intégration vidéo</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.zoomIntegration}
                      onCheckedChange={(checked) => handleSettingChange('zoomIntegration', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <LinkIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Calendly</p>
                        <p className="text-sm text-gray-600">Planification de rendez-vous</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.calendlyIntegration}
                      onCheckedChange={(checked) => handleSettingChange('calendlyIntegration', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 