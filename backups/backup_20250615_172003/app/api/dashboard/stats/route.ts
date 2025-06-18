import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { format, isPast, isToday } from 'date-fns';
import prisma from "@/lib/prisma";

// Type pour l'activité récente
interface ActivityItem {
  id: string;
  name: string;
  date: string;
  participants: number;
}

export async function GET() {
  try {
    // Récupérer la session de l'utilisateur connecté
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    
    // Récupérer tous les événements avec leurs inscriptions en utilisant SQL direct
    const events = await prisma.$queryRaw`
      SELECT e.*, 
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registration_count,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.checked_in = true) as checked_in_count
      FROM events e
      ORDER BY e.created_at DESC
    `;

    // Convertir les résultats en tableau typé
    const eventsArray = Array.isArray(events) ? events : [events];
    
    // Filtrer les événements de l'utilisateur actuel si non admin
    const userEvents = isAdmin 
      ? eventsArray 
      : eventsArray.filter(event => event.user_id === userId);
    
    // Calculer les statistiques
    const now = new Date();
    const upcomingEvents = eventsArray.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate > now;
    });
    
    const pastEvents = eventsArray.filter(event => {
      const eventEndDate = new Date(event.end_date);
      return isPast(eventEndDate) && !isToday(eventEndDate);
    });
    
    const ongoingEvents = eventsArray.filter(event => {
      const eventStartDate = new Date(event.start_date);
      const eventEndDate = new Date(event.end_date);
      return (isToday(eventStartDate) || (eventStartDate <= now && eventEndDate >= now));
    });
    
    // Compter les inscriptions
    const totalRegistrations = eventsArray.reduce((acc, event) => acc + Number(event.registration_count || 0), 0);
    const userRegistrations = userEvents.reduce((acc, event) => acc + Number(event.registration_count || 0), 0);

    // Calculer le taux de check-in
    const checkedInRegistrations = eventsArray.reduce((acc, event) => 
      acc + Number(event.checked_in_count || 0), 0);
    const checkInRate = totalRegistrations > 0 
      ? Math.round((checkedInRegistrations / totalRegistrations) * 100) 
      : 0;

    // Sélectionner les événements récents pour l'activité
    const recentActivity: ActivityItem[] = userEvents
      .slice(0, 5)
      .map(event => ({
        id: event.id,
        name: event.name,
        date: format(new Date(event.start_date), 'dd MMM yyyy'),
        participants: Number(event.registration_count || 0)
      }));
      
    // Simuler des statistiques de revenus (dans une vraie app, cela viendrait d'un autre modèle)
    const totalRevenue = isAdmin ? Math.floor(totalRegistrations * 25) : Math.floor(userRegistrations * 25);
    
    // Construire la réponse selon le rôle
    const stats = {
      totalEvents: eventsArray.length,
      userEvents: userEvents.length,
      upcomingEvents: upcomingEvents.length,
      ongoingEvents: ongoingEvents.length,
      pastEvents: pastEvents.length,
      totalParticipants: totalRegistrations,
      userParticipants: userRegistrations,
      checkInRate,
      totalRevenue,
      recentActivity,
      // Ajouter des informations sur les mois pour les comparaisons
      currentMonth: new Date().toLocaleString('default', { month: 'long' }),
      previousMonth: new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long' })
    };
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
} 