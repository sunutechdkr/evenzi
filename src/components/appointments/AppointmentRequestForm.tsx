"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarDaysIcon, ClockIcon, MapPinIcon, DocumentTextIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// Schema de validation
const appointmentSchema = z.object({
  proposedDate: z.string().min(1, "La date est requise"),
  proposedTime: z.string().min(1, "L'heure est requise"),
  location: z.string().min(1, "Le lieu est requis"),
  subject: z.string().min(5, "L'objet doit contenir au moins 5 caractères"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  company?: string;
}

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  location: string;
}

interface MeetingLocation {
  id: string;
  name: string;
  address: string;
  type: string;
  capacity: number;
  description?: string;
  isActive: boolean;
  equipment?: string[];
  amenities?: string[];
}

interface AppointmentRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Participant;
  event: Event;
  currentUserRegistrationId: string;
  onSuccess?: () => void;
}

export default function AppointmentRequestForm({
  isOpen,
  onClose,
  recipient,
  event,
  currentUserRegistrationId,
  onSuccess
}: AppointmentRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<MeetingLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [dailyRequestCount, setDailyRequestCount] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const DAILY_LIMIT = 20;
  const remainingRequests = DAILY_LIMIT - dailyRequestCount;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      proposedDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
      location: '',
    },
  });

  // Charger les lieux disponibles
  const fetchLocations = useCallback(async () => {
    if (!event.id) return;
    
    setLoadingLocations(true);
    try {
      const response = await fetch(`/api/events/${event.id}/meeting-locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.filter((loc: MeetingLocation) => loc.isActive));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des lieux:', error);
      toast.error('Erreur lors du chargement des lieux');
    } finally {
      setLoadingLocations(false);
    }
  }, [event.id]);

  // Charger le nombre de demandes quotidiennes
  const fetchDailyRequestCount = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/events/${event.id}/appointments/daily-count?date=${today}&requesterId=${currentUserRegistrationId}`);
      if (response.ok) {
        const data = await response.json();
        setDailyRequestCount(data.count || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du compteur quotidien:', error);
    }
  }, [event.id, currentUserRegistrationId]);

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      fetchDailyRequestCount();
    }
  }, [isOpen, fetchLocations, fetchDailyRequestCount]);

  const onSubmit = async (data: AppointmentFormData) => {
    if (dailyRequestCount >= DAILY_LIMIT) {
      toast.error(`Vous avez atteint la limite de ${DAILY_LIMIT} demandes par jour`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Construire la date et heure proposée
      const proposedDateTime = new Date(`${data.proposedDate}T${data.proposedTime}`);
      
      // Créer le message complet
      const fullMessage = `Objet: ${data.subject}\n\n${data.message}`;

      const response = await fetch(`/api/events/${event.id}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: currentUserRegistrationId,
          recipientId: recipient.id,
          message: fullMessage,
          proposedTime: proposedDateTime.toISOString(),
          location: data.location,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de la demande');
      }

      toast.success(`Demande de rendez-vous envoyée à ${recipient.firstName} ${recipient.lastName}`);
      reset();
      setSelectedLocation('');
      onClose();
      onSuccess?.();
      
      // Mettre à jour le compteur
      setDailyRequestCount(prev => prev + 1);
      
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedLocation('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5 text-[#81B441]" />
            <span>Demander un rendez-vous</span>
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Avec {recipient.firstName} {recipient.lastName}
            {recipient.jobTitle && ` • ${recipient.jobTitle}`}
            {recipient.company && ` • ${recipient.company}`}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Compteur de demandes quotidiennes */}
          <Alert className={remainingRequests <= 5 ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50"}>
            <ExclamationTriangleIcon className={`h-4 w-4 ${remainingRequests <= 5 ? "text-orange-600" : "text-blue-600"}`} />
            <AlertDescription className={remainingRequests <= 5 ? "text-orange-800" : "text-blue-800"}>
              <span className="font-medium">
                {remainingRequests > 0 
                  ? `${remainingRequests} demande${remainingRequests > 1 ? 's' : ''} restante${remainingRequests > 1 ? 's' : ''} aujourd'hui`
                  : "Limite quotidienne atteinte (20 demandes)"
                }
              </span>
              {remainingRequests <= 5 && remainingRequests > 0 && (
                <span className="block text-sm mt-1">Vous approchez de la limite quotidienne de demandes.</span>
              )}
            </AlertDescription>
          </Alert>

          {/* Date et Heure */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposedDate" className="flex items-center space-x-1">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>Date</span>
              </Label>
              <Input
                id="proposedDate"
                type="date"
                {...register('proposedDate')}
                className={errors.proposedDate ? 'border-red-500' : ''}
              />
              {errors.proposedDate && (
                <p className="text-sm text-red-600">{errors.proposedDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposedTime" className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>Heure</span>
              </Label>
              <Input
                id="proposedTime"
                type="time"
                {...register('proposedTime')}
                className={errors.proposedTime ? 'border-red-500' : ''}
              />
              {errors.proposedTime && (
                <p className="text-sm text-red-600">{errors.proposedTime.message}</p>
              )}
            </div>
          </div>

          {/* Lieu - Dropdown */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-1">
              <MapPinIcon className="h-4 w-4" />
              <span>Lieu</span>
            </Label>
            <Select
              value={selectedLocation}
              onValueChange={(value) => {
                setSelectedLocation(value);
                setValue('location', value);
              }}
            >
              <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
                <SelectValue placeholder={loadingLocations ? "Chargement des lieux..." : "Sélectionnez un lieu"} />
              </SelectTrigger>
              <SelectContent>
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{location.name}</span>
                        <span className="text-xs text-gray-500">
                          {location.address} • {location.capacity} personnes
                          {location.amenities && location.amenities.length > 0 && (
                            <span className="ml-2">
                              {location.amenities.slice(0, 2).join(', ')}
                              {location.amenities.length > 2 && '...'}
                            </span>
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-locations" disabled>
                    {loadingLocations ? "Chargement..." : "Aucun lieu disponible"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
            <input
              type="hidden"
              {...register('location')}
            />
          </div>

          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="flex items-center space-x-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Objet</span>
            </Label>
            <Input
              id="subject"
              placeholder="Sujet de la rencontre"
              {...register('subject')}
              className={errors.subject ? 'border-red-500' : ''}
            />
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Décrivez brièvement l'objectif de ce rendez-vous..."
              rows={4}
              {...register('message')}
              className={errors.message ? 'border-red-500' : ''}
            />
            {errors.message && (
              <p className="text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || dailyRequestCount >= DAILY_LIMIT}
              className="flex-1 bg-[#81B441] hover:bg-[#81B441]/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? 'Envoi...' 
                : dailyRequestCount >= DAILY_LIMIT 
                  ? 'Limite atteinte' 
                  : 'Envoyer la demande'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 