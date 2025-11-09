import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/events/[id]/sponsors/[sponsorId]/members - Récupérer les membres d'un sponsor
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
    
    // Récupérer les membres du sponsor
    const members = await prisma.sponsorMember.findMany({
      where: {
        sponsorId
      },
      include: {
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            jobTitle: true,
            type: true,
            checkedIn: true
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      }
    });
    
    return NextResponse.json(members);
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des membres:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des membres" },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/sponsors/[sponsorId]/members - Ajouter un membre à un sponsor
export async function POST(
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
    const body = await request.json();
    const { participantId, role } = body;
    
    if (!participantId) {
      return NextResponse.json(
        { message: "L'ID du participant est requis" },
        { status: 400 }
      );
    }
    
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
    
    // Vérifier que le participant existe et appartient à l'événement
    const participant = await prisma.registration.findFirst({
      where: {
        id: participantId,
        eventId: id
      }
    });
    
    if (!participant) {
      return NextResponse.json(
        { message: "Participant non trouvé" },
        { status: 404 }
      );
    }
    
    // Vérifier si le participant est déjà membre
    const existingMember = await prisma.sponsorMember.findUnique({
      where: {
        sponsorId_participantId: {
          sponsorId,
          participantId
        }
      }
    });
    
    if (existingMember) {
      return NextResponse.json(
        { message: "Ce participant est déjà membre de ce sponsor" },
        { status: 400 }
      );
    }
    
    // Ajouter le membre
    const member = await prisma.sponsorMember.create({
      data: {
        sponsorId,
        participantId,
        role
      },
      include: {
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            jobTitle: true,
            type: true,
            checkedIn: true
          }
        }
      }
    });
    
    return NextResponse.json(member, { status: 201 });
    
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du membre:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'ajout du membre" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/sponsors/[sponsorId]/members - Supprimer un membre d'un sponsor
export async function DELETE(
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
    const body = await request.json();
    const { participantId } = body;
    
    if (!participantId) {
      return NextResponse.json(
        { message: "L'ID du participant est requis" },
        { status: 400 }
      );
    }
    
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
    
    // Vérifier que le membre existe
    const existingMember = await prisma.sponsorMember.findUnique({
      where: {
        sponsorId_participantId: {
          sponsorId,
          participantId
        }
      }
    });
    
    if (!existingMember) {
      return NextResponse.json(
        { message: "Ce participant n'est pas membre de ce sponsor" },
        { status: 404 }
      );
    }
    
    // Supprimer le membre
    await prisma.sponsorMember.delete({
      where: {
        sponsorId_participantId: {
          sponsorId,
          participantId
        }
      }
    });
    
    return NextResponse.json({ message: "Membre supprimé avec succès" });
    
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du membre:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du membre" },
      { status: 500 }
    );
  }
}

