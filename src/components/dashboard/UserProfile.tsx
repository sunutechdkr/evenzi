'use client';

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  UserCircleIcon,
  ChevronRightIcon,
  LogOut
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/**
 * Composant UserProfile - Profil utilisateur pour la sidebar
 */
export function UserProfile({ isExpanded = true }: { isExpanded: boolean }) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userImage, setUserImage] = useState<string | null | undefined>(null);
  
  // Récupérer l'image depuis la session (mise à jour après upload)
  useEffect(() => {
    setUserImage(session?.user?.image);
  }, [session?.user?.image]);
  
  // Récupérer les initiales de l'utilisateur pour l'avatar
  const getUserInitials = () => {
    if (session?.user?.name) {
      const nameParts = session.user.name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      }
      return session.user.name.charAt(0).toUpperCase();
    } else if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  // Fonction pour déconnexion
  const handleSignOut = () => {
    signOut({ redirect: true, callbackUrl: '/' });
  };

  // Fonction pour aller au profil
  const handleGoToProfile = () => {
    router.push('/dashboard/profile');
  };
  
  // Si aucune session, ne pas afficher
  if (!session) {
    return null;
  }
  
  return (
    <>
      <div className="px-3 mb-2">
        {isExpanded ? (
          <div className="bg-gray-700 rounded-lg p-3 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 border-l-2 border-[#81B441]">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10 border-2 border-[#81B441]">
                  <AvatarImage src={userImage || undefined} alt={session?.user?.name || 'User'} />
                  <AvatarFallback className="bg-gradient-to-r from-[#81B441] to-[#6a9636] text-white font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session.user?.name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session.user?.email}
                </p>
                {session.user?.role && (
                  <Badge 
                    variant="outline" 
                    className="mt-1 text-xs bg-[#81B441]/20 text-[#81B441] border-[#81B441]/50"
                  >
                    {session.user.role}
                  </Badge>
                )}
              </div>
              <div>
                <button 
                  onClick={handleGoToProfile}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button 
                onClick={handleGoToProfile}
                className="text-xs bg-[#81B441]/20 hover:bg-[#81B441]/30 text-white py-1 px-2 rounded transition-colors hover:shadow-md"
              >
                Profil
              </button>
              <button 
                onClick={handleSignOut}
                className="text-xs bg-gray-800 hover:bg-gray-900 text-white py-1 px-2 rounded transition-colors hover:shadow-md"
              >
                Déconnexion
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={handleGoToProfile}
              className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <UserCircleIcon className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
      
      {/* Modal de profil utilisateur */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profil utilisateur</DialogTitle>
            <DialogDescription>
              Vos informations de profil
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-[#81B441]/20">
              <AvatarImage src={userImage || undefined} alt={session.user?.name || 'User'} />
              <AvatarFallback className="bg-[#81B441] text-white text-xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h3 className="text-lg font-medium">{session.user?.name || 'Utilisateur'}</h3>
              <p className="text-sm text-muted-foreground">{session.user?.email}</p>
            </div>
            
            <div className="w-full">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Rôle</span>
                <Badge variant="outline" className="bg-[#81B441]/10 text-[#81B441] border-[#81B441]">
                  {session.user?.role || 'USER'}
                </Badge>
              </div>
              
              {session.user?.permissions && session.user.permissions.length > 0 && (
                <div className="py-2 border-b">
                  <span className="font-medium">Permissions</span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {session.user.permissions.map((permission, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>
              Fermer
            </Button>
            <Button 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 