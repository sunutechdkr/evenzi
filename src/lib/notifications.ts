/**
 * Service de gestion des notifications in-app
 * Système de notifications indépendant pour Evenzi
 */

import { prisma } from '@/lib/prisma';
import { NotificationType, NotificationPriority } from '@prisma/client';

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
  metadata?: any;
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
