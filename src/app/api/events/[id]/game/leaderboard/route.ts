import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
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

    // Récupérer tous les participants avec leurs scores
    // Note: Ces requêtes utiliseront les nouveaux modèles une fois la migration exécutée
    const participantsWithScores = await prisma.registration.findMany({
      where: {
        eventId: eventId,
      },
      include: {
        // userEventScores: {
        //   where: {
        //     eventId: eventId,
        //   },
        // },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    // Pour l'instant, retourner des données simulées jusqu'à ce que la migration soit exécutée
    const mockParticipants = participantsWithScores.map((participant, index) => ({
      id: participant.id,
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      company: participant.company,
      jobTitle: participant.jobTitle,
      totalPoints: Math.max(0, Math.floor(Math.random() * 200)), // Données simulées
      rank: index + 1,
      avatar: null,
      lastActivity: new Date().toISOString(),
    }));

    // Trier par points décroissants et attribuer les rangs
    mockParticipants.sort((a, b) => b.totalPoints - a.totalPoints);
    mockParticipants.forEach((participant, index) => {
      participant.rank = index + 1;
    });

    // Calculer les statistiques
    const totalParticipants = mockParticipants.length;
    const totalPoints = mockParticipants.reduce((sum, p) => sum + p.totalPoints, 0);
    const averagePoints = totalParticipants > 0 ? totalPoints / totalParticipants : 0;
    const topScorer = mockParticipants.length > 0 ? mockParticipants[0] : null;

    const stats = {
      totalParticipants,
      totalPoints,
      averagePoints,
      topScorer,
    };

    // Limiter à top 3 + 10 participants supplémentaires (total 13 max)
    // Cela optimise le chargement en ne retournant que les participants nécessaires
    // Top 3 pour le podium + 10 autres pour le tableau = 13 participants max
    const limitedParticipants = mockParticipants.slice(0, 13);

    return NextResponse.json({
      participants: limitedParticipants,
      stats,
    });

  } catch (error) {
    console.error("Erreur lors de la récupération du classement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Version finale qui sera utilisée après la migration
/*
export async function GET(
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

    // Récupérer tous les participants avec leurs scores
    const participantsWithScores = await prisma.userEventScore.findMany({
      where: {
        eventId: eventId,
      },
      include: {
        participant: true,
      },
      orderBy: {
        totalPoints: 'desc',
      },
    });

    // Formatter les données pour le frontend
    const participants = participantsWithScores.map((score, index) => ({
      id: score.participant.id,
      firstName: score.participant.firstName,
      lastName: score.participant.lastName,
      email: score.participant.email,
      company: score.participant.company,
      jobTitle: score.participant.jobTitle,
      totalPoints: score.totalPoints,
      rank: index + 1,
      avatar: null, // Peut être ajouté plus tard
      lastActivity: score.lastUpdated.toISOString(),
    }));

    // Calculer les statistiques
    const totalParticipants = participants.length;
    const totalPoints = participants.reduce((sum, p) => sum + p.totalPoints, 0);
    const averagePoints = totalParticipants > 0 ? totalPoints / totalParticipants : 0;
    const topScorer = participants.length > 0 ? participants[0] : null;

    const stats = {
      totalParticipants,
      totalPoints,
      averagePoints,
      topScorer,
    };

    return NextResponse.json({
      participants,
      stats,
    });

  } catch (error) {
    console.error("Erreur lors de la récupération du classement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
*/ 