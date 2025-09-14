/**
 * API Routes pour la gestion d'une notification spécifique
 * PUT /api/notifications/[id] - Marquer une notification comme lue
 * DELETE /api/notifications/[id] - Supprimer une notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  markNotificationAsRead, 
  deleteNotification 
} from '@/lib/notifications';

// PUT /api/notifications/[id] - Marquer une notification comme lue
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'mark_read') {
      const notification = await markNotificationAsRead(id, session.user.id);
      
      return NextResponse.json({
        success: true,
        notification,
      });
    }

    return NextResponse.json(
      { error: 'Action non supportée' },
      { status: 400 }
    );

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
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    const notification = await deleteNotification(id, session.user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Notification supprimée avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
