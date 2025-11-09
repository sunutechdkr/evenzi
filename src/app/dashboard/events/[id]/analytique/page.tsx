"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  AdjustmentsHorizontalIcon, 
  ArrowDownTrayIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  ClockIcon,
  TicketIcon
} from "@heroicons/react/24/outline";
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
  ArcElement,
  Filler
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  ArcElement,
  Filler
);

// Types pour les données analytiques
type EventData = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
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
          } else if (status === 401) {
            throw new Error("Non autorisé");
          } else {
            throw new Error("Erreur lors de la récupération des données analytiques");
          }
        }
        
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (fetchError) {
        console.error("Erreur:", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Impossible de charger les données analytiques.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [eventId, dateRange]);

  // Configuration du graphique des inscriptions par jour (moderne)
  const registrationsChartData = {
    labels: data?.dailyRegistrations ? data.dailyRegistrations.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    }) : [],
    datasets: [
      {
        label: "Inscriptions",
        data: data?.dailyRegistrations ? data.dailyRegistrations.map(day => day.count) : [],
        borderColor: "#81B441",
        backgroundColor: "rgba(129, 180, 65, 0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: "#81B441",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "#72a139",
      }
    ]
  };

  // Configuration du graphique des types de participants
  const participantTypesChartData = {
    labels: data?.participantTypes ? data.participantTypes.map(type => type.type || 'N/A') : [],
    datasets: [
      {
        data: data?.participantTypes ? data.participantTypes.map(type => type.count) : [],
        backgroundColor: [
          "#81B441",
          "#6a9636",
          "#95c562",
          "#abd67e",
          "#c2e69b",
          "#d4f0b0"
        ],
        borderWidth: 2,
        borderColor: "#fff"
      }
    ]
  };

  // Graphique en barres pour les sessions populaires
  const sessionsChartData = {
    labels: data?.topSessions ? data.topSessions.map(session => session.title.length > 30 ? session.title.substring(0, 30) + '...' : session.title) : [],
    datasets: [
      {
        label: "Participants",
        data: data?.topSessions ? data.topSessions.map(session => session.participantCount) : [],
        backgroundColor: "rgba(129, 180, 65, 0.8)",
        borderColor: "#81B441",
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    indexAxis: 'y' as const,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false
      }
    }
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    if (!data) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Événement,Total Inscriptions,Check-ins,Taux de présence,Période\n";
    
    const checkInRate = (data.registrations.checkedIn / Math.max(1, data.registrations.total) * 100).toFixed(1);
    csvContent += `${data.event.name},${data.registrations.total},${data.registrations.checkedIn},${checkInRate}%,${
      dateRange === '7j' ? 'Derniers 7 jours' : 
      dateRange === '30j' ? 'Derniers 30 jours' : 
      'Depuis le début'
    }\n`;
    
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
    ((data.registrations.checkedIn / Math.max(1, data.registrations.total)) * 100).toFixed(1) + '%' : 
    '0%';

  // Formater les dates de l'événement
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Date invalide';
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header moderne */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Link 
                href={`/dashboard/events/${eventId}`} 
                className="inline-flex items-center text-gray-600 hover:text-[#81B441] transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Retour
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <ChartBarIcon className="h-8 w-8 text-[#81B441]" />
                  Analytics & Statistiques
                </h1>
                {data?.event && (
                  <p className="text-gray-600 mt-1">{data.event.name}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  Période
                </Button>
                
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-10 border border-gray-200">
                    <div className="p-3">
                      <h3 className="text-sm font-semibold mb-3 text-gray-700">Sélectionner la période</h3>
                      <div className="space-y-1">
                        {(['7j', '30j', 'all'] as DateRange[]).map((period) => (
                          <button
                            key={period}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                              dateRange === period
                                ? 'bg-[#81B441] text-white font-medium'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                            onClick={() => {
                              setDateRange(period);
                              setShowFilters(false);
                            }}
                          >
                            {period === '7j' ? '7 derniers jours' : 
                             period === '30j' ? '30 derniers jours' : 
                             'Depuis le début'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={!data}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Informations de l'événement */}
          {data?.event && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-[#81B441]" />
                  <span className="font-medium">Début:</span>
                  <span>{formatDate(data.event.startDate)}</span>
                </div>
                {data.event.endDate && (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-[#81B441]" />
                    <span className="font-medium">Fin:</span>
                    <span>{formatDate(data.event.endDate)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-[#81B441]" />
                  <span className="font-medium">Période analysée:</span>
                  <span className="text-[#81B441] font-semibold">
                    {dateRange === '7j' ? '7 derniers jours' : 
                     dateRange === '30j' ? '30 derniers jours' : 
                     'Depuis le début'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#81B441] border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Chargement des données analytiques...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-amber-800 mb-2">Erreur</p>
                <p className="text-amber-700 mb-4">{error}</p>
                <Button
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    const fetchData = async () => {
                      try {
                        const response = await fetch(`/api/events/${eventId}/analytics?period=${dateRange}`);
                        if (!response.ok) throw new Error("Impossible de charger les données");
                        const data = await response.json();
                        setData(data);
                        setError(null);
                      } catch {
                        setError("Impossible de charger les données analytiques.");
                      } finally {
                        setLoading(false);
                      }
                    };
                    fetchData();
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : data ? (
          <div className="space-y-6">
            {/* Cartes de statistiques principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-[#81B441] shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Inscrits</p>
                      <p className="text-3xl font-bold text-gray-900">{data.registrations.total}</p>
                      <p className="text-xs text-gray-500 mt-2">Participants enregistrés</p>
                    </div>
                    <div className="p-3 bg-[#81B441]/10 rounded-full">
                      <UserGroupIcon className="h-8 w-8 text-[#81B441]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Check-ins</p>
                      <p className="text-3xl font-bold text-gray-900">{data.registrations.checkedIn}</p>
                      <p className="text-xs text-gray-500 mt-2">Participants présents</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-full">
                      <CheckCircleIcon className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Taux de présence</p>
                      <p className="text-3xl font-bold text-gray-900">{checkInRate}</p>
                      <p className="text-xs text-gray-500 mt-2">Taux de participation</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-full">
                      <PresentationChartLineIcon className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Sessions</p>
                      <p className="text-3xl font-bold text-gray-900">{data.topSessions.length}</p>
                      <p className="text-xs text-gray-500 mt-2">Sessions actives</p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-full">
                      <TicketIcon className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-[#81B441]" />
                    Inscriptions par jour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Line data={registrationsChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PresentationChartLineIcon className="h-5 w-5 text-[#81B441]" />
                    Répartition des participants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Doughnut data={participantTypesChartData} options={doughnutOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sessions populaires avec graphique */}
            {data.topSessions.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TicketIcon className="h-5 w-5 text-[#81B441]" />
                    Sessions les plus populaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 mb-6">
                    <Bar data={sessionsChartData} options={barChartOptions} />
                  </div>
                  <div className="space-y-3">
                    {data.topSessions.map((session, index) => {
                      const percentage = data.registrations.total > 0 
                        ? Math.round((session.participantCount / data.registrations.total) * 100) 
                        : 0;
                      return (
                        <div key={session.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-[#81B441] text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{session.title}</p>
                            <p className="text-sm text-gray-500">{session.participantCount} participants</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-[#81B441] h-3 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-700 w-12 text-right">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Types de participants détaillés */}
            {data.participantTypes.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-[#81B441]" />
                    Répartition détaillée par type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.participantTypes.map((type, index) => {
                      const percentage = data.registrations.total > 0 
                        ? Math.round((type.count / data.registrations.total) * 100) 
                        : 0;
                      const colors = ['#81B441', '#6a9636', '#95c562', '#abd67e', '#c2e69b', '#d4f0b0'];
                      return (
                        <div key={type.type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{type.type || 'N/A'}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-700">{type.count}</span>
                              <span className="text-sm text-gray-500 w-16 text-right">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div 
                              className="h-4 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: colors[index % colors.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section Statistiques des Billets */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TicketIcon className="h-5 w-5 text-[#81B441]" />
                  Statistiques des Billets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TicketAnalytics eventId={eventId} />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
