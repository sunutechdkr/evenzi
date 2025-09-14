/**
 * API Route pour marquer toutes les notifications comme lues
 * POST /api/notifications/mark-all-read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markAllNotificationsAsRead } from '@/lib/notifications';

// POST /api/notifications/mark-all-read - Marquer toutes les notifications comme lues
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId } = body;

    const result = await markAllNotificationsAsRead(
      session.user.id, 
      eventId || undefined
    );
    
    return NextResponse.json({
      success: true,
      message: `${result.count} notifications marquées comme lues`,
      count: result.count,
    });

  } catch (error) {
    console.error('Erreur lors du marquage des notifications:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
