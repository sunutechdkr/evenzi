import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: eventId, templateId } = await params;
    const body = await request.json();

    // Vérifier que le template existe
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 });
    }

    // Si c'est un template global, créer une copie pour l'événement
    if (existingTemplate.isGlobal && !existingTemplate.eventId) {
      // Créer une copie personnalisée pour cet événement
      const customTemplate = await prisma.emailTemplate.create({
        data: {
          name: existingTemplate.name,
          description: existingTemplate.description,
          subject: existingTemplate.subject,
          htmlContent: existingTemplate.htmlContent,
          textContent: existingTemplate.textContent,
          type: existingTemplate.type,
          eventId: eventId,
          isGlobal: false,
          isActive: body.isActive ?? existingTemplate.isActive,
        }
      });

      return NextResponse.json(customTemplate);
    } else {
      // Mettre à jour le template existant
      const updatedTemplate = await prisma.emailTemplate.update({
        where: { id: templateId },
        data: {
          isActive: body.isActive,
          subject: body.subject,
          htmlContent: body.htmlContent,
          textContent: body.textContent,
        }
      });

      return NextResponse.json(updatedTemplate);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du template:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du template' },
      { status: 500 }
    );
  }
} 