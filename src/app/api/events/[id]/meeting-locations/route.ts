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

    // Pour l'instant, retournons des données mockées car la table n'existe pas encore
    const mockLocations = [
      {
        id: "1",
        name: "Salle de réunion A",
        address: "1er étage, aile gauche",
        description: "Grande salle équipée pour les présentations",
        capacity: 12,
        type: "CONFERENCE_ROOM",
        equipment: ["Projecteur", "Écran", "Tableau blanc"],
        amenities: ["Wifi", "Climatisation", "Prises électriques"],
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        name: "Espace café",
        address: "Hall principal",
        description: "Zone détendue pour discussions informelles",
        capacity: 8,
        type: "CAFE",
        equipment: ["Tables hautes", "Machine à café"],
        amenities: ["Machine à Café", "Wifi", "Éclairage naturel"],
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "3",
        name: "Terrasse",
        address: "3ème étage",
        description: "Espace extérieur avec vue panoramique",
        capacity: 15,
        type: "OUTDOOR",
        equipment: ["Tables", "Parasols"],
        amenities: ["Éclairage naturel", "Mobiliers"],
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json(mockLocations);

    // Code pour quand la table existera :
    /*
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
    */

  } catch (error) {
    console.error('Erreur lors de la récupération des lieux:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
