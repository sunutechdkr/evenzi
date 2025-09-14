import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { generateShortCode } from "@/lib/shortcodes";
import { sendRegistrationConfirmationEmail } from "@/lib/registrationEmail";
import { 
  createRegistrationMilestoneNotification,
  checkRegistrationMilestone 
} from "@/lib/notifications";

// POST /api/register - Create a new registration without authentication
export async function POST(request: Request) {
  try {
    // Parse request body
    const { firstName, lastName, email, phone, jobTitle, company, type, eventId, ticketId } = await request.json();
    
    // Validate required fields
    if (!firstName || !lastName || !email || !eventId) {
      return NextResponse.json(
        { message: "Tous les champs obligatoires sont requis" },
        { status: 400 }
      );
    }

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 }
      );
    }
    

    // If ticketId is provided, validate the ticket
    if (ticketId) {
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          eventId: eventId,
          status: 'ACTIVE',
          visibility: 'VISIBLE'
        }
      });

      if (!ticket) {
        return NextResponse.json(
          { message: "Billet non valide ou non disponible" },
          { status: 400 }
        );
      }

      // Check if ticket has reached its limit
      if (ticket.quantity && ticket.sold >= ticket.quantity) {
        return NextResponse.json(
          { message: "Ce billet n'est plus disponible" },
          { status: 400 }
        );
      }
    }

    // Check if email is already registered for this event
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        email,
        eventId,
      },
    });
    
    if (existingRegistration) {
      return NextResponse.json(
        { message: "Cette adresse email est déjà inscrite à cet événement" },
        { status: 409 }
      );
    }
    
    // Generate a short code for the badge QR
    let shortCode = generateShortCode();
    let isUniqueShortCode = false;
    
    // Ensure the shortCode is unique
    while (!isUniqueShortCode) {
      // Check if the shortCode already exists
      const existingCode = await prisma.registration.findFirst({
        where: { shortCode },
      });
      
      if (!existingCode) {
        isUniqueShortCode = true;
      } else {
        // If collision, generate a new code
        shortCode = generateShortCode();
      }
    }
    
    // Use the shortCode as the QR code value
    const qrCode = shortCode;
    
    // Create the registration
    const registration = await prisma.registration.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        type: type || "PARTICIPANT",
        jobTitle,
        company,
        qrCode,
        shortCode,
        eventId,
        ticketId: ticketId || null,
      },
    });

    // If a ticket was selected, increment the sold count
    if (ticketId) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          sold: {
            increment: 1
          }
        }
      });
    }

    // Envoyer l'email de confirmation d'inscription
    try {
      await sendRegistrationConfirmationEmail({
        eventId: eventId,
        participantEmail: email,
        participantName: `${firstName} ${lastName}`,
        registrationId: registration.id
      });
      
      console.log(`📧 Email de confirmation d'inscription envoyé à ${email} pour l'événement ${event.name}`);
    } catch (emailError) {
      console.error('⚠️ Erreur lors de l\'envoi de l\'email de confirmation d\'inscription:', emailError);
      // On ne fait pas échouer l'inscription si l'email échoue
    }

    // Vérifier si on a atteint un palier d'inscription (100, 250, 500, etc.)
    try {
      const milestoneCheck = await checkRegistrationMilestone(eventId);
      
      if (milestoneCheck.shouldNotify && milestoneCheck.milestone) {
        await createRegistrationMilestoneNotification(
          event.user.id, // ID de l'organisateur
          eventId,
          event.name,
          milestoneCheck.milestone
        );
        console.log(`🎉 Notification de palier d'inscription créée: ${milestoneCheck.milestone} participants pour l'événement ${event.name}`);
      }
    } catch (notificationError) {
      console.error('⚠️ Erreur lors de la vérification du palier d\'inscription:', notificationError);
      // On ne fait pas échouer l'inscription si la notification échoue
    }
    
    return NextResponse.json(
      { 
        message: "Inscription réussie",
        registrationId: registration.id,
        eventSlug: event.slug
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating registration:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'inscription", details: String(error) },
      { status: 500 }
    );
  }
} 