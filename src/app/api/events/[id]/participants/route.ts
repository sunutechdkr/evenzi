import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCache } from '@/lib/apiCache';

async function getParticipantsHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    
    if (!id) {
      return NextResponse.json(
        { message: "ID d'événement requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe (avec Prisma optimisé)
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, slug: true }
    });

    if (!event) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Construire les conditions de recherche
    const whereClause: any = {
      eventId: id,
    };

    if (query) {
      whereClause.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { shortCode: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (type) {
      whereClause.type = type;
    }

    // Récupérer les participants avec pagination
    const [participants, totalCount] = await Promise.all([
      prisma.registration.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobTitle: true,
          company: true,
          type: true,
          checkedIn: true,
          checkInTime: true,
          shortCode: true,
          createdAt: true,
        },
        orderBy: { lastName: 'asc' },
        take: limit,
        skip,
      }),
      prisma.registration.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      participants,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des participants:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des participants" },
      { status: 500 }
    );
  }
}

// Wrapping GET avec cache (3 minutes pour les participants)
export const GET = withCache(
  getParticipantsHandler,
  {
    ttl: 180, // 3 minutes
    key: (req: NextRequest) => {
      const url = req.nextUrl;
      const eventId = url.pathname.split('/')[3];
      const query = url.searchParams.get('query') || '';
      const type = url.searchParams.get('type') || '';
      const page = url.searchParams.get('page') || '1';
      const limit = url.searchParams.get('limit') || '50';
      return `api:participants:${eventId}:q-${query}:type-${type}:page-${page}:limit-${limit}`;
    },
    shouldCache: (req: NextRequest, res: NextResponse) => {
      return res.status === 200;
    }
  }
); 