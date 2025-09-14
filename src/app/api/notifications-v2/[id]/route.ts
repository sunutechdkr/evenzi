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
      const result = await prisma.$queryRaw`
        UPDATE notifications 
        SET 
          is_read = ${isRead}, 
          read_at = ${isRead ? new Date() : null},
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${session.user.id}
        RETURNING id, title, is_read, read_at
      `;

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Notification non trouvée ou non autorisée' },
          { status: 404 }
        );
      }

      console.log('✅ Notification mise à jour:', result[0]);

      return NextResponse.json({ 
        success: true, 
        notification: result[0] 
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
      const result = await prisma.$queryRaw`
        DELETE FROM notifications 
        WHERE id = ${id} AND user_id = ${session.user.id}
        RETURNING id, title
      `;

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Notification non trouvée ou non autorisée' },
          { status: 404 }
        );
      }

      console.log('✅ Notification supprimée:', result[0]);

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
