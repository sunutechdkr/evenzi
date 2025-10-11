/**
 * API pour compter les demandes de rendez-vous quotidiennes d'un utilisateur
 * GET /api/events/[id]/appointments/daily-count
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const requesterId = searchParams.get('requesterId');

    if (!date || !requesterId) {
      return NextResponse.json(
        { error: 'Date et requesterId requis' },
        { status: 400 }
      );
    }

    // Calculer le début et la fin de la journée
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // Compter les demandes de rendez-vous créées aujourd'hui par cet utilisateur
    const count = await prisma.appointment.count({
      where: {
        eventId: eventId,
        requesterId: requesterId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return NextResponse.json({ count });

  } catch (error) {
    console.error('Erreur lors du comptage des demandes quotidiennes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
