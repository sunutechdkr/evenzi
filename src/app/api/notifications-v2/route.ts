/**
 * API NOTIFICATIONS V2 - Version sécurisée et stable
 * GET /api/notifications-v2 - Récupérer les notifications
 * POST /api/notifications-v2 - Créer une notification (test uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/apiCache';

// GET - Récupérer les notifications avec gestion d'erreur robuste
async function getNotificationsHandler(request: NextRequest) {
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

      // Utiliser Prisma ORM au lieu de SQL raw pour éviter les erreurs de syntaxe
      const whereClause: any = {
        userId: session.user.id,
      };

      if (isRead === 'true') {
        whereClause.isRead = true;
      } else if (isRead === 'false') {
        whereClause.isRead = false;
      }

      if (eventId) {
        whereClause.eventId = eventId;
      }

      // Récupérer les notifications avec Prisma ORM
      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        take,
        skip,
        select: {
          id: true,
          userId: true,
          title: true,
          message: true,
          type: true,
          priority: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          updatedAt: true,
          eventId: true,
          entityId: true,
          entityType: true,
          actionUrl: true,
          metadata: true,
          event: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      // Compter les notifications non lues
      const unreadCountWhere: any = { 
        userId: session.user.id, 
        isRead: false 
      };
      if (eventId) {
        unreadCountWhere.eventId = eventId;
      }

      const unreadCount = await prisma.notification.count({
        where: unreadCountWhere
      });

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

// Wrapping GET avec cache (1 minute pour les notifications)
export const GET = withCache(
  getNotificationsHandler,
  {
    ttl: 60, // 1 minute (données temps réel)
    key: (req: NextRequest) => {
      const url = req.nextUrl;
      const isRead = url.searchParams.get('isRead') || 'all';
      const eventId = url.searchParams.get('eventId') || 'all';
      const take = url.searchParams.get('take') || '50';
      const skip = url.searchParams.get('skip') || '0';
      return `api:notifications:read-${isRead}:event-${eventId}:take-${take}:skip-${skip}`;
    },
    shouldCache: (req: NextRequest, res: NextResponse) => {
      return res.status === 200;
    }
  }
);

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
