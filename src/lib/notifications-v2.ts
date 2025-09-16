/**
 * Fonctions de notification V2 - Utilisant les requêtes SQL directes
 * Compatible avec la nouvelle structure de table notifications
 */

import { prisma } from '@/lib/prisma';

// Types pour les notifications
export type NotificationType = 'SYSTEM' | 'EVENT' | 'REGISTRATION' | 'APPOINTMENT' | 'GAME' | 'EMAIL' | 'MATCHMAKING' | 'SESSION' | 'BADGE';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface CreateNotificationData {
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

/**
 * Créer une notification via SQL direct
 */
export async function createNotificationV2(data: CreateNotificationData) {
  try {
    const {
      userId,
      title,
      message,
      type,
      priority = 'NORMAL',
      eventId,
      entityId,
      entityType,
      actionUrl,
      metadata
    } = data;

    console.log(`🔔 Création notification V2: ${title} pour user ${userId}`);

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        priority,
        eventId,
        entityId,
        entityType,
        actionUrl,
        metadata,
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        priority: true,
        createdAt: true
      }
    });

    console.log(`✅ Notification V2 créée:`, notification);
    return notification;

  } catch (error) {
    console.error('❌ Erreur création notification V2:', error);
    throw error;
  }
}

/**
 * Créer une notification de demande de rendez-vous
 */
export async function createAppointmentRequestNotificationV2(
  recipientUserId: string,
  eventId: string,
  requesterName: string,
  appointmentId: string,
  message?: string
) {
  return createNotificationV2({
    userId: recipientUserId,
    title: 'Demande de rendez-vous 🤝',
    message: `Vous avez reçu une nouvelle demande de rendez-vous de ${requesterName}.${message ? ` Message: "${message}"` : ''}`,
    type: 'APPOINTMENT',
    priority: 'HIGH',
    eventId,
    entityId: appointmentId,
    entityType: 'appointment_request',
    actionUrl: `/dashboard/user/events/${eventId}/rendez-vous`,
    metadata: {
      requesterName,
      appointmentId,
      type: 'appointment_request',
      originalMessage: message
    }
  });
}

/**
 * Créer une notification de confirmation de rendez-vous
 */
export async function createAppointmentConfirmationNotificationV2(
  participantUserId: string,
  eventId: string,
  otherParticipantName: string,
  appointmentTime: string,
  appointmentLocation: string,
  appointmentId: string
) {
  return createNotificationV2({
    userId: participantUserId,
    title: 'Rendez-vous confirmé ✅',
    message: `Votre rendez-vous avec ${otherParticipantName} est confirmé pour ${appointmentTime}${appointmentLocation ? ` à ${appointmentLocation}` : ''}.`,
    type: 'APPOINTMENT',
    priority: 'NORMAL',
    eventId,
    entityId: appointmentId,
    entityType: 'appointment_confirmed',
    actionUrl: `/dashboard/user/events/${eventId}/rendez-vous`,
    metadata: {
      otherParticipantName,
      appointmentTime,
      appointmentLocation,
      appointmentId,
      type: 'appointment_confirmed'
    }
  });
}

/**
 * Créer une notification de gamification avec session
 */
export async function createGamificationNotificationV2(
  userId: string,
  eventId: string,
  points: number,
  sessionName?: string,
  action?: string
) {
  const title = 'Points gagnés ! 🎮';
  const message = sessionName
    ? `+${points} points pour votre check-in à la session "${sessionName}". Continuez à accumuler des points !`
    : `+${points} points gagnés ! Continuez à accumuler des points !`;

  return createNotificationV2({
    userId,
    title,
    message,
    type: 'GAME',
    priority: 'LOW',
    eventId,
    entityType: 'gamification',
    actionUrl: `/dashboard/user/events/${eventId}`,
    metadata: {
      points,
      sessionName,
      action,
      type: 'gamification_points'
    }
  });
}

/**
 * Créer une notification de badge digital
 */
export async function createDigitalBadgeNotificationV2(
  userId: string,
  eventId: string
) {
  return createNotificationV2({
    userId,
    title: 'Badge digital disponible 🎫',
    message: 'Votre badge digital est consultable dans l\'application, présentez-vous au comptoir pour scanner et le récupérer.',
    type: 'BADGE',
    priority: 'HIGH',
    eventId,
    entityType: 'digital_badge',
    actionUrl: `/dashboard/user/events/${eventId}/badge`,
    metadata: {
      type: 'digital_badge_ready'
    }
  });
}

/**
 * Créer une notification de rappel de session
 */
export async function createSessionReminderNotificationV2(
  userId: string,
  eventId: string,
  sessionName: string,
  sessionId: string,
  minutesUntilStart: number
) {
  return createNotificationV2({
    userId,
    title: 'Rappel d\'agenda ⏰',
    message: `Votre prochaine session : "${sessionName}" commence dans ${minutesUntilStart}mn.`,
    type: 'SESSION',
    priority: 'HIGH',
    eventId,
    entityId: sessionId,
    entityType: 'session',
    actionUrl: `/dashboard/user/events/${eventId}/sessions`,
    metadata: {
      sessionName,
      sessionId,
      minutesUntilStart,
      type: 'session_reminder'
    }
  });
}

/**
 * Récupérer l'ID utilisateur à partir de l'email d'un participant
 */
export async function getUserIdFromParticipantEmail(email: string): Promise<string | null> {
  try {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true }
    });
    return user?.id || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    return null;
  }
}
