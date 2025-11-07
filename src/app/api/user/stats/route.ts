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

    // Préparer les requêtes en parallèle pour optimiser les performances
    const [
      gamificationStats,
      sessionsParticipated,
      appointmentsStats,
      contactsCount
    ] = await Promise.all([
      // 1. Points de gamification totaux
      prisma.checkIn.aggregate({
        where: { userId: user.id },
        _sum: { points: true }
      }),

      // 2. Nombre de sessions participées
      prisma.sessionParticipant.count({
        where: { userId: user.id }
      }),

      // 3. Nombre de rendez-vous (demandés + reçus)
      Promise.all([
        prisma.appointment.count({
          where: { requesterId: user.id }
        }),
        prisma.appointment.count({
          where: { recipientId: user.id }
        })
      ]),

      // 4. Nombre de contacts uniques (personnes avec qui l'utilisateur a interagi)
      // Combine les rendez-vous comme demandeur et destinataire
      Promise.all([
        prisma.appointment.findMany({
          where: { 
            requesterId: user.id,
            status: 'ACCEPTED' // Uniquement les RV acceptés
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
      ])
    ]);

    // Calculer le total des points de gamification
    const totalPoints = gamificationStats._sum.points || 0;

    // Calculer le total des rendez-vous
    const [requestedAppointments, receivedAppointments] = appointmentsStats;
    const totalAppointments = requestedAppointments + receivedAppointments;

    // Calculer le nombre de contacts uniques
    const [contactsAsRequester, contactsAsRecipient] = contactsCount;
    const uniqueContacts = new Set([
      ...contactsAsRequester.map(c => c.recipientId),
      ...contactsAsRecipient.map(c => c.requesterId)
    ]);
    const totalContacts = uniqueContacts.size;

    // Retourner les statistiques
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
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

