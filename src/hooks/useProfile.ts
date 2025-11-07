import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  password: string | null;
  plan: 'STARTER' | 'PRO' | 'PREMIUM';
  role: 'USER' | 'STAFF' | 'ORGANIZER' | 'ADMIN';
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileData {
  name?: string;
  phone?: string;
  image?: string;
}

interface EmailData {
  email: string;
}

interface PasswordData {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

interface PlanData {
  plan: 'STARTER' | 'PRO' | 'PREMIUM';
}

export function useProfile() {
  const { data: session, update: updateSession } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le profil complet
  const fetchProfile = useCallback(async () => {
    if (!session?.user?.email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération du profil');
      }
      
      setUser(data.user);
      return data.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email]);

  // Mettre à jour le profil
  const updateProfile = useCallback(async (data: ProfileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'profile', ...data }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }
      
      setUser(result.user);
      await updateSession(); // Mettre à jour la session NextAuth
      toast.success(result.message);
      return result.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateSession]);

  // Mettre à jour l'email
  const updateEmail = useCallback(async (data: EmailData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'email', ...data }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour de l\'email');
      }
      
      setUser(result.user);
      await updateSession(); // Mettre à jour la session NextAuth
      toast.success(result.message);
      return result.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateSession]);

  // Mettre à jour le mot de passe
  const updatePassword = useCallback(async (data: PasswordData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'password', ...data }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour du mot de passe');
      }
      
      toast.success(result.message);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mettre à jour le plan (ORGANIZER seulement)
  const updatePlan = useCallback(async (data: PlanData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'plan', ...data }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour du plan');
      }
      
      setUser(result.user);
      await updateSession(); // Mettre à jour la session NextAuth
      toast.success(result.message);
      return result.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateSession]);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'upload');
      }
      
      setUser(result.user);
      // Mettre à jour la session NextAuth avec la nouvelle image
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: result.user.image,
        },
      });
      toast.success(result.message);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateSession, session]);

  // Supprimer avatar
  const deleteAvatar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/upload-avatar', {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
      
      setUser(result.user);
      // Mettre à jour la session NextAuth en supprimant l'image
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: null,
        },
      });
      toast.success(result.message);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateSession, session]);

  return {
    user,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    updateEmail,
    updatePassword,
    updatePlan,
    uploadAvatar,
    deleteAvatar,
  };
} 