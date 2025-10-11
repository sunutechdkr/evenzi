/**
 * API pour récupérer les lieux de rendez-vous d'un événement
 * GET /api/events/[id]/meeting-locations
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

    // Récupérer les lieux de rendez-vous pour cet événement
    const locations = await prisma.meetingLocation.findMany({
      where: {
        eventId: eventId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        address: true,
        type: true,
        capacity: true,
        description: true,
        isActive: true,
        equipment: true,
        amenities: true,
        createdAt: true,
      },
    });

    return NextResponse.json(locations);

  } catch (error) {
    console.error('Erreur lors de la récupération des lieux:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
