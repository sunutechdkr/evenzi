import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

// Points attribués par action
const POINTS_CONFIG = {
  CHECK_IN: 50,
  SESSION_ENTRY: 20,
  SESSION_PARTICIPATION: 30,
  PARTICIPANT_SCAN: 10,
  APPOINTMENT_REQUEST: 15,
  APPOINTMENT_CONFIRMED: 30,
} as const;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const eventId = params.id;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { participantId, action, actionDetails, relatedEntityId } = body;

    // Validation des données
    if (!participantId || !action) {
      return NextResponse.json(
        { error: "participantId et action sont requis" },
        { status: 400 }
      );
    }

    if (!Object.keys(POINTS_CONFIG).includes(action)) {
      return NextResponse.json(
        { error: "Action non valide" },
        { status: 400 }
      );
    }

    // Vérifier que le participant existe et appartient à l'événement
    const participant = await prisma.registration.findFirst({
      where: {
        id: participantId,
        eventId: eventId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'événement existe et appartient à l'utilisateur
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: session.user.id,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifications spécifiques selon l'action pour éviter les doublons
    const existingAction = await checkDuplicateAction(
      eventId,
      participantId,
      action,
      relatedEntityId
    );

    if (existingAction) {
      return NextResponse.json(
        { error: "Action déjà enregistrée" },
        { status: 409 }
      );
    }

    const points = POINTS_CONFIG[action as keyof typeof POINTS_CONFIG];

    // Enregistrer l'action dans la table Game
    const gameAction = await prisma.game.create({
      data: {
        eventId,
        participantId,
        action,
        points,
        actionDetails: actionDetails ? JSON.stringify(actionDetails) : null,
        relatedEntityId,
      },
    });

    // Mettre à jour ou créer le score total de l'utilisateur
    await updateUserEventScore(eventId, participantId);

    return NextResponse.json({
      success: true,
      gameAction,
      points,
      message: `+${points} points pour ${action}`,
    });

  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'action:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonction pour vérifier les actions dupliquées
async function checkDuplicateAction(
  eventId: string,
  participantId: string,
  action: string,
  relatedEntityId?: string
): Promise<boolean> {
  const whereClause: {
    eventId: string;
    participantId: string;
    action: string;
    relatedEntityId?: string;
  } = {
    eventId,
    participantId,
    action,
  };

  // Pour certaines actions, on peut permettre plusieurs occurrences
  switch (action) {
    case "CHECK_IN":
      // Un seul check-in par participant par événement
      break;
    case "SESSION_ENTRY":
    case "SESSION_PARTICIPATION":
      // Une seule entrée/participation par session
      if (relatedEntityId) {
        whereClause.relatedEntityId = relatedEntityId;
      }
      break;
    case "PARTICIPANT_SCAN":
      // Un seul scan par paire de participants
      if (relatedEntityId) {
        whereClause.relatedEntityId = relatedEntityId;
      }
      break;
    case "APPOINTMENT_REQUEST":
    case "APPOINTMENT_CONFIRMED":
      // Un seul par rendez-vous spécifique
      if (relatedEntityId) {
        whereClause.relatedEntityId = relatedEntityId;
      }
      break;
    default:
      break;
  }

  const existingAction = await prisma.game.findFirst({
    where: whereClause,
  });

  return !!existingAction;
}

// Fonction pour mettre à jour le score total de l'utilisateur
async function updateUserEventScore(eventId: string, participantId: string) {
  // Calculer le total des points pour ce participant dans cet événement
  const totalPointsResult = await prisma.game.aggregate({
    where: {
      eventId,
      participantId,
    },
    _sum: {
      points: true,
    },
  });

  const totalPoints = totalPointsResult._sum.points || 0;

  // Mettre à jour ou créer l'enregistrement de score
  await prisma.userEventScore.upsert({
    where: {
      eventId_participantId: {
        eventId,
        participantId,
      },
    },
    update: {
      totalPoints,
      lastUpdated: new Date(),
    },
    create: {
      eventId,
      participantId,
      totalPoints,
    },
  });
} 