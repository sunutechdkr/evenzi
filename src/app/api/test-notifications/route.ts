/**
 * API de test pour créer des notifications de démonstration
 * POST /api/test-notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    console.log('🧪 Création de notifications de test pour l\'utilisateur:', session.user.id);

    // Récupérer un événement pour les notifications de test
    const event = await prisma.event.findFirst({
      select: { id: true, name: true }
    });

    const notifications = [];

    try {
      // Notification 1: Demande de rendez-vous
      const notification1 = await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Demande de rendez-vous 🤝',
          message: 'Vous avez reçu une nouvelle demande de rendez-vous de Marie Dupont.',
          type: 'APPOINTMENT',
          priority: 'HIGH',
          eventId: event?.id,
          entityType: 'appointment_request',
          actionUrl: event ? `/dashboard/user/events/${event.id}/rendez-vous` : '/dashboard/user',
          metadata: { requesterName: 'Marie Dupont', type: 'appointment_request' },
        },
      });
      notifications.push(notification1);

      // Notification 2: Points gamification
      const notification2 = await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Points gagnés ! 🎮',
          message: '+10 points pour votre check-in à la session "Keynote Innovation". Continuez à accumuler des points !',
          type: 'GAME',
          priority: 'LOW',
          eventId: event?.id,
          entityType: 'gamification',
          actionUrl: event ? `/dashboard/user/events/${event.id}` : '/dashboard/user',
          metadata: { points: 10, sessionName: 'Keynote Innovation', action: 'participation_session', type: 'gamification_points' },
        },
      });
      notifications.push(notification2);

      // Notification 3: Badge digital
      const notification3 = await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Badge digital disponible 🎫',
          message: 'Votre badge digital est consultable dans l\'application, présentez-vous au comptoir pour scanner et le récupérer.',
          type: 'BADGE',
          priority: 'HIGH',
          eventId: event?.id,
          entityType: 'digital_badge',
          actionUrl: event ? `/dashboard/user/events/${event.id}/badge` : '/dashboard/user',
          metadata: { type: 'digital_badge_ready' },
        },
      });
      notifications.push(notification3);

      // Notification 4: Rappel de session
      const notification4 = await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Rappel d\'agenda ⏰',
          message: 'Votre prochaine session : "Atelier IA" commence dans 15mn.',
          type: 'SESSION',
          priority: 'HIGH',
          eventId: event?.id,
          entityType: 'session',
          actionUrl: event ? `/dashboard/user/events/${event.id}/sessions` : '/dashboard/user',
          metadata: { sessionName: 'Atelier IA', minutesUntilStart: 15, type: 'session_reminder' },
        },
      });
      notifications.push(notification4);

      // Notification 5: Confirmation de rendez-vous
      const notification5 = await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Rendez-vous confirmé ✅',
          message: 'Votre rendez-vous avec Jean Martin est confirmé pour 14h30 à Stand A12.',
          type: 'APPOINTMENT',
          priority: 'NORMAL',
          eventId: event?.id,
          entityType: 'appointment',
          actionUrl: event ? `/dashboard/user/events/${event.id}/rendez-vous` : '/dashboard/user',
          metadata: { otherParticipantName: 'Jean Martin', appointmentTime: '14h30', appointmentLocation: 'Stand A12', type: 'appointment_confirmed' },
        },
      });
      notifications.push(notification5);

      console.log(`✅ ${notifications.length} notifications de test créées avec succès`);

      return NextResponse.json({
        success: true,
        message: `${notifications.length} notifications de test créées`,
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          priority: n.priority
        }))
      });

    } catch (dbError) {
      console.error('Erreur lors de la création des notifications de test:', dbError);
      return NextResponse.json(
        { error: 'Erreur lors de la création des notifications de test', details: dbError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erreur générale lors du test des notifications:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
