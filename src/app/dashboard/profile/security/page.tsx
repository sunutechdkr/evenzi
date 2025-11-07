'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Lock,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function SecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation du mot de passe
  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Mot de passe actuel requis';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'Nouveau mot de passe requis';
    } else {
      if (passwordForm.newPassword.length < 8) {
        newErrors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
      } else if (!/[A-Z]/.test(passwordForm.newPassword)) {
        newErrors.newPassword = 'Le mot de passe doit contenir au moins une majuscule';
      } else if (!/[a-z]/.test(passwordForm.newPassword)) {
        newErrors.newPassword = 'Le mot de passe doit contenir au moins une minuscule';
      } else if (!/[0-9]/.test(passwordForm.newPassword)) {
        newErrors.newPassword = 'Le mot de passe doit contenir au moins un chiffre';
      } else if (!/[^A-Za-z0-9]/.test(passwordForm.newPassword)) {
        newErrors.newPassword = 'Le mot de passe doit contenir au moins un caractère spécial';
      }
    }
    
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sauvegarder le nouveau mot de passe
  const handleSavePassword = async () => {
    if (!validatePassword()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'password',
          ...passwordForm
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification du mot de passe');
      }

      toast.success('Mot de passe modifié avec succès !');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#81B441]" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
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
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-[#81B441]/10 rounded-lg">
              <Shield className="h-6 w-6 text-[#81B441]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Confidentialité et Sécurité
            </h1>
          </div>
          <p className="text-gray-600 ml-14">
            Gérez votre mot de passe et vos paramètres de sécurité
          </p>
        </div>

        {/* Alerte de sécurité */}
        <Alert className="mb-6 border-[#81B441]/20 bg-[#81B441]/5">
          <Lock className="h-4 w-4 text-[#81B441]" />
          <AlertDescription className="text-gray-700">
            Votre mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial.
          </AlertDescription>
        </Alert>

        {/* Formulaire de modification du mot de passe */}
        <Card className="border-2 border-gray-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Lock className="h-5 w-5 mr-2 text-[#81B441]" />
              Modifier le mot de passe
            </CardTitle>
            <CardDescription>
              Changez votre mot de passe pour sécuriser votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mot de passe actuel */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                Mot de passe actuel *
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => {
                    setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
                    if (errors.currentPassword) {
                      setErrors(prev => ({ ...prev, currentPassword: '' }));
                    }
                  }}
                  placeholder="Entrez votre mot de passe actuel"
                  className={errors.currentPassword ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                Nouveau mot de passe *
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
                    if (errors.newPassword) {
                      setErrors(prev => ({ ...prev, newPassword: '' }));
                    }
                  }}
                  placeholder="Minimum 8 caractères"
                  className={errors.newPassword ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirmer le mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmer le nouveau mot de passe *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => {
                    setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="Répétez le nouveau mot de passe"
                  className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Bouton Sauvegarder */}
            <div className="pt-4">
              <Button 
                onClick={handleSavePassword}
                disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="w-full bg-[#81B441] hover:bg-[#6a9636] text-white py-6 text-lg font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Modification en cours...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Modifier le mot de passe
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conseils de sécurité */}
        <Card className="mt-6 border-2 border-blue-100 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">
              Conseils de sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>• Ne partagez jamais votre mot de passe avec qui que ce soit</p>
            <p>• Utilisez un mot de passe unique pour chaque service</p>
            <p>• Changez régulièrement votre mot de passe</p>
            <p>• Évitez d'utiliser des informations personnelles dans votre mot de passe</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

