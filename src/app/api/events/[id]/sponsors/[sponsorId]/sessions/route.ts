import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/events/[id]/sponsors/[sponsorId]/sessions - Récupérer les sessions d'un sponsor
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
    
    // Récupérer les sessions du sponsor
    const sessions = await prisma.sponsorSession.findMany({
      where: {
        sponsorId
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            description: true,
            start_date: true,
            end_date: true,
            start_time: true,
            end_time: true,
            location: true,
            speaker: true,
            capacity: true,
            format: true,
            banner: true
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      }
    });
    
    return NextResponse.json(sessions);
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des sessions:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des sessions" },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/sponsors/[sponsorId]/sessions - Lier une session à un sponsor
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
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { message: "L'ID de la session est requis" },
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
    
    // Vérifier que la session existe et appartient à l'événement
    const sessionData = await prisma.event_sessions.findFirst({
      where: {
        id: sessionId,
        event_id: id
      }
    });
    
    if (!sessionData) {
      return NextResponse.json(
        { message: "Session non trouvée" },
        { status: 404 }
      );
    }
    
    // Vérifier si la session est déjà liée
    const existingLink = await prisma.sponsorSession.findUnique({
      where: {
        sponsorId_sessionId: {
          sponsorId,
          sessionId
        }
      }
    });
    
    if (existingLink) {
      return NextResponse.json(
        { message: "Cette session est déjà liée à ce sponsor" },
        { status: 400 }
      );
    }
    
    // Lier la session
    const link = await prisma.sponsorSession.create({
      data: {
        sponsorId,
        sessionId
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            description: true,
            start_date: true,
            end_date: true,
            start_time: true,
            end_time: true,
            location: true,
            speaker: true,
            capacity: true,
            format: true,
            banner: true
          }
        }
      }
    });
    
    return NextResponse.json(link, { status: 201 });
    
  } catch (error) {
    console.error("❌ Erreur lors de la liaison de la session:", error);
    return NextResponse.json(
      { message: "Erreur lors de la liaison de la session" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/sponsors/[sponsorId]/sessions - Délier une session d'un sponsor
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
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { message: "L'ID de la session est requis" },
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
    
    // Vérifier que la liaison existe
    const existingLink = await prisma.sponsorSession.findUnique({
      where: {
        sponsorId_sessionId: {
          sponsorId,
          sessionId
        }
      }
    });
    
    if (!existingLink) {
      return NextResponse.json(
        { message: "Cette session n'est pas liée à ce sponsor" },
        { status: 404 }
      );
    }
    
    // Supprimer la liaison
    await prisma.sponsorSession.delete({
      where: {
        sponsorId_sessionId: {
          sponsorId,
          sessionId
        }
      }
    });
    
    return NextResponse.json({ message: "Session déliée avec succès" });
    
  } catch (error) {
    console.error("❌ Erreur lors de la déliaison de la session:", error);
    return NextResponse.json(
      { message: "Erreur lors de la déliaison de la session" },
      { status: 500 }
    );
  }
}

