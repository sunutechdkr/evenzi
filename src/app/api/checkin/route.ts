import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendCheckinConfirmationEmail } from "@/lib/checkinEmail";
import { logger, logCheckIn, logHttpError } from "@/lib/logger";
import { 
  checkCheckinMilestone, 
  createCheckinMilestoneNotification,
  createDigitalBadgeNotification 
} from "@/lib/notifications";

// Schema for QR code check-in
const qrCheckInSchema = z.object({
  qrCode: z.string().min(1),
  eventId: z.string().min(1),
});

// Schema for short code check-in
const shortCodeCheckInSchema = z.object({
  shortCode: z.string().min(1),
  eventId: z.string().min(1),
});

// Schema for manual check-in by email
const emailCheckInSchema = z.object({
  email: z.string().email(),
  eventId: z.string().min(1),
});

// Schema for participant ID check-in
const participantIdCheckInSchema = z.object({
  participantId: z.string().min(1),
  eventId: z.string().min(1),
});

export async function POST(request: Request) {
  // Check for authentication
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    
    // Logging pour le débogage
    console.log("Check-in request:", JSON.stringify(body));
    
    // Determine check-in method
    const isQrCheckIn = "qrCode" in body;
    const isShortCodeCheckIn = "shortCode" in body;
    const isEmailCheckIn = "email" in body;
    const isParticipantIdCheckIn = "participantId" in body;
    
    if (!isQrCheckIn && !isShortCodeCheckIn && !isEmailCheckIn && !isParticipantIdCheckIn) {
      console.error("Invalid check-in data, missing required fields");
      return NextResponse.json(
        { message: "Invalid check-in data. Must provide either qrCode, shortCode, email, or participantId." },
        { status: 400 }
      );
    }
    
    const { eventId } = body;
    
    // Get the event using secure Prisma query
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true }
    });
    
    if (!event) {
      logCheckIn('not_found', eventId, undefined, { reason: 'event_not_found' });
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }
    
    // Recherche du participant
    let registrationQuery;
    
    try {
      if (isQrCheckIn) {
        // Validate QR code check-in data
        const validationResult = qrCheckInSchema.safeParse(body);
        
        if (!validationResult.success) {
          return NextResponse.json(
            { message: "Invalid check-in data" },
            { status: 400 }
          );
        }
        
        const { qrCode } = validationResult.data;
        logCheckIn('attempt', eventId, undefined, { method: 'qr_code' });
        
        // D'abord essayer de rechercher par short_code (prioritaire)
        let registration = await prisma.registration.findFirst({
          where: {
            shortCode: qrCode,
            eventId: eventId
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            checkedIn: true,
            checkInTime: true,
            eventId: true,
            type: true,
            shortCode: true
          }
        });
        
        // Si aucun résultat avec le short_code, essayer avec le qr_code complet (pour rétrocompatibilité)
        if (!registration) {
          logger.debug('Participant not found with short_code, trying with full qr_code', { eventId });
          registration = await prisma.registration.findFirst({
            where: {
              qrCode: qrCode,
              eventId: eventId
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              checkedIn: true,
              checkInTime: true,
              eventId: true,
              type: true,
              shortCode: true
            }
          });
        }
        
        registrationQuery = registration ? [registration] : [];
      } else if (isShortCodeCheckIn) {
        // Validate short code check-in data
        const validationResult = shortCodeCheckInSchema.safeParse(body);
        
        if (!validationResult.success) {
          return NextResponse.json(
            { message: "Invalid check-in data" },
            { status: 400 }
          );
        }
        
        const { shortCode } = validationResult.data;
        
        logCheckIn('attempt', eventId, undefined, { method: 'short_code' });
        
        // Find registration by short code using secure Prisma query
        const registration = await prisma.registration.findFirst({
          where: {
            shortCode: shortCode,
            eventId: eventId
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            checkedIn: true,
            checkInTime: true,
            eventId: true,
            type: true,
            shortCode: true
          }
        });
        
        registrationQuery = registration ? [registration] : [];
      } else if (isEmailCheckIn) {
        // Validate email check-in data
        const validationResult = emailCheckInSchema.safeParse(body);
        
        if (!validationResult.success) {
          return NextResponse.json(
            { message: "Invalid check-in data" },
            { status: 400 }
          );
        }
        
        const { email } = validationResult.data;
        
        logCheckIn('attempt', eventId, undefined, { method: 'email' });
        
        // Find registration by email using secure Prisma query
        const registration = await prisma.registration.findFirst({
          where: {
            email: email,
            eventId: eventId
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            checkedIn: true,
            checkInTime: true,
            eventId: true,
            type: true,
            shortCode: true
          }
        });
        
        registrationQuery = registration ? [registration] : [];
      } else if (isParticipantIdCheckIn) {
        // Validate participant ID check-in data
        const validationResult = participantIdCheckInSchema.safeParse(body);
        
        if (!validationResult.success) {
          return NextResponse.json(
            { message: "Invalid check-in data" },
            { status: 400 }
          );
        }
        
        const { participantId } = validationResult.data;
        
        logCheckIn('attempt', eventId, participantId, { method: 'participant_id' });
        
        // Find registration by ID using secure Prisma query
        const registration = await prisma.registration.findFirst({
          where: {
            id: participantId,
            eventId: eventId
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            checkedIn: true,
            checkInTime: true,
            eventId: true,
            type: true,
            shortCode: true
          }
        });
        
        registrationQuery = registration ? [registration] : [];
      }
    } catch (searchError) {
      logHttpError(
        searchError as Error,
        'POST',
        '/api/checkin',
        500,
        { eventId, action: 'search_registration' }
      );
      return NextResponse.json(
        { message: "Error searching for registration" },
        { status: 500 }
      );
    }
    
    const registration = Array.isArray(registrationQuery) && registrationQuery.length > 0
      ? registrationQuery[0]
      : null;
    
    if (!registration) {
      logCheckIn('not_found', eventId, undefined, { reason: 'participant_not_found' });
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 }
      );
    }
    
    if (registration.checkedIn) {
      logCheckIn('duplicate', eventId, registration.id, { checkInTime: registration.checkInTime });
      return NextResponse.json(
        { 
          message: "Attendee already checked in",
          registration,
        },
        { status: 200 }
      );
    }
    
    // Update the registration as checked in using secure Prisma query
    try {
      const updatedRegistration = await prisma.registration.update({
        where: { id: registration.id },
        data: {
          checkedIn: true,
          checkInTime: new Date()
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          checkedIn: true,
          checkInTime: true,
          eventId: true,
          type: true,
          shortCode: true
        }
      });
      
      if (!updatedRegistration) {
        return NextResponse.json(
          { message: "Error updating check-in status" },
          { status: 500 }
        );
      }
      
      logCheckIn('success', eventId, updatedRegistration.id, { 
        checkInTime: updatedRegistration.checkInTime 
      });

      // Vérifier les paliers de check-in et envoyer les notifications appropriées
      try {
        // 1. Vérifier si on a atteint un palier de check-in pour l'organisateur
        const milestoneCheck = await checkCheckinMilestone(eventId);
        
        if (milestoneCheck.shouldNotify && milestoneCheck.milestone && milestoneCheck.count) {
          // Récupérer l'organisateur de l'événement
          const eventWithOrganizer = await prisma.event.findUnique({
            where: { id: eventId },
            select: { userId: true }
          });
          
          if (eventWithOrganizer) {
            await createCheckinMilestoneNotification(
              eventWithOrganizer.userId,
              eventId,
              milestoneCheck.count,
              milestoneCheck.milestone
            );
            console.log(`🎉 Notification de palier check-in créée: ${milestoneCheck.count} participants ont fait leur check-in`);
          }
        }

        // 2. Créer une notification de badge digital pour le participant
        // Rechercher l'ID utilisateur du participant s'il existe
        const participantUser = await prisma.user.findFirst({
          where: { email: updatedRegistration.email },
          select: { id: true }
        });

        if (participantUser) {
          await createDigitalBadgeNotification(
            participantUser.id,
            eventId
          );
          console.log(`🎫 Notification de badge digital créée pour ${updatedRegistration.firstName} ${updatedRegistration.lastName}`);
        }
      } catch (notificationError) {
        console.error('⚠️ Erreur lors de la création des notifications de check-in:', notificationError);
        // On ne fait pas échouer le check-in si les notifications échouent
      }
    
      // Envoi de l'email de confirmation de check-in
      if (updatedRegistration) {
        try {
          const checkInTime = new Date().toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          await sendCheckinConfirmationEmail({
            eventId: eventId,
            participantEmail: updatedRegistration.email,
            participantName: `${updatedRegistration.firstName} ${updatedRegistration.lastName}`,
            checkInTime: checkInTime
          });
          
          console.log(`📧 Email de confirmation envoyé à ${updatedRegistration.email}`);
        } catch (emailError) {
          console.error('⚠️ Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
          // On ne fait pas échouer le check-in si l'email échoue
        }
      }

      return NextResponse.json({
        message: "Check-in successful",
        registration: updatedRegistration,
      });
    } catch (updateError) {
      console.error("Error updating registration:", updateError);
      return NextResponse.json(
        { message: "Error updating check-in status" },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Check-in global error:", error);
    return NextResponse.json(
      { message: "Error processing check-in" },
      { status: 500 }
    );
  }
} 