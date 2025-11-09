import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // Vérification de l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }
    
    // Vérifier que l'événement existe et appartient à l'utilisateur (ou qu'il est ADMIN)
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(session.user.role !== 'ADMIN' ? { userId: session.user.id } : {}),
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }
    
    // Récupérer le paramètre de période depuis l'URL
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7j';
    
    // Valider le paramètre period
    const validPeriods = ['7j', '30j', 'all'];
    const validatedPeriod = validPeriods.includes(period) ? period : '7j';
    
    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date | null = null;
    if (validatedPeriod === '7j') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (validatedPeriod === '30j') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Utiliser l'événement déjà récupéré avec Prisma (plus sécurisé)
    
    // Récupérer les statistiques d'inscription (optimisé avec Prisma)
    const registrationStats = await prisma.registration.aggregate({
      where: {
        eventId: eventId,
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      _count: {
        id: true,
      },
    });
    
    const checkedInCount = await prisma.registration.count({
      where: {
        eventId: eventId,
        checkedIn: true,
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
    });
    
    const registrationStatsData = {
      total: registrationStats._count.id || 0,
      checkedIn: checkedInCount || 0,
    };
    
    // Récupérer le nombre de participants par type (optimisé avec Prisma)
    const participantTypesRaw = await prisma.registration.groupBy({
      by: ['type'],
      where: {
        eventId: eventId,
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });
    
    const participantTypes = participantTypesRaw.map((item: { type: string | null; _count: { id: number } }) => ({
      type: item.type || 'N/A',
      count: item._count.id || 0,
    }));
    
    // Récupérer les sessions de l'événement avec le nombre de participants (optimisé avec Prisma)
    const allSessions = await prisma.event_sessions.findMany({
      where: {
        eventId: eventId,
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });
    
    // Trier par nombre de participants et prendre le top 5
    const topSessions = allSessions
      .map((session: { id: string; title: string; _count: { participants: number } }) => ({
        id: session.id,
        title: session.title,
        participantCount: session._count.participants || 0,
      }))
      .sort((a: { participantCount: number }, b: { participantCount: number }) => b.participantCount - a.participantCount)
      .slice(0, 5);
    
    // Récupérer les inscriptions par jour (optimisé avec Prisma)
    // Utiliser une requête groupée par date
    const registrationsByDate = await prisma.registration.findMany({
      where: {
        eventId: eventId,
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      select: {
        createdAt: true,
      },
    });
    
    // Grouper par date
    const dailyRegistrationsMap = new Map<string, number>();
    registrationsByDate.forEach((reg: { createdAt: Date }) => {
      const date = new Date(reg.createdAt).toISOString().split('T')[0];
      dailyRegistrationsMap.set(date, (dailyRegistrationsMap.get(date) || 0) + 1);
    });
    
    const dailyRegistrations = Array.from(dailyRegistrationsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Formater les résultats
    const stats = {
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate?.toISOString() || null,
        endDate: event.endDate?.toISOString() || null,
      },
      registrations: {
        total: registrationStatsData.total,
        checkedIn: registrationStatsData.checkedIn,
      },
      participantTypes,
      topSessions,
      dailyRegistrations,
      period: validatedPeriod,
    };
    
    // Retourner les statistiques
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching analytics data" },
      { status: 500 }
    );
  }
} 