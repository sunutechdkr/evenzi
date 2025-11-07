'use client';

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Mail,
  Edit3,
  LogOut,
  ArrowLeft,
  Check,
  Camera,
  X,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";

type ProfileSection = 'profile' | 'plan' | 'security';

// Fonction pour obtenir les fonctionnalités selon le plan
const getPlanFeatures = (plan: string) => {
  const features = {
    STARTER: [
      { name: "1 événement actif", description: "Organisez un événement à la fois" },
      { name: "100 participants max", description: "Jusqu'à 100 inscriptions par événement" },
      { name: "Support par email", description: "Assistance par email sous 48h" },
      { name: "QR codes basiques", description: "Génération de QR codes pour le check-in" }
    ],
    PRO: [
      { name: "5 événements actifs", description: "Organisez jusqu'à 5 événements simultanément" },
      { name: "1000 participants max", description: "Jusqu'à 1000 inscriptions par événement" },
      { name: "Support prioritaire", description: "Assistance prioritaire sous 24h" },
      { name: "QR codes avancés", description: "QR codes avec informations détaillées" },
      { name: "Analytics avancées", description: "Statistiques détaillées sur vos événements" },
      { name: "Personnalisation", description: "Logos et couleurs personnalisés" }
    ],
    PREMIUM: [
      { name: "Événements illimités", description: "Aucune limite sur le nombre d'événements" },
      { name: "Participants illimités", description: "Aucune limite d'inscriptions" },
      { name: "Support VIP 24/7", description: "Assistance prioritaire par téléphone et email" },
      { name: "API complète", description: "Accès total à l'API Evenzi" },
      { name: "Analytics premium", description: "Rapports avancés et exports personnalisés" },
      { name: "White label", description: "Interface complètement personnalisée" },
      { name: "Intégrations avancées", description: "Connecteurs CRM et outils marketing" },
      { name: "Formation dédiée", description: "Sessions de formation personnalisées" }
    ]
  };

  return features[plan as keyof typeof features] || features.STARTER;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    user,
    isLoading,
    fetchProfile,
    updateProfile,
    updateEmail,
    updatePassword,
    uploadAvatar,
    deleteAvatar
  } = useProfile();

  const [activeSection, setActiveSection] = useState<ProfileSection>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour les formulaires
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: ''
  });

  const [emailForm, setEmailForm] = useState({
    email: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // États de validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Gérer la redirection côté client si pas de session
  useEffect(() => {
    if (status === 'loading') return; // Encore en cours de chargement
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  // Charger le profil au montage
  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
    }
  }, [session?.user?.email, fetchProfile]);

  // Initialiser les formulaires quand user est chargé
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || ''
      });
      setEmailForm({
        email: user.email || ''
      });
    }
  }, [user]);

  // Afficher un loader pendant que la session se charge
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Si pas de session, ne rien afficher (la redirection va se faire)
  if (status === 'unauthenticated' || !session) {
    return null;
  }

  // Validation des formulaires
  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    
    if (!profileForm.name.trim()) {
      errors.name = 'Le nom est requis';
    }
    
    if (profileForm.phone && !/^[+]?[0-9\s\-\(\)]+$/.test(profileForm.phone)) {
      errors.phone = 'Format de téléphone invalide';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (user?.password && !passwordForm.currentPassword) {
      errors.currentPassword = 'Mot de passe actuel requis';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Nouveau mot de passe requis';
    } else {
      // Validation de la force du mot de passe
      if (passwordForm.newPassword.length < 8) {
        errors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
      } else if (!/[A-Z]/.test(passwordForm.newPassword)) {
        errors.newPassword = 'Le mot de passe doit contenir au moins une majuscule';
      } else if (!/[a-z]/.test(passwordForm.newPassword)) {
        errors.newPassword = 'Le mot de passe doit contenir au moins une minuscule';
      } else if (!/[0-9]/.test(passwordForm.newPassword)) {
        errors.newPassword = 'Le mot de passe doit contenir au moins un chiffre';
      } else if (!/[^A-Za-z0-9]/.test(passwordForm.newPassword)) {
        errors.newPassword = 'Le mot de passe doit contenir au moins un caractère spécial';
      }
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Confirmation requise';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Récupérer les initiales de l'utilisateur
  const getUserInitials = () => {
    const name = user?.name || session?.user?.name;
    const email = user?.email || session?.user?.email;
    
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Menu items filtré selon le rôle
  const getMenuItems = () => {
    const baseItems = [
      {
        id: 'profile' as ProfileSection,
        label: 'Profil',
        icon: User,
        description: 'Gérer vos informations personnelles'
      }
    ];

    // Ajouter l'onglet Plan pour les ORGANIZER uniquement
    if (user?.role === 'ORGANIZER') {
      baseItems.push({
        id: 'plan' as ProfileSection,
        label: 'Plan',
        icon: CreditCard,
        description: 'Votre plan d&apos;abonnement'
      });
    }

    baseItems.push({
      id: 'security' as ProfileSection,
      label: 'Sécurité',
      icon: Shield,
      description: 'Mot de passe et sécurité'
    });

    return baseItems;
  };

  // Handlers
  const handleProfileSave = async () => {
    if (!validateProfileForm()) return;
    
    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
      setFormErrors({});
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEmailSave = async () => {
    try {
      await updateEmail(emailForm);
      setIsEditingEmail(false);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handlePasswordSave = async () => {
    if (!validatePasswordForm()) return;
    
    setPasswordLoading(true);
    try {
      await updatePassword(passwordForm);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setFormErrors({});
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadAvatar(file);
      } catch (error) {
        console.error('Erreur upload:', error);
      }
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar();
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleSignOut = () => {
    signOut({ redirect: true, callbackUrl: '/' });
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#81B441]"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard"
              className="flex items-center text-gray-600 hover:text-[#81B441] transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span>Retour au dashboard</span>
            </Link>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mon compte</CardTitle>
                <CardDescription>
                  Gérez vos informations de compte
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {getMenuItems().map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${
                          activeSection === item.id
                            ? 'bg-[#81B441]/10 text-[#81B441] border-r-2 border-[#81B441]'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Section Profil */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                {/* Profile Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Détails du profil</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar et informations de base */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="h-16 w-16 border-4 border-[#81B441]/20">
                            <AvatarImage src={user?.image || session?.user?.image || undefined} />
                            <AvatarFallback className="bg-[#81B441] text-white text-xl font-bold">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 bg-[#81B441] text-white p-1.5 rounded-full hover:bg-[#81B441]/80 transition-colors"
                          >
                            <Camera className="h-3 w-3" />
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user?.name || session?.user?.name || 'Utilisateur'}
                          </h3>
                          <p className="text-gray-500">{user?.email || session?.user?.email}</p>
                          {(user?.role || session?.user?.role) && (
                            <Badge 
                              variant="outline" 
                              className="mt-1 bg-[#81B441]/10 text-[#81B441] border-[#81B441]"
                            >
                              {user?.role || session?.user?.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user?.image && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteAvatar}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          onClick={() => setIsEditingProfile(!isEditingProfile)}
                          className="border-[#81B441] text-[#81B441] hover:bg-[#81B441]/10"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {isEditingProfile ? 'Annuler' : 'Modifier'}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Formulaire de modification du profil */}
                    {isEditingProfile ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Nom complet</Label>
                            <Input
                              id="name"
                              value={profileForm.name}
                              onChange={(e) => {
                                setProfileForm(prev => ({ ...prev, name: e.target.value }));
                                if (formErrors.name) {
                                  setFormErrors(prev => ({ ...prev, name: '' }));
                                }
                              }}
                              placeholder="Votre nom complet"
                              className={formErrors.name ? 'border-red-500' : ''}
                            />
                            {formErrors.name && (
                              <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input
                              id="phone"
                              value={profileForm.phone}
                              onChange={(e) => {
                                setProfileForm(prev => ({ ...prev, phone: e.target.value }));
                                if (formErrors.phone) {
                                  setFormErrors(prev => ({ ...prev, phone: '' }));
                                }
                              }}
                              placeholder="+33 6 12 34 56 78"
                              className={formErrors.phone ? 'border-red-500' : ''}
                            />
                            {formErrors.phone && (
                              <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsEditingProfile(false);
                              setFormErrors({});
                            }}
                          >
                            Annuler
                          </Button>
                          <Button 
                            onClick={handleProfileSave}
                            disabled={isLoading}
                            className="bg-[#81B441] hover:bg-[#81B441]/90"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Nom complet</Label>
                          <p className="mt-1 text-gray-900">{user?.name || 'Non renseigné'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Téléphone</Label>
                          <p className="mt-1 text-gray-900">{user?.phone || 'Non renseigné'}</p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Email Addresses */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">Adresse email</h4>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingEmail(!isEditingEmail)}
                          className="border-[#81B441] text-[#81B441] hover:bg-[#81B441]/10"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {isEditingEmail ? 'Annuler' : 'Modifier'}
                        </Button>
                      </div>

                      {isEditingEmail ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="email">Nouvel email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={emailForm.email}
                              onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="nouveau@email.com"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditingEmail(false)}
                            >
                              Annuler
                            </Button>
                            <Button 
                              onClick={handleEmailSave}
                              disabled={isLoading}
                              className="bg-[#81B441] hover:bg-[#81B441]/90"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Modifier l&apos;email
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Mail className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">{user?.email}</p>
                                <p className="text-sm text-gray-500">Email principal</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Check className="h-3 w-3 mr-1" />
                              Vérifié
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section Plan - Uniquement pour ORGANIZER */}
            {activeSection === 'plan' && user?.role === 'ORGANIZER' && (
              <div className="space-y-6">
                {/* Plan actuel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Mon plan d&apos;abonnement</CardTitle>
                    <CardDescription>
                      Votre plan actuel et ses fonctionnalités incluses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Plan Badge */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#81B441]/10 to-[#81B441]/5 rounded-lg border border-[#81B441]/20">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-[#81B441] rounded-full">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Plan {user?.plan || 'STARTER'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {user?.plan === 'PRO' && 'Plan professionnel - 29€/mois'}
                            {user?.plan === 'PREMIUM' && 'Plan premium - 99€/mois'}
                            {(!user?.plan || user?.plan === 'STARTER') && 'Plan gratuit'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          user?.plan === 'PRO' ? 'border-[#81B441] text-[#81B441] bg-[#81B441]/10' :
                          user?.plan === 'PREMIUM' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                          'border-gray-500 text-gray-700 bg-gray-50'
                        }
                      >
                        {user?.plan === 'PRO' && 'Professionnel'}
                        {user?.plan === 'PREMIUM' && 'Premium'}
                        {(!user?.plan || user?.plan === 'STARTER') && 'Gratuit'}
                      </Badge>
                    </div>

                    {/* Fonctionnalités du plan */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Fonctionnalités incluses</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getPlanFeatures(user?.plan || 'STARTER').map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                            <div className="flex-shrink-0 mt-0.5">
                              <Check className="h-4 w-4 text-[#81B441]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                              <p className="text-xs text-gray-600">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Note importante */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Gestion des plans</h4>
                          <p className="text-sm text-blue-700">
                            Les modifications de plan sont gérées par l&apos;équipe d&apos;administration. 
                            Contactez le support pour changer votre plan d&apos;abonnement.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section Sécurité */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                {/* Mot de passe */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Mot de passe</CardTitle>
                    <CardDescription>
                      {user?.password ? 'Modifiez votre mot de passe' : 'Créez un mot de passe pour votre compte'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user?.password && (
                      <div>
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => {
                              setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
                              if (formErrors.currentPassword) {
                                setFormErrors(prev => ({ ...prev, currentPassword: '' }));
                              }
                            }}
                            placeholder="Entrez votre mot de passe actuel"
                            className={formErrors.currentPassword ? 'border-red-500' : ''}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {formErrors.currentPassword && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.currentPassword}</p>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
                            if (formErrors.newPassword) {
                              setFormErrors(prev => ({ ...prev, newPassword: '' }));
                            }
                          }}
                          placeholder="Minimum 8 caractères"
                          className={formErrors.newPassword ? 'border-red-500' : ''}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formErrors.newPassword && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => {
                            setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                            if (formErrors.confirmPassword) {
                              setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
                            }
                          }}
                          placeholder="Répétez le nouveau mot de passe"
                          className={formErrors.confirmPassword ? 'border-red-500' : ''}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formErrors.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.confirmPassword}</p>
                      )}
                    </div>

                    <Button 
                      onClick={handlePasswordSave}
                      disabled={passwordLoading || !passwordForm.newPassword || !passwordForm.confirmPassword}
                      className="bg-[#81B441] hover:bg-[#81B441]/90 transition-all duration-200"
                    >
                      {passwordLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {user?.password ? 'Modifier le mot de passe' : 'Créer le mot de passe'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Plans - Uniquement pour ORGANIZER */}
                {/* REMOVED: Plan management moved to admin user management */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <span>Sécurisé par</span>
            <span className="ml-2 font-semibold text-[#81B441]">Evenzi</span>
          </div>
        </div>
      </footer>
    </div>
  );
} 