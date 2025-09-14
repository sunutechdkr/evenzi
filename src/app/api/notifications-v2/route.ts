/**
 * API NOTIFICATIONS V2 - Version sécurisée et stable
 * GET /api/notifications-v2 - Récupérer les notifications
 * POST /api/notifications-v2 - Créer une notification (test uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer les notifications avec gestion d'erreur robuste
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const eventId = searchParams.get('eventId');
    const take = parseInt(searchParams.get('take') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    console.log(`🔍 Récupération notifications pour user: ${session.user.id}, eventId: ${eventId}`);

    try {
      // Vérifier d'abord si la table existe
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'notifications'
        );
      `;

      if (!tableExists) {
        console.log('⚠️ Table notifications n\'existe pas');
        return NextResponse.json({ 
          notifications: [], 
          unreadCount: 0,
          message: 'Table notifications non trouvée - veuillez exécuter le script SQL'
        });
      }

      // Construire la clause WHERE
      const whereConditions = [`user_id = $1`];
      const params = [session.user.id];
      let paramIndex = 2;

      if (isRead === 'true') {
        whereConditions.push(`is_read = $${paramIndex}`);
        params.push(true);
        paramIndex++;
      } else if (isRead === 'false') {
        whereConditions.push(`is_read = $${paramIndex}`);
        params.push(false);
        paramIndex++;
      }

      if (eventId) {
        whereConditions.push(`event_id = $${paramIndex}`);
        params.push(eventId);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Récupérer les notifications avec requête SQL directe
      const notifications = await prisma.$queryRaw`
        SELECT 
          id, user_id, title, message, type, priority,
          is_read, read_at, created_at, updated_at,
          event_id, entity_id, entity_type, action_url, metadata
        FROM notifications 
        WHERE ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ${take} OFFSET ${skip}
      `;

      // Compter les notifications non lues
      const unreadCountResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
        ${eventId ? `AND event_id = $2` : ''}
      `;

      const unreadCount = parseInt(unreadCountResult[0]?.count || '0');

      console.log(`✅ Trouvé ${notifications.length} notifications, ${unreadCount} non lues`);

      return NextResponse.json({ 
        notifications, 
        unreadCount,
        status: 'success'
      });

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError);
      
      // Si erreur de colonne, la table n'est pas à jour
      if (dbError.message?.includes('column') && dbError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          notifications: [], 
          unreadCount: 0,
          error: 'Structure de table incorrecte - veuillez exécuter le script SQL de mise à jour',
          sqlRequired: true
        });
      }

      // Autres erreurs DB
      return NextResponse.json({ 
        notifications: [], 
        unreadCount: 0,
        error: 'Erreur de base de données',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une notification de test
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { title, message, type = 'SYSTEM', priority = 'NORMAL', eventId } = await request.json();

    console.log(`🧪 Création notification test pour user: ${session.user.id}`);

    try {
      const notification = await prisma.$queryRaw`
        INSERT INTO notifications (user_id, title, message, type, priority, event_id, created_at, updated_at)
        VALUES (${session.user.id}, ${title}, ${message}, ${type}, ${priority}, ${eventId}, NOW(), NOW())
        RETURNING id, title, message, type, priority, created_at
      `;

      console.log('✅ Notification créée:', notification[0]);

      return NextResponse.json({ 
        success: true, 
        notification: notification[0] 
      });

    } catch (dbError) {
      console.error('❌ Erreur création notification:', dbError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la notification', details: dbError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erreur générale POST:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
