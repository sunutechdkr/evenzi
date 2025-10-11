import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createAppointmentRequestNotificationV2, getUserIdFromParticipantEmail } from "@/lib/notifications-v2";

// GET: Récupère tous les rendez-vous pour un événement spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;

    // Récupérer les paramètres de filtre depuis l'URL
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const participantId = url.searchParams.get("participantId");
    const location = url.searchParams.get("location");
    
    // Construire la requête avec les conditions de filtre
    const whereClause: {
      eventId: string;
      status?: string;
      location?: string;
      OR?: Array<{ requesterId: string } | { recipientId: string }>;
    } = { eventId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (location) {
      whereClause.location = location;
    }
    
    if (participantId) {
      whereClause.OR = [
        { requesterId: participantId },
        { recipientId: participantId }
      ];
    }

    // Récupérer les rendez-vous avec les informations sur les participants
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            jobTitle: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            jobTitle: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des rendez-vous" },
      { status: 500 }
    );
  }
}

// POST: Crée un nouveau rendez-vous
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;
    const body = await request.json();
    
    // Validation des données d'entrée
    const { requesterId, recipientId, message, proposedTime, location } = body;
    
    if (!requesterId || !recipientId) {
      return NextResponse.json(
        { message: "Les IDs du demandeur et du destinataire sont requis" },
        { status: 400 }
      );
    }
    
    // Vérification que les participants existent et appartiennent à l'événement
    const requester = await prisma.registration.findFirst({
      where: { id: requesterId, eventId }
    });
    
    const recipient = await prisma.registration.findFirst({
      where: { id: recipientId, eventId }
    });
    
    if (!requester || !recipient) {
      return NextResponse.json(
        { message: "Demandeur ou destinataire invalide pour cet événement" },
        { status: 400 }
      );
    }
    
    // Vérifier si un rendez-vous similaire existe déjà
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        eventId,
        AND: [
          { requesterId },
          { recipientId },
          { status: { in: ["PENDING", "ACCEPTED"] } }
        ]
      }
    });
    
    if (existingAppointment) {
      return NextResponse.json(
        { message: "Une demande de rendez-vous similaire existe déjà" },
        { status: 409 }
      );
    }
    
    // Création du rendez-vous
    const newAppointment = await prisma.appointment.create({
      data: {
        eventId,
        requesterId,
        recipientId,
        message,
        proposedTime: proposedTime ? new Date(proposedTime) : null,
        location,
        status: "PENDING"
      },
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            jobTitle: true,
          },
        },
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            jobTitle: true,
          },
        },
      },
    });
    
    // Créer une notification pour le destinataire
    try {
      const recipientUserId = await getUserIdFromParticipantEmail(recipient.email);
      if (recipientUserId) {
        const requesterName = `${requester.firstName} ${requester.lastName}`;
        await createAppointmentRequestNotificationV2(
          recipientUserId,
          eventId,
          requesterName,
          newAppointment.id,
          message
        );
        console.log(`🔔 Notification de demande de rendez-vous créée pour ${recipient.email}`);
      }
    } catch (notificationError) {
      console.error('⚠️ Erreur lors de la création de la notification de rendez-vous:', notificationError);
      // On ne fait pas échouer la création du rendez-vous si la notification échoue
    }
    
    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création du rendez-vous" },
      { status: 500 }
    );
  }
} 