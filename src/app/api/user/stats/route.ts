import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

/**
 * GET /api/user/stats
 * Récupère les statistiques du profil utilisateur
 * - Points de gamification totaux
 * - Nombre de sessions participées
 * - Nombre de rendez-vous
 * - Nombre de contacts (interactions uniques)
 * 
 * Gère les erreurs avec des fallbacks (retourne 0 si les tables n'existent pas)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'ID de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Initialiser les stats avec valeurs par défaut
    let totalPoints = 0;
    let sessionsParticipated = 0;
    let requestedAppointments = 0;
    let receivedAppointments = 0;
    let totalContacts = 0;

    try {
      // 1. Points de gamification totaux (peut échouer si table n'existe pas)
      try {
        const gamificationStats = await prisma.checkIn.aggregate({
          where: { userId: user.id },
          _sum: { points: true }
        });
        totalPoints = gamificationStats._sum.points || 0;
      } catch (err) {
        console.warn('⚠️ Table CheckIn non accessible:', err);
        totalPoints = 0;
      }

      // 2. Nombre de sessions participées
      try {
        sessionsParticipated = await prisma.sessionParticipant.count({
          where: { userId: user.id }
        });
      } catch (err) {
        console.warn('⚠️ Table SessionParticipant non accessible:', err);
        sessionsParticipated = 0;
      }

      // 3. Nombre de rendez-vous (demandés + reçus)
      try {
        const [requested, received] = await Promise.all([
          prisma.appointment.count({
            where: { requesterId: user.id }
          }),
          prisma.appointment.count({
            where: { recipientId: user.id }
          })
        ]);
        requestedAppointments = requested;
        receivedAppointments = received;
      } catch (err) {
        console.warn('⚠️ Table Appointment non accessible:', err);
        requestedAppointments = 0;
        receivedAppointments = 0;
      }

      // 4. Nombre de contacts uniques
      try {
        const [contactsAsRequester, contactsAsRecipient] = await Promise.all([
          prisma.appointment.findMany({
            where: { 
              requesterId: user.id,
              status: 'ACCEPTED'
            },
            select: { recipientId: true },
            distinct: ['recipientId']
          }),
          prisma.appointment.findMany({
            where: { 
              recipientId: user.id,
              status: 'ACCEPTED'
            },
            select: { requesterId: true },
            distinct: ['requesterId']
          })
        ]);

        const uniqueContacts = new Set([
          ...contactsAsRequester.map(c => c.recipientId),
          ...contactsAsRecipient.map(c => c.requesterId)
        ]);
        totalContacts = uniqueContacts.size;
      } catch (err) {
        console.warn('⚠️ Contacts non accessibles:', err);
        totalContacts = 0;
      }

    } catch (error) {
      console.warn('⚠️ Erreur lors du calcul des stats, utilisation valeurs par défaut:', error);
    }

    // Calculer le total des rendez-vous
    const totalAppointments = requestedAppointments + receivedAppointments;

    // Retourner les statistiques (toujours avec des valeurs valides)
    const stats = {
      gamification: {
        totalPoints,
        description: 'Points gagnés via le check-in'
      },
      sessions: {
        participated: sessionsParticipated,
        description: 'Sessions auxquelles vous participez'
      },
      appointments: {
        total: totalAppointments,
        requested: requestedAppointments,
        received: receivedAppointments,
        description: 'Rendez-vous demandés et reçus'
      },
      contacts: {
        unique: totalContacts,
        description: 'Contacts uniques via rendez-vous acceptés'
      }
    };

    return NextResponse.json({ stats, user: { id: user.id, email: user.email } });

  } catch (error) {
    console.error('❌ Erreur récupération stats profil:', error);
    
    // En cas d'erreur totale, retourner des stats vides plutôt qu'une erreur
    return NextResponse.json({
      stats: {
        gamification: { totalPoints: 0, description: 'Points gagnés via le check-in' },
        sessions: { participated: 0, description: 'Sessions auxquelles vous participez' },
        appointments: { total: 0, requested: 0, received: 0, description: 'Rendez-vous demandés et reçus' },
        contacts: { unique: 0, description: 'Contacts uniques via rendez-vous acceptés' }
      },
      user: { id: null, email: null }
    });
  }
}

