import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/events/[id]/sessions/[sessionId]/sponsors - Récupérer les sponsors d'une session
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 401 }
      );
    }
    
    const { id, sessionId } = await params;
    
    // Vérifier que la session existe
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
    
    // Récupérer les sponsors de la session
    const sponsors = await prisma.sponsorSession.findMany({
      where: {
        sessionId
      },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            website: true,
            level: true,
            visible: true,
            location: true,
            email: true,
            phone: true,
            mobile: true
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      }
    });
    
    return NextResponse.json(sponsors);
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des sponsors:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des sponsors" },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/sessions/[sessionId]/sponsors - Lier un sponsor à une session
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 401 }
      );
    }
    
    const { id, sessionId } = await params;
    const body = await request.json();
    const { sponsorId } = body;
    
    if (!sponsorId) {
      return NextResponse.json(
        { message: "L'ID du sponsor est requis" },
        { status: 400 }
      );
    }
    
    // Vérifier que la session existe
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
    
    // Vérifier si la liaison existe déjà
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
        { message: "Ce sponsor est déjà lié à cette session" },
        { status: 400 }
      );
    }
    
    // Créer la liaison
    const link = await prisma.sponsorSession.create({
      data: {
        sponsorId,
        sessionId
      },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            website: true,
            level: true,
            visible: true,
            location: true,
            email: true,
            phone: true,
            mobile: true
          }
        }
      }
    });
    
    return NextResponse.json(link, { status: 201 });
    
  } catch (error) {
    console.error("❌ Erreur lors de la liaison du sponsor:", error);
    return NextResponse.json(
      { message: "Erreur lors de la liaison du sponsor" },
      { status: 500 }
    );
  }
}

