import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Vous devez être connecté' },
        { status: 401 }
      );
    }

    const { id: eventId, sessionId } = await params;

    // Vérifier que l'utilisateur est inscrit à l'événement
    const registration = await prisma.registration.findFirst({
      where: {
        eventId: eventId,
        email: session.user.email,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { message: 'Vous devez être inscrit à cet événement pour participer aux sessions' },
        { status: 403 }
      );
    }

    // Vérifier que la session existe
    const eventSession = await prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        eventId: eventId,
      },
    });

    if (!eventSession) {
      return NextResponse.json(
        { message: 'Session non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur participe déjà à cette session
    const existingParticipation = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId: sessionId,
        participantId: registration.id,
      },
    });

    if (existingParticipation) {
      return NextResponse.json(
        { message: 'Vous participez déjà à cette session' },
        { status: 400 }
      );
    }

    // Ajouter l'utilisateur comme participant à la session
    await prisma.sessionParticipant.create({
      data: {
        sessionId: sessionId,
        participantId: registration.id,
        joinedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Vous participez maintenant à cette session !' 
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription à la session:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
