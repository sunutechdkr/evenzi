import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';
import { createEmailCampaignNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const {
      name,
      description,
      recipientType,
      subject,
      htmlContent,
      type,
      sendType,
      scheduledAt
    } = await request.json();

    // Récupérer les informations de l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        name: true,
        startDate: true,
        location: true,
        banner: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    // Récupérer les destinataires selon le type
    const recipients = await getRecipients(eventId, recipientType);

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Aucun destinataire trouvé' }, { status: 400 });
    }

    // Traiter le contenu avec les variables d'événement
    const logoBase64 = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100"><rect width="400" height="100" fill="#81B441"/><text x="200" y="60" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="white">Evenzi App</text></svg>`).toString('base64')}`;

    // Créer la campagne
    const campaign = await prisma.emailCampaign.create({
      data: {
        eventId,
        name,
        description,
        type: type || 'CUSTOM',
        recipientType,
        subject,
        htmlContent,
        status: sendType === 'immediate' ? 'SENDING' : 'SCHEDULED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalRecipients: recipients.length
      }
    });

    if (!campaign.htmlContent) {
      return NextResponse.json({ error: 'Le contenu de l\'email est vide' }, { status: 400 });
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    if (sendType === 'immediate') {
      // Envoi immédiat
      for (const recipient of recipients) {
        try {
          const processedContent = htmlContent
            .replace(/\{\{eventBanner\}\}/g, logoBase64)
            .replace(/\{\{eventName\}\}/g, event.name)
            .replace(/\{\{participantName\}\}/g, recipient.name)
            .replace(/\{\{eventDate\}\}/g, new Date(event.startDate).toLocaleDateString())
            .replace(/\{\{eventTime\}\}/g, '14h00')
            .replace(/\{\{eventLocation\}\}/g, event.location)
            .replace(/\{\{organizerName\}\}/g, 'Organisateur')
            .replace(/\{\{supportEmail\}\}/g, 'support@evenzi.io');

          const processedSubject = subject
            .replace(/\{\{eventName\}\}/g, event.name)
            .replace(/\{\{participantName\}\}/g, recipient.name)
            .replace(/\{\{eventDate\}\}/g, new Date(event.startDate).toLocaleDateString());

          await sendEmail({
            from: 'noreply@evenzi.io',
            to: recipient.email,
            subject: processedSubject,
            html: processedContent,
          });

          // Logger le succès
          await prisma.emailLog.create({
            data: {
              campaignId: campaign.id,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              status: 'SENT',
              sentAt: new Date()
            }
          });

          emailsSent++;
        } catch (error) {
          console.error(`Erreur envoi à ${recipient.email}:`, error);
          
          // Logger l'échec
          await prisma.emailLog.create({
            data: {
              campaignId: campaign.id,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
            }
          });

          emailsFailed++;
        }
      }

      // Mettre à jour la campagne
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          successCount: emailsSent,
          failureCount: emailsFailed
        }
      });
    } else {
      // Envoi programmé - créer les logs en attente
      for (const recipient of recipients) {
        await prisma.emailLog.create({
          data: {
            campaignId: campaign.id,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            status: 'PENDING'
          }
        });
      }
    }

    // Créer une notification pour l'organisateur
    try {
      await createEmailCampaignNotification(
        session.user.id,
        eventId,
        campaign.name,
        sendType === 'immediate' ? emailsSent : recipients.length,
        campaign.id
      );
      console.log(`🔔 Notification de campagne email créée pour l'utilisateur ${session.user.id}`);
    } catch (notificationError) {
      console.error('⚠️ Erreur lors de la création de la notification de campagne:', notificationError);
      // On ne fait pas échouer l'envoi si la notification échoue
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      recipientCount: recipients.length,
      emailsSent,
      emailsFailed,
      message: sendType === 'immediate' 
        ? `${emailsSent} emails envoyés, ${emailsFailed} échecs`
        : `Campagne programmée pour ${recipients.length} destinataires`
    });

  } catch (error) {
    console.error('Erreur envoi campagne:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la campagne' },
      { status: 500 }
    );
  }
}

async function getRecipients(eventId: string, recipientType: string): Promise<{email: string, name: string}[]> {
  switch (recipientType) {
    case 'ALL_PARTICIPANTS':
      const allParticipants = await prisma.registration.findMany({
        where: { eventId },
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      });
      return allParticipants.map((p: {email: string; firstName: string | null; lastName: string | null}) => ({
        email: p.email,
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim()
      }));

    case 'PARTICIPANTS':
      const participants = await prisma.registration.findMany({
        where: { 
          eventId,
          type: 'PARTICIPANT'
        },
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      });
      return participants.map((p: {email: string; firstName: string | null; lastName: string | null}) => ({
        email: p.email,
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim()
      }));

    case 'SPEAKERS':
      // TODO: Implémenter quand la table speakers sera créée
      return [];

    case 'EXHIBITORS':
      // TODO: Implémenter quand la table exhibitors sera créée
      return [];

    case 'SPONSORS':
      // Pour l'instant on utilise un email générique pour les sponsors
      const sponsors = await prisma.sponsor.findMany({
        where: { eventId },
        select: { name: true, website: true }
      });
      
      return sponsors.map((sponsor: {name: string, website: string | null}) => ({
        email: 'contact@' + (sponsor.website?.replace(/https?:\/\//, '') || 'example.com'),
        name: sponsor.name
      }));

    default:
      return [];
  }
} 