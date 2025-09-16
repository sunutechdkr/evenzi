/**
 * API NOTIFICATIONS V2 - Gestion d'une notification spécifique
 * PUT /api/notifications-v2/[id] - Marquer comme lue/non lue
 * DELETE /api/notifications-v2/[id] - Supprimer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Marquer une notification comme lue/non lue
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

    console.log(`🔄 Mise à jour notification ${id} -> isRead: ${isRead}`);

    try {
      const notification = await prisma.notification.update({
        where: {
          id: id,
          userId: session.user.id,
        },
        data: {
          isRead: isRead,
          readAt: isRead ? new Date() : null,
        },
        select: {
          id: true,
          title: true,
          isRead: true,
          readAt: true
        }
      });

      console.log('✅ Notification mise à jour:', notification);

      return NextResponse.json({ 
        success: true, 
        notification 
      });

    } catch (dbError) {
      console.error('❌ Erreur mise à jour notification:', dbError);
      return NextResponse.json(
        { error: 'Erreur de base de données', details: dbError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erreur générale PUT:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une notification
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

    console.log(`🗑️ Suppression notification ${id}`);

    try {
      const notification = await prisma.notification.delete({
        where: {
          id: id,
          userId: session.user.id,
        },
        select: {
          id: true,
          title: true
        }
      });

      console.log('✅ Notification supprimée:', notification);

      return NextResponse.json({ 
        success: true, 
        message: 'Notification supprimée avec succès' 
      });

    } catch (dbError) {
      console.error('❌ Erreur suppression notification:', dbError);
      return NextResponse.json(
        { error: 'Erreur de base de données', details: dbError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erreur générale DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
