import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/events/[id]/sponsors/[sponsorId]/stats - Récupérer les statistiques d'un sponsor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sponsorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 401 }
      );
    }
    
    const { id, sponsorId } = await params;
    
    // Vérifier que le sponsor existe
    const sponsor = await prisma.sponsor.findFirst({
      where: {
        id: sponsorId,
        eventId: id
      },
      select: { id: true, name: true }
    });
    
    if (!sponsor) {
      return NextResponse.json(
        { message: "Sponsor non trouvé" },
        { status: 404 }
      );
    }
    
    // Calculer les statistiques en parallèle pour optimiser les performances
    const [membersCount, documentsCount, appointmentsCount] = await Promise.all([
      // Nombre de membres/participants associés au sponsor
      // (Participants de la même entreprise que le sponsor)
      prisma.registration.count({
        where: {
          eventId: id,
          company: sponsor.name
        }
      }),
      
      // Nombre de documents (stockés dans le champ JSON)
      (async () => {
        const sponsorWithDocs = await prisma.sponsor.findUnique({
          where: { id: sponsorId },
          select: { documents: true }
        });
        
        if (sponsorWithDocs && sponsorWithDocs.documents) {
          const docs = sponsorWithDocs.documents as { name: string }[] | null;
          return docs ? docs.length : 0;
        }
        return 0;
      })(),
      
      // Nombre de rendez-vous impliquant des participants de ce sponsor
      prisma.appointment.count({
        where: {
          eventId: id,
          OR: [
            {
              requester: {
                company: sponsor.name
              }
            },
            {
              recipient: {
                company: sponsor.name
              }
            }
          ]
        }
      })
    ]);

    // Nombre de produits (à implémenter plus tard)
    const productsCount = 0; // TODO: Ajouter table products

    const stats = {
      members: membersCount,
      sessions: 0, // Sera calculé après ajout du modèle SponsorSession
      documents: documentsCount,
      appointments: appointmentsCount,
      products: productsCount
    };
    
    return NextResponse.json({ stats });
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des stats du sponsor:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}

