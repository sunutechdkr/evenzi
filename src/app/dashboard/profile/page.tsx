'use client';

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Database,
  Globe,
  HelpCircle,
  Headphones,
  FileText,
  Edit3,
  Camera,
  X,
  Loader2,
  ChevronRight,
  Trophy,
  Calendar,
  Users,
  Briefcase,
  Phone,
  Mail,
  Building
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface UserStats {
  gamification: {
    totalPoints: number;
    description: string;
  };
  sessions: {
    participated: number;
    description: string;
  };
  appointments: {
    total: number;
    requested: number;
    received: number;
    description: string;
  };
  contacts: {
    unique: number;
    description: string;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    user,
    isLoading,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar
  } = useProfile();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour le formulaire d'édition
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    jobTitle: '',
    company: '',
    bio: ''
  });

  // Gérer la redirection si pas de session
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  // Charger le profil et les stats
  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
      loadStats();
    }
  }, [session?.user?.email, fetchProfile]);

  // Initialiser le formulaire quand user est chargé
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        jobTitle: (user as any).jobTitle || '',
        company: (user as any).company || '',
        bio: (user as any).bio || ''
      });
    }
  }, [user]);

  // Charger les statistiques
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Récupérer les initiales
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

  // Gestion de l'upload d'avatar
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille (1MB max)
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 1MB)');
        return;
      }

      try {
        await uploadAvatar(file);
        toast.success('Avatar mis à jour !');
      } catch (error) {
        console.error('Erreur upload:', error);
      }
    }
  };

  // Sauvegarder les modifications du profil
  const handleSaveProfile = async () => {
    try {
      // Valider la bio (max 300 caractères)
      if (editForm.bio && editForm.bio.length > 300) {
        toast.error('La bio ne peut pas dépasser 300 caractères');
        return;
      }

      await updateProfile(editForm);
      setShowEditModal(false);
      toast.success('Profil mis à jour !');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Afficher un loader pendant le chargement
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#81B441]" />
      </div>
    );
  }

  // Si pas de session, ne rien afficher
  if (status === 'unauthenticated' || !session) {
    return null;
  }

  const menuItems = [
    {
      icon: Shield,
      label: 'Confidentialité et Sécurité',
      href: '/dashboard/profile/security',
      description: 'Gérer votre mot de passe et vos paramètres de sécurité'
    },
    {
      icon: Database,
      label: 'Données et Stockage',
      href: '/dashboard/profile/data',
      description: 'Gérer vos données personnelles et téléchargements'
    },
    {
      icon: Globe,
      label: 'Langage',
      href: '/dashboard/profile/language',
      description: 'Choisir votre langue préférée'
    },
    {
      icon: HelpCircle,
      label: 'FAQs',
      href: '/faq',
      description: 'Questions fréquemment posées'
    },
    {
      icon: Headphones,
      label: 'Support',
      href: '/support',
      description: 'Contacter notre équipe d\'assistance'
    },
    {
      icon: FileText,
      label: 'Termes et Conditions',
      href: '/terms',
      description: 'Consulter nos conditions d\'utilisation'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* En-tête avec avatar et infos principales */}
        <Card className="mb-6 overflow-hidden border-2 border-[#81B441]/10 shadow-lg">
          <CardContent className="p-0">
            {/* Bannière gradient */}
            <div className="h-32 bg-gradient-to-r from-[#81B441] to-[#6a9636]" />
            
            {/* Contenu du profil */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="flex flex-col items-center -mt-16 mb-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage src={user?.image || session?.user?.image || undefined} alt={user?.name || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-[#81B441] to-[#6a9636] text-white text-3xl font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-[#81B441] text-white p-3 rounded-full hover:bg-[#6a9636] transition-all duration-200 shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  {user?.image && (
                    <button
                      onClick={deleteAvatar}
                      className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Informations principales */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {user?.name || session?.user?.name || 'Utilisateur'}
                </h1>
                
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  {(user as any)?.jobTitle && (
                    <>
                      <Briefcase className="h-4 w-4" />
                      <span>{(user as any).jobTitle}</span>
                    </>
                  )}
                  {(user as any)?.company && (user as any)?.jobTitle && (
                    <span className="text-gray-400">•</span>
                  )}
                  {(user as any)?.company && (
                    <>
                      <Building className="h-4 w-4" />
                      <span>{(user as any).company}</span>
                    </>
                  )}
                </div>

                {user?.phone && (
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email || session?.user?.email}</span>
                </div>

                {user?.role && (
                  <Badge 
                    variant="outline" 
                    className="mt-2 bg-[#81B441]/10 text-[#81B441] border-[#81B441] px-4 py-1"
                  >
                    {user.role}
                  </Badge>
                )}
              </div>

              {/* Bio */}
              {(user as any)?.bio && (
                <div className="mt-6 text-center">
                  <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
                    {(user as any).bio}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              {!loadingStats && stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {/* Gamification */}
                  <div className="bg-gradient-to-br from-[#81B441]/10 to-[#81B441]/5 rounded-xl p-4 text-center border border-[#81B441]/20">
                    <div className="flex justify-center mb-2">
                      <div className="p-3 bg-[#81B441] rounded-full">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.gamification.totalPoints}</p>
                    <p className="text-sm text-gray-600 mt-1">Points</p>
                  </div>

                  {/* Sessions */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 text-center border border-blue-200">
                    <div className="flex justify-center mb-2">
                      <div className="p-3 bg-blue-500 rounded-full">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.sessions.participated}</p>
                    <p className="text-sm text-gray-600 mt-1">Sessions</p>
                  </div>

                  {/* Rendez-vous */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 text-center border border-purple-200">
                    <div className="flex justify-center mb-2">
                      <div className="p-3 bg-purple-500 rounded-full">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.appointments.total}</p>
                    <p className="text-sm text-gray-600 mt-1">Rendez-vous</p>
                  </div>

                  {/* Contacts */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 text-center border border-orange-200">
                    <div className="flex justify-center mb-2">
                      <div className="p-3 bg-orange-500 rounded-full">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.contacts.unique}</p>
                    <p className="text-sm text-gray-600 mt-1">Contacts</p>
                  </div>
                </div>
              )}

              {/* CTA Modifier profil */}
              <div className="mt-6">
                <Button 
                  onClick={() => setShowEditModal(true)}
                  className="w-full bg-[#81B441] hover:bg-[#6a9636] text-white py-6 text-lg font-semibold shadow-lg"
                >
                  <Edit3 className="h-5 w-5 mr-2" />
                  Modifier mon profil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu des paramètres */}
        <Card className="border-2 border-gray-100 shadow-lg">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => router.push(item.href)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#81B441]/10 transition-colors">
                        <Icon className="h-5 w-5 text-gray-600 group-hover:text-[#81B441] transition-colors" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#81B441] transition-colors" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal d'édition du profil */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Modifier mon profil
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Mettez à jour vos informations personnelles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nom complet */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nom complet *
              </Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Jean Dupont"
                className="w-full"
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Téléphone
              </Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+33 6 12 34 56 78"
                className="w-full"
              />
            </div>

            <Separator />

            {/* Fonction */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
                Fonction
              </Label>
              <Input
                id="jobTitle"
                value={editForm.jobTitle}
                onChange={(e) => setEditForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="Développeur Full Stack"
                maxLength={100}
                className="w-full"
              />
            </div>

            {/* Entreprise */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                Entreprise
              </Label>
              <Input
                id="company"
                value={editForm.company}
                onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Evenzi Inc."
                maxLength={100}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                Bio (max 300 caractères)
              </Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Parlez-nous de vous en quelques mots..."
                maxLength={300}
                rows={4}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-500 text-right">
                {editForm.bio.length}/300 caractères
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditModal(false)}
              className="mr-2"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={isLoading || !editForm.name}
              className="bg-[#81B441] hover:bg-[#6a9636]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
