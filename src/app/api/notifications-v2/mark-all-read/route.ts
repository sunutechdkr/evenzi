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
      let query;
      let params = [session.user.id];

      if (eventId) {
        query = `
          UPDATE notifications 
          SET is_read = true, read_at = NOW(), updated_at = NOW()
          WHERE user_id = $1 AND event_id = $2 AND is_read = false
        `;
        params.push(eventId);
      } else {
        query = `
          UPDATE notifications 
          SET is_read = true, read_at = NOW(), updated_at = NOW()
          WHERE user_id = $1 AND is_read = false
        `;
      }

      const result = await prisma.$executeRaw`${query}`;

      console.log(`✅ ${result} notifications marquées comme lues`);

      return NextResponse.json({ 
        success: true, 
        count: result,
        message: `${result} notifications marquées comme lues`
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
