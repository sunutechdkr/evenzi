import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createDefaultTemplates } from "@/lib/defaultTemplates";
import { withCache } from '@/lib/apiCache';

// GET /api/events - Récupérer la liste des événements
async function getEventsHandler(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const onlyArchived = searchParams.get('onlyArchived') === 'true';
    
    // Construire la condition de filtrage pour l'archivage
    const archivedCondition: { archived?: boolean } = onlyArchived
      ? { archived: true }
      : includeArchived
      ? {}
      : { archived: false };
    
    // Construire la condition de filtrage selon le rôle de l'utilisateur
    const whereCondition: { archived?: boolean; userId?: string } = { ...archivedCondition };
    
    // Si l'utilisateur est ORGANIZER, il ne voit que ses événements
    // Si c'est ADMIN, il voit tous les événements
    // Si c'est USER/STAFF, il ne voit aucun événement
    if (session.user.role === 'ORGANIZER') {
      whereCondition.userId = session.user.id;
    } else if (session.user.role === 'USER' || session.user.role === 'STAFF') {
      // Les USER et STAFF ne peuvent pas gérer d'événements
      return NextResponse.json([]);
    }
    // Les ADMIN voient tous les événements (pas de filtre supplémentaire)
    
    // Utiliser Prisma ORM au lieu de raw SQL pour une meilleure gestion des types
    const events = await prisma.event.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        slug: true,
        banner: true,
        logo: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        sector: true,
        type: true,
        format: true,
        timezone: true,
        videoUrl: true,
        supportEmail: true,
        archived: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });
    
    // Formater les données pour inclure le nombre d'inscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedEvents = events.map((event: any) => ({
      ...event,
      start_date: event.startDate, // Pour compatibilité legacy
      end_date: event.endDate,     // Pour compatibilité legacy
      registrations: event._count.registrations,
      checkedInCount: 0, // TODO: Calculer le nombre de check-ins
      checkInRate: 0     // TODO: Calculer le taux de check-in
    }));
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}

// Wrapping GET avec cache (5 minutes pour les événements)
export const GET = withCache(
  getEventsHandler,
  {
    ttl: 300, // 5 minutes
    key: (req: NextRequest) => {
      // Clé de cache personnalisée incluant les paramètres
      const url = req.nextUrl;
      const includeArchived = url.searchParams.get('includeArchived') || 'false';
      const onlyArchived = url.searchParams.get('onlyArchived') || 'false';
      // Note: userId sera géré automatiquement par l'authentification
      return `api:events:archived-${includeArchived}:only-${onlyArchived}`;
    },
    shouldCache: (req: NextRequest, res: NextResponse) => {
      // Ne cacher que les réponses réussies
      return res.status === 200;
    }
  }
);

// POST /api/events - Créer un nouvel événement
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }
    
    // Récupérer les données de la requête
    const eventData = await request.json();
    
    // Valider les données requises
    if (!eventData.name || !eventData.location || !eventData.startDate || !eventData.endDate) {
      return NextResponse.json(
        { error: "Données incomplètes: nom, lieu, dates de début et de fin sont requis" },
        { status: 400 }
      );
    }
    
    // Générer un slug unique basé sur le nom de l'événement
    let slug = eventData.slug || eventData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Vérifier si le slug existe déjà et le rendre unique si nécessaire
    const existingEvent = await prisma.event.findFirst({
      where: { slug }
    });
    
    if (existingEvent) {
      const timestamp = Date.now().toString().slice(-6);
      slug = `${slug}-${timestamp}`;
    }
    
    // Créer l'événement avec Prisma
    const newEvent = await prisma.event.create({
      data: {
        name: eventData.name,
        description: eventData.description || null,
        location: eventData.location,
        slug: slug,
        banner: eventData.banner || null,
        logo: eventData.logo || null,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
        startTime: eventData.startTime || null,
        endTime: eventData.endTime || null,
        sector: eventData.sector || null,
        type: eventData.type || null,
        format: eventData.format || null,
        timezone: eventData.timezone || null,
        videoUrl: eventData.videoUrl || null,
        supportEmail: eventData.supportEmail || null,
        userId: session.user.id
      }
    });
    
    console.log('✅ Événement créé avec succès:', newEvent.id);
    // Créer le billet par défaut
    try {
      const defaultTicket = await prisma.ticket.create({
        data: {
          name: `Billet ${newEvent.name}`,
          description: `Billet d'accès gratuit pour ${newEvent.name}`,
          price: 0,
          currency: 'XOF',
          quantity: null, // Illimité
          status: 'ACTIVE',
          visibility: 'VISIBLE',
          validFrom: newEvent.startDate,
          validUntil: newEvent.endDate,
          group: 'Attendees',
          eventId: newEvent.id
        }
      });
      console.log('✅ Billet par défaut créé pour l\'événement:', newEvent.id, defaultTicket.id);
    } catch (ticketError) {
      console.error('⚠️ Erreur lors de la création du billet par défaut:', ticketError);
      // On ne fait pas échouer la création de l'événement si le billet échoue
    }
    
    
    // Créer les templates par défaut
    try {
      await createDefaultTemplates(newEvent.id);
      console.log('✅ Templates par défaut créés pour l\'événement:', newEvent.id);
    } catch (templateError) {
      console.error('⚠️ Erreur lors de la création des templates par défaut:', templateError);
      // On ne fait pas échouer la création de l'événement si les templates échouent
    }
    
    return NextResponse.json({
      id: newEvent.id,
      name: newEvent.name,
      description: newEvent.description,
      location: newEvent.location,
      slug: newEvent.slug,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      sector: newEvent.sector,
      type: newEvent.type,
      format: newEvent.format,
      timezone: newEvent.timezone,
      videoUrl: newEvent.videoUrl,
      supportEmail: newEvent.supportEmail,
      archived: newEvent.archived,
      archivedAt: newEvent.archivedAt,
      createdAt: newEvent.createdAt,
      updatedAt: newEvent.updatedAt,
      userId: newEvent.userId,
      registrations: 0,
      checkedInCount: 0,
      checkInRate: 0
    }, { status: 201 });
    
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'événement:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de l'événement" },
      { status: 500 }
    );
  }
} 