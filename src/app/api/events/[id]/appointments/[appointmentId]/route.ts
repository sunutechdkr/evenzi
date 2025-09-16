import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createAppointmentConfirmationNotificationV2, getUserIdFromParticipantEmail } from "@/lib/notifications-v2";

// GET: Récupère les détails d'un rendez-vous spécifique
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const { id: eventId, appointmentId } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        eventId,
      },
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
    });

    if (!appointment) {
      return NextResponse.json(
        { message: "Rendez-vous non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Erreur lors de la récupération du rendez-vous:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du rendez-vous" },
      { status: 500 }
    );
  }
}

// PUT: Mise à jour d'un rendez-vous (accepter, refuser, terminer)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const { id: eventId, appointmentId } = await params;
    const body = await request.json();
    
    // Récupérer les données à mettre à jour
    const { status, confirmedTime, notes } = body;
    
    // Vérifier que le rendez-vous existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        eventId,
      },
    });
    
    if (!existingAppointment) {
      return NextResponse.json(
        { message: "Rendez-vous non trouvé" },
        { status: 404 }
      );
    }
    
    // Préparer les données de mise à jour
    const updateData: {
      status?: string;
      confirmedTime?: Date;
      notes?: string;
    } = {};
    
    if (status) {
      updateData.status = status;
      
      // Si le rendez-vous est accepté et qu'un horaire est proposé, le confirmer
      if (status === "ACCEPTED" && (confirmedTime || existingAppointment.proposedTime)) {
        updateData.confirmedTime = confirmedTime ? new Date(confirmedTime) : existingAppointment.proposedTime;
      }
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    // Mettre à jour le rendez-vous
    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
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
    });
    
    // Si le rendez-vous est accepté, créer des notifications de confirmation pour les deux parties
    if (status === "ACCEPTED" && updateData.confirmedTime) {
      try {
        const appointmentTime = updateData.confirmedTime.toLocaleString('fr-FR', {
          dateStyle: 'short',
          timeStyle: 'short'
        });
        const appointmentLocation = updatedAppointment.location || 'À définir';

        // Notification pour le demandeur
        const requesterUserId = await getUserIdFromParticipantEmail(updatedAppointment.requester.email);
        if (requesterUserId) {
          const recipientName = `${updatedAppointment.recipient.firstName} ${updatedAppointment.recipient.lastName}`;
          await createAppointmentConfirmationNotificationV2(
            requesterUserId,
            eventId,
            recipientName,
            appointmentTime,
            appointmentLocation,
            appointmentId
          );
          console.log(`🔔 Notification de confirmation créée pour le demandeur ${updatedAppointment.requester.email}`);
        }

        // Notification pour le destinataire
        const recipientUserId = await getUserIdFromParticipantEmail(updatedAppointment.recipient.email);
        if (recipientUserId) {
          const requesterName = `${updatedAppointment.requester.firstName} ${updatedAppointment.requester.lastName}`;
          await createAppointmentConfirmationNotificationV2(
            recipientUserId,
            eventId,
            requesterName,
            appointmentTime,
            appointmentLocation,
            appointmentId
          );
          console.log(`🔔 Notification de confirmation créée pour le destinataire ${updatedAppointment.recipient.email}`);
        }
      } catch (notificationError) {
        console.error('⚠️ Erreur lors de la création des notifications de confirmation:', notificationError);
        // On ne fait pas échouer la mise à jour si la notification échoue
      }
    }
    
    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rendez-vous:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du rendez-vous" },
      { status: 500 }
    );
  }
}

// DELETE: Supprime un rendez-vous
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const { id: eventId, appointmentId } = await params;

    // Vérifier que le rendez-vous existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        eventId,
      },
    });
    
    if (!existingAppointment) {
      return NextResponse.json(
        { message: "Rendez-vous non trouvé" },
        { status: 404 }
      );
    }
    
    // Supprimer le rendez-vous
    await prisma.appointment.delete({
      where: {
        id: appointmentId,
      },
    });
    
    return NextResponse.json(
      { message: "Rendez-vous supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du rendez-vous:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du rendez-vous" },
      { status: 500 }
    );
  }
} 