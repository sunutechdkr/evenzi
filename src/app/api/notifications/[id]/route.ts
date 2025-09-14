/**
 * API Routes pour la gestion d'une notification spécifique
 * PUT /api/notifications/[id] - Marquer une notification comme lue
 * DELETE /api/notifications/[id] - Supprimer une notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/notifications/[id] - Marquer une notification comme lue
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { isRead } = await request.json();

    try {
      const notification = await prisma.notification.update({
        where: {
          id: id,
          userId: session.user.id, // Ensure user owns the notification
        },
        data: {
          isRead: isRead,
          readAt: isRead ? new Date() : null,
        },
      });

      return NextResponse.json(notification);
    } catch (dbError) {
      console.error('Erreur base de données lors de la mise à jour de la notification:', dbError);
      return NextResponse.json(
        { error: 'Notification non trouvée ou non autorisée' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Supprimer une notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    try {
      await prisma.notification.delete({
        where: {
          id: id,
          userId: session.user.id, // Ensure user owns the notification
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Notification supprimée avec succès',
      });
    } catch (dbError) {
      console.error('Erreur base de données lors de la suppression de la notification:', dbError);
      return NextResponse.json(
        { error: 'Notification non trouvée ou non autorisée' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
