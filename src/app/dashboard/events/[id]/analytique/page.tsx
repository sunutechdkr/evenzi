"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CalendarIcon, AdjustmentsHorizontalIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import TicketAnalytics from "@/components/analytics/TicketAnalytics";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

// Enregistrer les composants ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Types pour les données analytiques
type EventData = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type RegistrationStats = {
  total: number;
  checkedIn: number;
};

type ParticipantType = {
  type: string;
  count: number;
};

type SessionStat = {
  id: string;
  title: string;
  participantCount: number;
};

type DailyRegistration = {
  date: string;
  count: number;
};

type EventAnalytics = {
  event: EventData;
  registrations: RegistrationStats;
  participantTypes: ParticipantType[];
  topSessions: SessionStat[];
  dailyRegistrations: DailyRegistration[];
  period: string;
};

// Types pour les filtres de période
type DateRange = '7j' | '30j' | 'all';

export default function EventAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EventAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('7j');
  const [showFilters, setShowFilters] = useState(false);
  const [eventId, setEventId] = useState<string>("");
  
  // Extraire l'ID de params au chargement
  useEffect(() => {
    const extractParams = async () => {
      const { id } = await params;
      setEventId(id);
    };
    extractParams();
  }, [params]);
  
  useEffect(() => {
    if (!eventId) return;
    
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/events/${eventId}/analytics?period=${dateRange}`);
        
        if (!response.ok) {
          const status = response.status;
          if (status === 404) {
            throw new Error("Événement introuvable");
          } else {
            throw new Error("Erreur lors de la récupération des données analytiques");
          }
        }
        
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (fetchError) {
        console.error("Erreur:", fetchError);
        setError("Impossible de charger les données analytiques.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [eventId, dateRange]);

  // Configuration du graphique des inscriptions par jour
  const registrationsChartData = {
    labels: data?.dailyRegistrations ? data.dailyRegistrations.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    }) : [],
    datasets: [
      {
        label: "Inscriptions",
        data: data?.dailyRegistrations ? data.dailyRegistrations.map(day => day.count) : [],
        borderColor: "#81B441",
        backgroundColor: "rgba(129, 180, 65, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#81B441"
      }
    ]
  };

  // Configuration du graphique des types de participants (en utilisant les vraies données)
  const participantTypesChartData = {
    labels: data?.participantTypes ? data.participantTypes.map(type => type.type) : [],
    datasets: [
      {
        data: data?.participantTypes ? data.participantTypes.map(type => type.count) : [],
        backgroundColor: [
          "#81B441",  // Vert principal
          "#6a9636",  // Vert plus foncé
          "#95c562",  // Vert plus clair
          "#abd67e",  // Encore plus clair
          "#c2e69b"   // Très clair
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const
      }
    }
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    if (!data) return;
    
    // Créer les en-têtes
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Événement,Total Inscriptions,Check-ins,Taux de présence,Période\n";
    
    // Ajouter les données
    const checkInRate = (data.registrations.checkedIn / Math.max(1, data.registrations.total) * 100).toFixed(1);
    csvContent += `${data.event.name},${data.registrations.total},${data.registrations.checkedIn},${checkInRate}%,${
      dateRange === '7j' ? 'Derniers 7 jours' : 
      dateRange === '30j' ? 'Derniers 30 jours' : 
      'Depuis le début'
    }\n`;
    
    // Créer un lien de téléchargement
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics-event-${eventId}-${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculer le taux de présence
  const checkInRate = data ? 
    ((data.registrations.checkedIn / Math.max(1, data.registrations.total)) * 100).toFixed(0) + '%' : 
    '0%';

  if (!eventId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#81B441] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <EventSidebar eventId={eventId} />
      <div className="dashboard-content">
        <main className="dashboard-main">
          {/* En-tête avec bouton de retour et options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center">
              <Link href={`/dashboard/events/${eventId}`} className="text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold">Analytique de l&apos;événement</h1>
            </div>
            
            <div className="flex ml-auto gap-2">
              <div className="relative">
                <button 
                  className="btn-secondary flex items-center gap-1"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  Filtres
                </button>
                
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="p-2">
                      <h3 className="text-sm font-semibold mb-2 text-gray-700">Période</h3>
                      <div className="space-y-1">
                        <button 
                          className={`w-full text-left px-3 py-2 text-sm rounded-md ${dateRange === '7j' ? 'bg-[#81B441]/10 text-[#81B441] font-medium' : 'hover:bg-gray-100'}`}
                          onClick={() => {
                            setDateRange('7j');
                            setShowFilters(false);
                          }}
                        >
                          7 derniers jours
                        </button>
                        <button 
                          className={`w-full text-left px-3 py-2 text-sm rounded-md ${dateRange === '30j' ? 'bg-[#81B441]/10 text-[#81B441] font-medium' : 'hover:bg-gray-100'}`}
                          onClick={() => {
                            setDateRange('30j');
                            setShowFilters(false);
                          }}
                        >
                          30 derniers jours
                        </button>
                        <button 
                          className={`w-full text-left px-3 py-2 text-sm rounded-md ${dateRange === 'all' ? 'bg-[#81B441]/10 text-[#81B441] font-medium' : 'hover:bg-gray-100'}`}
                          onClick={() => {
                            setDateRange('all');
                            setShowFilters(false);
                          }}
                        >
                          Depuis le début
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                className="btn-secondary flex items-center gap-1"
                onClick={exportToCSV}
                disabled={!data}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exporter
              </button>
            </div>
          </div>

          {/* Indicateur de filtre actif */}
          <div className="mb-6 flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>
              Période : {
                dateRange === '7j' ? 'Derniers 7 jours' : 
                dateRange === '30j' ? 'Derniers 30 jours' : 
                'Depuis le début'
              }
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#81B441] border-r-transparent"></div>
              <p className="ml-4 text-gray-600">Chargement des données...</p>
            </div>
          ) : error ? (
            <div>
              <div className="bg-amber-50 p-6 rounded-md text-amber-700 mb-6">
                <p className="text-lg font-medium mb-2">Erreur</p>
                <p className="mb-4">{error}</p>
                <button 
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    // Retenter la requête
                    const fetchData = async () => {
                      try {
                        const response = await fetch(`/api/events/${eventId}/analytics?period=${dateRange}`);
                        if (!response.ok) throw new Error("Impossible de charger les données");
                        const data = await response.json();
                        setData(data);
                        setError(null);
                      } catch (retryError) {
                        console.error("Retry error:", retryError);
                        setError("Impossible de charger les données analytiques.");
                      } finally {
                        setLoading(false);
                      }
                    };
                    fetchData();
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Quatre blocs de statistiques en haut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-sm text-gray-500 mb-1">Total Inscrits</h3>
                  <p className="text-3xl font-bold text-[#81B441]">{data?.registrations.total || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Participants enregistrés</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-sm text-gray-500 mb-1">Total Check-ins</h3>
                  <p className="text-3xl font-bold text-blue-600">{data?.registrations.checkedIn || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Participants présents</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-sm text-gray-500 mb-1">Taux de présence</h3>
                  <p className="text-3xl font-bold text-purple-600">{checkInRate}</p>
                  <p className="text-xs text-gray-500 mt-1">Participants checkés / inscrits</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-sm text-gray-500 mb-1">Sessions</h3>
                  <p className="text-3xl font-bold text-orange-500">{data?.topSessions.length || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Nombre de sessions</p>
                </div>
              </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-medium mb-4">Inscriptions par jour</h2>
                  <Line data={registrationsChartData} options={chartOptions} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-medium mb-4">Répartition des participants</h2>
                  <Doughnut data={participantTypesChartData} options={doughnutOptions} />
                </div>
              </div>

              {/* Sessions populaires */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-medium mb-4">Sessions les plus populaires</h2>
                {data?.topSessions && data.topSessions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taux</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.topSessions.map((session) => (
                          <tr key={session.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{session.title}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">{session.participantCount}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                              <div className="flex items-center justify-end">
                                <span className="text-sm text-gray-700 mr-2">
                                  {data.registrations.total > 0 
                                    ? Math.round((session.participantCount / data.registrations.total) * 100) 
                                    : 0}%
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-[#81B441] h-2 rounded-full" 
                                    style={{ 
                                      width: `${data.registrations.total > 0 
                                        ? Math.round((session.participantCount / data.registrations.total) * 100) 
                                        : 0}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500">Aucune session trouvée</p>
                )}
              </div>

              {/* Types de participants */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-medium mb-4">Répartition détaillée par type</h2>
                {data?.participantTypes && data.participantTypes.length > 0 ? (
                  <div className="space-y-4">
                    {data.participantTypes.map((type, index) => (
                      <div key={type.type} className="flex items-center">
                        <div className="w-32 font-medium text-gray-700">{type.type}</div>
                        <div className="flex-1 mx-2">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="h-4 rounded-full" 
                              style={{ 
                                width: `${data.registrations.total > 0 
                                  ? Math.round((type.count / data.registrations.total) * 100) 
                                  : 0}%`,
                                backgroundColor: [`#81B441`, `#6a9636`, `#95c562`, `#abd67e`, `#c2e69b`][index % 5]
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-20 text-right">
                          <span className="text-sm font-medium text-gray-700">{type.count}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({data.registrations.total > 0 
                              ? Math.round((type.count / data.registrations.total) * 100) 
                              : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500">Aucune donnée disponible</p>
                )}
              </div>

              {/* Section Statistiques des Billets */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Statistiques des Billets</h2>
                <TicketAnalytics eventId={eventId} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 