/**
 * API Route pour marquer toutes les notifications comme lues
 * POST /api/notifications/mark-all-read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/notifications/mark-all-read - Marquer toutes les notifications comme lues
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { eventId } = await request.json();

    try {
      const updateWhere: any = { userId: session.user.id, isRead: false };
      if (eventId) {
        updateWhere.eventId = eventId;
      }

      const { count } = await prisma.notification.updateMany({
        where: updateWhere,
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, count });
    } catch (dbError) {
      console.error('Erreur base de données lors du marquage de toutes les notifications comme lues:', dbError);
      return NextResponse.json({ success: true, count: 0 });
    }

  } catch (error) {
    console.error('Erreur lors du marquage des notifications:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
