'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlusIcon } from '@heroicons/react/24/outline';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  company?: string;
  type: string;
}

interface AddMembersDialogProps {
  sponsorId: string;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded: () => void;
}

export function AddMembersDialog({ 
  sponsorId, 
  eventId, 
  open, 
  onOpenChange, 
  onMemberAdded 
}: AddMembersDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [addingMemberId, setAddingMemberId] = React.useState<string | null>(null);

  // Normalisation pour la recherche (sans accents)
  const normalize = (s = "") =>
    s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  // Reset search when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setParticipants([]);
      setAddingMemberId(null);
    }
  }, [open]);

  // Fetch participants with debounce
  const fetchParticipants = React.useCallback(async (query: string) => {
    if (!query.trim()) {
      setParticipants([]);
      return;
    }

    setLoading(true);
    try {
      const url = `/api/events/${eventId}/participants?search=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Filtrer selon nom, prénom, email uniquement
        const q = normalize(query);
        const filteredData = data.filter((participant: Participant) => {
          const haystack = normalize(
            `${participant.firstName ?? ""} ${participant.lastName ?? ""} ${participant.email ?? ""}`
          );
          return haystack.includes(q);
        });
        
        // Limiter à 15 résultats pour éviter débordement
        setParticipants(filteredData.slice(0, 15));
      } else {
        console.error('Erreur lors du chargement des participants');
        setParticipants([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des participants:', error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Debounced search effect
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        fetchParticipants(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setParticipants([]);
    }
  }, [searchQuery, fetchParticipants]);

  const addMember = async (participantId: string) => {
    setAddingMemberId(participantId);
    try {
      const response = await fetch(`/api/events/sponsors/${sponsorId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId }),
      });

      if (response.ok) {
        // Notifier le parent
        onMemberAdded();
        // Fermer le dialog
        onOpenChange(false);
      } else {
        console.error('Erreur lors de l\'ajout du membre');
        alert('Erreur lors de l\'ajout du membre. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      alert('Erreur lors de l\'ajout du membre. Veuillez réessayer.');
    } finally {
      setAddingMemberId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[70vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Ajouter des membres
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Barre de recherche */}
          <div className="flex-shrink-0">
            <Input
              placeholder="Rechercher des participants (nom, prénom, email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Zone de résultats avec scroll - hauteur fixe */}
          <div className="flex-1 min-h-0 max-h-[350px]">
            <ScrollArea className="h-full border rounded-md">
              <div className="p-3">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#81B441] border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-500">Recherche en cours...</p>
                  </div>
                ) : searchQuery.trim() ? (
                  participants.length > 0 ? (
                    <div className="space-y-2">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-[#81B441] text-white font-medium text-xs">
                              {participant.firstName?.[0]?.toUpperCase()}{participant.lastName?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate text-sm">
                                {participant.firstName} {participant.lastName}
                              </p>
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                {participant.type}
                              </span>
                            </div>
                            {/* Fonction et entreprise sur la même ligne */}
                            <div className="text-xs text-gray-600 truncate">
                              {participant.jobTitle && participant.company ? (
                                <span>{participant.jobTitle} • {participant.company}</span>
                              ) : participant.jobTitle ? (
                                <span>{participant.jobTitle}</span>
                              ) : participant.company ? (
                                <span>{participant.company}</span>
                              ) : null}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {participant.email}
                            </p>
                          </div>
                          
                          <Button
                            onClick={() => addMember(participant.id)}
                            disabled={addingMemberId === participant.id}
                            className="bg-[#81B441] hover:bg-[#72a139] text-white flex-shrink-0"
                            size="sm"
                          >
                            {addingMemberId === participant.id ? (
                              <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                            ) : (
                              'Ajouter'
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">
                        Aucun participant trouvé pour &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <UserPlusIcon className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500">
                      Tapez pour rechercher des participants à ajouter
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
