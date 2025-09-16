/**
 * API NOTIFICATIONS V2 - Marquer toutes les notifications comme lues
 * POST /api/notifications-v2/mark-all-read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    console.log(`📝 Marquage toutes notifications comme lues pour user: ${session.user.id}, eventId: ${eventId}`);

    try {
      const updateWhere: any = { 
        userId: session.user.id, 
        isRead: false 
      };
      
      if (eventId) {
        updateWhere.eventId = eventId;
      }

      const result = await prisma.notification.updateMany({
        where: updateWhere,
        data: {
          isRead: true,
          readAt: new Date(),
        }
      });

      console.log(`✅ ${result.count} notifications marquées comme lues`);

      return NextResponse.json({ 
        success: true, 
        count: result.count,
        message: `${result.count} notifications marquées comme lues`
      });

    } catch (dbError) {
      console.error('❌ Erreur marquage notifications:', dbError);
      return NextResponse.json(
        { error: 'Erreur de base de données', details: dbError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erreur générale mark-all-read:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
