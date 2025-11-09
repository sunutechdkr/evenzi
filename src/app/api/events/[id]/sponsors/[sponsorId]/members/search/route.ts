import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/events/[id]/sponsors/[sponsorId]/members/search - Chercher des participants à ajouter
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sponsorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 401 }
      );
    }
    
    const { id, sponsorId } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    // Vérifier que le sponsor existe
    const sponsor = await prisma.sponsor.findFirst({
      where: {
        id: sponsorId,
        eventId: id
      }
    });
    
    if (!sponsor) {
      return NextResponse.json(
        { message: "Sponsor non trouvé" },
        { status: 404 }
      );
    }
    
    // Récupérer les IDs des participants déjà membres
    const existingMembers = await prisma.sponsorMember.findMany({
      where: {
        sponsorId
      },
      select: {
        participantId: true
      }
    });
    
    const existingMemberIds = existingMembers.map(m => m.participantId);
    
    // Chercher des participants qui ne sont pas encore membres
    const participants = await prisma.registration.findMany({
      where: {
        eventId: id,
        id: {
          notIn: existingMemberIds
        },
        OR: [
          {
            firstName: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            company: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        jobTitle: true,
        type: true,
        checkedIn: true
      },
      take: 20,
      orderBy: {
        firstName: 'asc'
      }
    });
    
    return NextResponse.json(participants);
    
  } catch (error) {
    console.error("❌ Erreur lors de la recherche de participants:", error);
    return NextResponse.json(
      { message: "Erreur lors de la recherche de participants" },
      { status: 500 }
    );
  }
}

