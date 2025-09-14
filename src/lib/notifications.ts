/**
 * Service de gestion des notifications in-app
 * Système de notifications indépendant pour Evenzi
 */

import { prisma } from '@/lib/prisma';
import type { NotificationType, NotificationPriority } from '@prisma/client';

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  eventId?: string;
  entityId?: string;
  entityType?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  eventId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Créer une nouvelle notification
 */
export async function createNotification(data: CreateNotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'NORMAL',
        eventId: data.eventId,
        entityId: data.entityId,
        entityType: data.entityType,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw new Error('Impossible de créer la notification');
  }
}

/**
 * Récupérer les notifications d'un utilisateur
 */
export async function getUserNotifications(filters: NotificationFilters) {
  try {
    const where: any = {
      userId: filters.userId,
    };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.eventId) {
      where.eventId = filters.eventId;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return notifications;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw new Error('Impossible de récupérer les notifications');
  }
}

/**
 * Marquer une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: userId, // Sécurité : s'assurer que l'utilisateur peut modifier cette notification
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return notification;
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    throw new Error('Impossible de marquer la notification comme lue');
  }
}

/**
 * Marquer toutes les notifications d'un utilisateur comme lues
 */
export async function markAllNotificationsAsRead(userId: string, eventId?: string) {
  try {
    const where: any = {
      userId: userId,
      isRead: false,
    };

    if (eventId) {
      where.eventId = eventId;
    }

    const result = await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications:', error);
    throw new Error('Impossible de marquer toutes les notifications comme lues');
  }
}

/**
 * Supprimer une notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: userId, // Sécurité : s'assurer que l'utilisateur peut supprimer cette notification
      },
    });

    return notification;
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw new Error('Impossible de supprimer la notification');
  }
}

/**
 * Compter les notifications non lues d'un utilisateur
 */
export async function getUnreadNotificationsCount(userId: string, eventId?: string) {
  try {
    const where: any = {
      userId: userId,
      isRead: false,
    };

    if (eventId) {
      where.eventId = eventId;
    }

    const count = await prisma.notification.count({
      where,
    });

    return count;
  } catch (error) {
    console.error('Erreur lors du comptage des notifications non lues:', error);
    return 0;
  }
}

/**
 * Nettoyer les anciennes notifications (plus de 30 jours)
 */
export async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        },
        isRead: true, // Ne supprimer que les notifications lues
      },
    });

    return result;
  } catch (error) {
    console.error('Erreur lors du nettoyage des anciennes notifications:', error);
    throw new Error('Impossible de nettoyer les anciennes notifications');
  }
}

// ============================================================================
// FONCTIONS DE CRÉATION DE NOTIFICATIONS SPÉCIFIQUES
// ============================================================================

/**
 * Notification pour une nouvelle inscription à un événement
 */
export async function createRegistrationNotification(
  organizerId: string,
  eventId: string,
  participantName: string,
  registrationId: string
) {
  return createNotification({
    userId: organizerId,
    title: 'Nouvelle inscription',
    message: `${participantName} s'est inscrit à votre événement`,
    type: 'REGISTRATION',
    priority: 'NORMAL',
    eventId: eventId,
    entityId: registrationId,
    entityType: 'registration',
    actionUrl: `/dashboard/events/${eventId}/participants`,
  });
}

/**
 * Notification pour un check-in
 */
export async function createCheckinNotification(
  organizerId: string,
  eventId: string,
  participantName: string,
  registrationId: string
) {
  return createNotification({
    userId: organizerId,
    title: 'Participant arrivé',
    message: `${participantName} a effectué son check-in`,
    type: 'REGISTRATION',
    priority: 'LOW',
    eventId: eventId,
    entityId: registrationId,
    entityType: 'checkin',
    actionUrl: `/dashboard/events/${eventId}/participants`,
  });
}

/**
 * Notification pour des points gagnés (gamification)
 */
export async function createGameNotification(
  userId: string,
  eventId: string,
  points: number,
  action: string,
  gameId: string
) {
  return createNotification({
    userId: userId,
    title: 'Points gagnés !',
    message: `Vous avez gagné ${points} points pour ${action}`,
    type: 'GAME',
    priority: 'LOW',
    eventId: eventId,
    entityId: gameId,
    entityType: 'game',
    actionUrl: `/events/${eventId}/leaderboard`,
    metadata: { points, action },
  });
}

/**
 * Notification pour un nouveau rendez-vous
 */
export async function createAppointmentNotification(
  userId: string,
  eventId: string,
  appointmentId: string,
  isRequest: boolean,
  otherParticipantName: string
) {
  const title = isRequest ? 'Demande de rendez-vous' : 'Rendez-vous confirmé';
  const message = isRequest 
    ? `${otherParticipantName} souhaite prendre rendez-vous avec vous`
    : `Votre rendez-vous avec ${otherParticipantName} est confirmé`;

  return createNotification({
    userId: userId,
    title: title,
    message: message,
    type: 'APPOINTMENT',
    priority: isRequest ? 'HIGH' : 'NORMAL',
    eventId: eventId,
    entityId: appointmentId,
    entityType: 'appointment',
    actionUrl: `/events/${eventId}/appointments`,
  });
}

/**
 * Notification pour une suggestion de matchmaking
 */
export async function createMatchmakingNotification(
  userId: string,
  eventId: string,
  suggestedUserName: string,
  suggestionId: string,
  reason: string
) {
  return createNotification({
    userId: userId,
    title: 'Nouvelle suggestion',
    message: `Nous vous suggérons de rencontrer ${suggestedUserName}`,
    type: 'MATCHMAKING',
    priority: 'NORMAL',
    eventId: eventId,
    entityId: suggestionId,
    entityType: 'match_suggestion',
    actionUrl: `/events/${eventId}/networking`,
    metadata: { reason },
  });
}

/**
 * Notification pour l'envoi d'une campagne email
 */
export async function createEmailCampaignNotification(
  organizerId: string,
  eventId: string,
  campaignName: string,
  recipientCount: number,
  campaignId: string
) {
  return createNotification({
    userId: organizerId,
    title: 'Campagne envoyée',
    message: `La campagne "${campaignName}" a été envoyée à ${recipientCount} destinataires`,
    type: 'EMAIL',
    priority: 'LOW',
    eventId: eventId,
    entityId: campaignId,
    entityType: 'email_campaign',
    actionUrl: `/dashboard/events/${eventId}/campaigns`,
    metadata: { recipientCount },
  });
}

/**
 * Notification système générale
 */
export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  priority: NotificationPriority = 'NORMAL',
  actionUrl?: string
) {
  return createNotification({
    userId: userId,
    title: title,
    message: message,
    type: 'SYSTEM',
    priority: priority,
    actionUrl: actionUrl,
  });
}

// ============================================================================
// NOUVELLES FONCTIONS DE NOTIFICATION OPTIMISÉES
// ============================================================================

/**
 * Notification de palier d'inscription (100, 250, 500, 1000, 2000, 5000)
 */
export async function createRegistrationMilestoneNotification(
  organizerId: string,
  eventId: string,
  eventName: string,
  milestone: number
) {
  return createNotification({
    userId: organizerId,
    title: 'Félicitations ! 🎉',
    message: `Votre événement "${eventName}" vient d'atteindre ${milestone} inscriptions`,
    type: 'EVENT',
    priority: 'HIGH',
    eventId: eventId,
    entityType: 'milestone',
    actionUrl: `/dashboard/events/${eventId}/participants`,
    metadata: { milestone, type: 'registration_milestone' },
  });
}

/**
 * Notification de suivi check-in en temps réel (par paliers)
 */
export async function createCheckinMilestoneNotification(
  organizerId: string,
  eventId: string,
  checkinCount: number,
  milestone: number
) {
  return createNotification({
    userId: organizerId,
    title: 'Suivi check-in 📊',
    message: `${checkinCount} participants ont déjà effectué leur check-in.`,
    type: 'EVENT',
    priority: 'NORMAL',
    eventId: eventId,
    entityType: 'checkin_milestone',
    actionUrl: `/dashboard/events/${eventId}/participants`,
    metadata: { checkinCount, milestone, type: 'checkin_milestone' },
  });
}

/**
 * Notification de remplissage de session
 */
export async function createSessionCapacityNotification(
  organizerId: string,
  eventId: string,
  sessionName: string,
  sessionId: string,
  capacityPercentage: number
) {
  return createNotification({
    userId: organizerId,
    title: 'Session bientôt complète ⚠️',
    message: `La session "${sessionName}" a atteint ${capacityPercentage}% de remplissage.`,
    type: 'SESSION',
    priority: 'HIGH',
    eventId: eventId,
    entityId: sessionId,
    entityType: 'session',
    actionUrl: `/dashboard/events/${eventId}/sessions/${sessionId}`,
    metadata: { capacityPercentage, type: 'session_capacity' },
  });
}

/**
 * Notification d'alerte quota email
 */
export async function createEmailQuotaAlertNotification(
  organizerId: string,
  eventId: string,
  eventName: string,
  quotaUsed: number,
  quotaLimit: number
) {
  const percentage = Math.round((quotaUsed / quotaLimit) * 100);
  
  return createNotification({
    userId: organizerId,
    title: 'Quota d\'emails critique 🚨',
    message: `Votre quota d'emails pour l'événement "${eventName}" est presque atteint (${percentage}%).`,
    type: 'EMAIL',
    priority: 'URGENT',
    eventId: eventId,
    entityType: 'email_quota',
    actionUrl: `/dashboard/events/${eventId}/communication`,
    metadata: { quotaUsed, quotaLimit, percentage, type: 'email_quota_alert' },
  });
}

/**
 * Notification badge digital pour participant
 */
export async function createDigitalBadgeNotification(
  participantId: string,
  eventId: string
) {
  return createNotification({
    userId: participantId,
    title: 'Badge digital disponible 🎫',
    message: 'Votre badge digital est consultable dans l\'application, présentez-vous au comptoir pour scanner et le récupérer.',
    type: 'BADGE',
    priority: 'HIGH',
    eventId: eventId,
    entityType: 'digital_badge',
    actionUrl: `/dashboard/user/events/${eventId}/badge`,
    metadata: { type: 'digital_badge_ready' },
  });
}

/**
 * Notification demande de rendez-vous pour participant
 */
export async function createAppointmentRequestNotification(
  recipientId: string,
  eventId: string,
  requesterName: string,
  appointmentId: string
) {
  return createNotification({
    userId: recipientId,
    title: 'Demande de rendez-vous 🤝',
    message: `Vous avez reçu une nouvelle demande de rendez-vous de ${requesterName}.`,
    type: 'APPOINTMENT',
    priority: 'HIGH',
    eventId: eventId,
    entityId: appointmentId,
    entityType: 'appointment',
    actionUrl: `/dashboard/user/events/${eventId}/rendez-vous`,
    metadata: { requesterName, type: 'appointment_request' },
  });
}

/**
 * Notification confirmation de rendez-vous pour participant
 */
export async function createAppointmentConfirmationNotification(
  participantId: string,
  eventId: string,
  otherParticipantName: string,
  appointmentTime: string,
  appointmentLocation: string,
  appointmentId: string
) {
  return createNotification({
    userId: participantId,
    title: 'Rendez-vous confirmé ✅',
    message: `Votre rendez-vous avec ${otherParticipantName} est confirmé pour ${appointmentTime} à ${appointmentLocation}.`,
    type: 'APPOINTMENT',
    priority: 'NORMAL',
    eventId: eventId,
    entityId: appointmentId,
    entityType: 'appointment',
    actionUrl: `/dashboard/user/events/${eventId}/rendez-vous`,
    metadata: { otherParticipantName, appointmentTime, appointmentLocation, type: 'appointment_confirmed' },
  });
}

/**
 * Notification points gamification pour participant
 */
export async function createGamificationPointsNotification(
  participantId: string,
  eventId: string,
  points: number,
  sessionName: string,
  action: string
) {
  return createNotification({
    userId: participantId,
    title: 'Points gagnés ! 🎮',
    message: `+${points} points pour votre check-in à la session "${sessionName}". Continuez à accumuler des points !`,
    type: 'GAME',
    priority: 'LOW',
    eventId: eventId,
    entityType: 'gamification',
    actionUrl: `/dashboard/user/events/${eventId}`,
    metadata: { points, sessionName, action, type: 'gamification_points' },
  });
}

/**
 * Notification rappel de session pour participant
 */
export async function createSessionReminderNotification(
  participantId: string,
  eventId: string,
  sessionName: string,
  sessionId: string,
  minutesUntilStart: number
) {
  return createNotification({
    userId: participantId,
    title: 'Rappel d\'agenda ⏰',
    message: `Votre prochaine session : "${sessionName}" commence dans ${minutesUntilStart}mn.`,
    type: 'SESSION',
    priority: 'HIGH',
    eventId: eventId,
    entityId: sessionId,
    entityType: 'session',
    actionUrl: `/dashboard/user/events/${eventId}/sessions`,
    metadata: { sessionName, minutesUntilStart, type: 'session_reminder' },
  });
}

// ============================================================================
// UTILITAIRES POUR LA GESTION DES PALIERS
// ============================================================================

/**
 * Paliers de notifications d'inscription
 */
export const REGISTRATION_MILESTONES = [100, 250, 500, 1000, 2000, 5000];

/**
 * Paliers de notifications de check-in
 */
export const CHECKIN_MILESTONES = [100, 300, 500, 1000, 2000, 5000];

/**
 * Vérifier si un palier d'inscription doit déclencher une notification
 */
export async function checkRegistrationMilestone(eventId: string): Promise<{ shouldNotify: boolean, milestone?: number, count?: number }> {
  try {
    // Compter le nombre total d'inscriptions pour cet événement
    const registrationCount = await prisma.registration.count({
      where: { eventId }
    });

    // Vérifier si on a atteint un nouveau palier
    for (const milestone of REGISTRATION_MILESTONES) {
      if (registrationCount === milestone) {
        // Vérifier qu'on n'a pas déjà envoyé cette notification
        const existingNotification = await prisma.notification.findFirst({
          where: {
            eventId,
            type: 'EVENT',
            metadata: {
              path: ['type'],
              equals: 'registration_milestone'
            }
          }
        });

        if (!existingNotification || !existingNotification.metadata || 
            (existingNotification.metadata as Record<string, unknown>).milestone !== milestone) {
          return { shouldNotify: true, milestone, count: registrationCount };
        }
      }
    }

    return { shouldNotify: false };
  } catch (error) {
    console.error('Erreur lors de la vérification du palier d\'inscription:', error);
    return { shouldNotify: false };
  }
}

/**
 * Vérifier si un palier de check-in doit déclencher une notification
 */
export async function checkCheckinMilestone(eventId: string): Promise<{ shouldNotify: boolean, milestone?: number, count?: number }> {
  try {
    // Compter le nombre de participants qui ont fait leur check-in
    const checkinCount = await prisma.registration.count({
      where: { 
        eventId,
        checkedIn: true 
      }
    });

    // Vérifier si on a atteint un nouveau palier
    for (const milestone of CHECKIN_MILESTONES) {
      if (checkinCount === milestone) {
        // Vérifier qu'on n'a pas déjà envoyé cette notification
        const existingNotification = await prisma.notification.findFirst({
          where: {
            eventId,
            type: 'EVENT',
            metadata: {
              path: ['type'],
              equals: 'checkin_milestone'
            }
          }
        });

        if (!existingNotification || !existingNotification.metadata || 
            (existingNotification.metadata as Record<string, unknown>).milestone !== milestone) {
          return { shouldNotify: true, milestone, count: checkinCount };
        }
      }
    }

    return { shouldNotify: false };
  } catch (error) {
    console.error('Erreur lors de la vérification du palier de check-in:', error);
    return { shouldNotify: false };
  }
}

/**
 * Vérifier le pourcentage de remplissage d'une session
 */
export async function checkSessionCapacity(sessionId: string): Promise<{ shouldNotify: boolean, percentage?: number, sessionName?: string }> {
  try {
    // Récupérer les informations de la session
    const session = await prisma.event_sessions.findUnique({
      where: { id: sessionId },
      select: {
        name: true,
        maxParticipants: true,
        _count: {
          select: {
            SessionParticipant: true
          }
        }
      }
    });

    if (!session || !session.maxParticipants) {
      return { shouldNotify: false };
    }

    const currentParticipants = session._count.SessionParticipant;
    const percentage = Math.round((currentParticipants / session.maxParticipants) * 100);

    // Notifier à 80% de remplissage
    if (percentage >= 80 && percentage < 85) {
      // Vérifier qu'on n'a pas déjà envoyé cette notification
      const existingNotification = await prisma.notification.findFirst({
        where: {
          entityId: sessionId,
          type: 'SESSION',
          metadata: {
            path: ['type'],
            equals: 'session_capacity'
          }
        }
      });

      if (!existingNotification) {
        return { shouldNotify: true, percentage, sessionName: session.name };
      }
    }

    return { shouldNotify: false };
  } catch (error) {
    console.error('Erreur lors de la vérification de la capacité de session:', error);
    return { shouldNotify: false };
  }
}

/**
 * Vérifier le quota d'emails d'un événement (simulation - à adapter selon votre logique)
 */
export async function checkEmailQuota(eventId: string): Promise<{ shouldNotify: boolean, quotaUsed?: number, quotaLimit?: number, eventName?: string }> {
  try {
    // Récupérer l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true }
    });

    if (!event) {
      return { shouldNotify: false };
    }

    // Compter les emails envoyés pour cet événement
    const emailsSent = await prisma.emailCampaign.aggregate({
      where: { eventId },
      _sum: {
        recipientCount: true
      }
    });

    const quotaUsed = emailsSent._sum.recipientCount || 0;
    const quotaLimit = 10000; // Limite par défaut - à adapter selon votre plan
    const percentage = (quotaUsed / quotaLimit) * 100;

    // Notifier à 90% du quota
    if (percentage >= 90) {
      // Vérifier qu'on n'a pas déjà envoyé cette notification récemment (dans les 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const existingNotification = await prisma.notification.findFirst({
        where: {
          eventId,
          type: 'EMAIL',
          metadata: {
            path: ['type'],
            equals: 'email_quota_alert'
          },
          createdAt: {
            gte: yesterday
          }
        }
      });

      if (!existingNotification) {
        return { shouldNotify: true, quotaUsed, quotaLimit, eventName: event.name };
      }
    }

    return { shouldNotify: false };
  } catch (error) {
    console.error('Erreur lors de la vérification du quota d\'emails:', error);
    return { shouldNotify: false };
  }
}
