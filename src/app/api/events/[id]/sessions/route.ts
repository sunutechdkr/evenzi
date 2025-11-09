import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from 'uuid';

// Définir des types pour les intervenants
type Speaker = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  checkedIn: boolean;
};

// Type pour les participants de session
type SessionParticipant = {
  participant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    type: string;
    checkedIn: boolean;
  };
};

// Type pour une session avec participants
type SessionWithParticipants = {
  id: string;
  title: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  start_time: string;
  end_time: string;
  location: string | null;
  speaker: string | null;
  capacity: number | null;
  format: string | null;
  banner: string | null;
  video_url: string | null;
  event_id: string;
  created_at: Date;
  updated_at: Date;
  participants: SessionParticipant[];
};

// GET /api/events/[id]/sessions - Récupérer toutes les sessions d'un événement
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 401 }
      );
    }
    
    // Accéder directement aux paramètres depuis le contexte
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sponsorFilter = searchParams.get("sponsor");
    
    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id },
    });
    
    if (!event) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Construire la condition de filtre pour les sessions
    let whereCondition: {
      event_id: string;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        speaker?: { contains: string; mode: 'insensitive' };
      }>;
    } = { event_id: id };
    
    // Si un sponsor est spécifié, filtrer les sessions qui mentionnent ce sponsor
    if (sponsorFilter) {
      whereCondition = {
        event_id: id,
        OR: [
          {
            title: {
              contains: sponsorFilter,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: sponsorFilter,
              mode: 'insensitive'
            }
          },
          {
            speaker: {
              contains: sponsorFilter,
              mode: 'insensitive'
            }
          }
        ]
      };
    }

    // Récupérer toutes les sessions de l'événement SANS les participants pour optimiser les performances
    // Les participants seront chargés individuellement quand on ouvre le détail d'une session
    const sessions = await prisma.event_sessions.findMany({
      where: whereCondition,
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
        banner: true,
        video_url: true,
        event_id: true,
        created_at: true,
        updated_at: true,
        // Compter uniquement le nombre de participants au lieu de charger tous les détails
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: [
        { start_date: 'asc' },
        { start_time: 'asc' }
      ]
    });

    // Transformer les données pour inclure le compte des participants
    const transformedSessions = sessions.map((sessionItem) => ({
      ...sessionItem,
      speakers: [], // Les speakers seront chargés dans l'API de détail
      participantCount: sessionItem._count.participants,
    }));

    return NextResponse.json(transformedSessions);
  } catch (error) {
    console.error("Erreur lors de la récupération des sessions:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des sessions", error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/sessions - Créer une nouvelle session
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 401 }
      );
    }
    
    // Accéder directement aux paramètres depuis le contexte
    const { id } = await params;
    
    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id },
    });
    
    if (!event) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les données de la session depuis le corps de la requête
    const body = await request.json();
    const {
      title,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      location,
      speaker,
      capacity,
      format,
      banner,
      video_url
    } = body;

    // Valider les données obligatoires
    if (!title || !start_date || !start_time) {
      return NextResponse.json(
        { message: "Le titre, la date et l'heure de début sont obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier que la date de début est égale ou postérieure à la date de début de l'événement
    const sessionStartDate = new Date(start_date);
    const eventStartDate = event.startDate;
    const eventEndDate = event.endDate;
    
    if (sessionStartDate < eventStartDate) {
      return NextResponse.json(
        { message: "La date de début de la session doit être égale ou postérieure à la date de début de l'événement" },
        { status: 400 }
      );
    }
    
    if (eventEndDate && sessionStartDate > eventEndDate) {
      return NextResponse.json(
        { message: "La date de début de la session ne peut pas être postérieure à la date de fin de l'événement" },
        { status: 400 }
      );
    }

    // Créer la nouvelle session en utilisant le modèle Prisma
    const createdSession = await prisma.event_sessions.create({
      data: {
        id: uuidv4(),
        title,
        description: description || null,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : new Date(start_date),
        start_time,
        end_time: end_time || start_time,
        location: location || null,
        speaker: speaker || null,
        capacity: capacity ? parseInt(capacity.toString()) : null,
        format: format || null,
        banner: banner || null,
        video_url: video_url || null,
        event_id: id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log("✅ Session créée avec succès:", createdSession.id);
    return NextResponse.json(createdSession, { status: 201 });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la session:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la session", error: String(error) },
      { status: 500 }
    );
  }
} 

// DELETE /api/events/[id]/sessions - Supprimer une session
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { message: "ID de session requis" },
        { status: 400 }
      );
    }

    // Vérifier que la session existe et appartient à l'événement
    const existingSession = await prisma.event_sessions.findFirst({
      where: {
        id: sessionId,
        event_id: id,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { message: "Session non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer la session
    await prisma.event_sessions.delete({
      where: { id: sessionId },
    });

    return NextResponse.json(
      { message: "Session supprimée avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la session:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de la session", error: String(error) },
      { status: 500 }
    );
  }
} 