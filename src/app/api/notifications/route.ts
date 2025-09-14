/**
 * API Routes pour la gestion des notifications
 * GET /api/notifications - Récupérer les notifications de l'utilisateur
 * POST /api/notifications - Créer une nouvelle notification (admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  createNotification
} from '@/lib/notifications';
import { NotificationType, NotificationPriority } from '@prisma/client';

// GET /api/notifications - Récupérer les notifications de l'utilisateur
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
    const type = searchParams.get('type') as NotificationType;
    const eventId = searchParams.get('eventId');
    const take = parseInt(searchParams.get('take') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    try {
      // Construire la clause where de manière sûre
      const where: any = { userId: session.user.id };

      if (isRead === 'true') {
        where.isRead = true;
      } else if (isRead === 'false') {
        where.isRead = false;
      }

      if (type && Object.values(NotificationType).includes(type)) {
        where.type = type;
      }

      if (eventId) {
        where.eventId = eventId;
      }

      // Récupérer les notifications avec gestion d'erreur robuste
      const notifications = await prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take,
        skip,
      });

      // Compter les notifications non lues
      const unreadCount = await prisma.notification.count({
        where: { userId: session.user.id, isRead: false, eventId: eventId || undefined },
      });

      return NextResponse.json({ notifications, unreadCount });
    } catch (dbError) {
      console.error('Erreur base de données lors de la récupération des notifications:', dbError);
      // Retourner des valeurs par défaut si la table n'existe pas encore
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Créer une nouvelle notification (admin uniquement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Seuls les admins peuvent créer des notifications manuellement
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé - Admin requis' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      userId,
      title,
      message,
      type,
      priority,
      eventId,
      entityId,
      entityType,
      actionUrl,
      metadata
    } = body;

    // Validation des données requises
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Données manquantes: userId, title, message et type sont requis' },
        { status: 400 }
      );
    }

    // Validation du type de notification
    const validTypes = Object.values(NotificationType);
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Type de notification invalide' },
        { status: 400 }
      );
    }

    // Validation de la priorité si fournie
    if (priority) {
      const validPriorities = Object.values(NotificationPriority);
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Priorité de notification invalide' },
          { status: 400 }
        );
      }
    }

    const notification = await createNotification({
      userId,
      title,
      message,
      type,
      priority: priority || 'NORMAL',
      eventId,
      entityId,
      entityType,
      actionUrl,
      metadata,
    });

    return NextResponse.json({
      success: true,
      notification,
    });

  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
