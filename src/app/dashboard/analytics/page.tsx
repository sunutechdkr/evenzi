"use client";

import { useState, useEffect } from "react";
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
import { Line, Bar, Doughnut } from "react-chartjs-2";

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
type MonthlyData = {
  month: string;
  count: number;
};

type EventData = {
  name: string;
  count: number;
};

type AnalyticsData = {
  registrationsByMonth: MonthlyData[];
  checkInsByMonth: MonthlyData[];
  topEventsData: EventData[];
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/dashboard/analytics");
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des données analytiques");
        }
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (error) {
        console.error("Erreur:", error);
        setError("Impossible de charger les données analytiques.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Configuration du graphique des inscriptions
  const registrationsChartData = {
    labels: data?.registrationsByMonth.map(item => item.month) || [],
    datasets: [
      {
        label: "Inscriptions",
        data: data?.registrationsByMonth.map(item => item.count) || [],
        borderColor: "#81B441",
        backgroundColor: "rgba(129, 180, 65, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#81B441"
      }
    ]
  };

  // Configuration du graphique des check-ins
  const checkInsChartData = {
    labels: data?.checkInsByMonth.map(item => item.month) || [],
    datasets: [
      {
        label: "Check-ins",
        data: data?.checkInsByMonth.map(item => item.count) || [],
        backgroundColor: "#6a9636",
        borderRadius: 6
      }
    ]
  };

  // Configuration du graphique des meilleurs événements
  const topEventsChartData = {
    labels: data?.topEventsData.map(item => item.name) || [],
    datasets: [
      {
        data: data?.topEventsData.map(item => item.count) || [],
        backgroundColor: [
          "#81B441",
          "#6a9636",
          "#95c562",
          "#abd67e",
          "#c2e59b"
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

  return (
    <div className="w-full h-full">
      <main className="p-6">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Analytique</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#81B441] border-r-transparent"></div>
              <p className="ml-4 text-gray-600">Chargement des données...</p>
            </div>
          ) : error ? (
            <div>
              <div className="bg-amber-50 p-4 rounded-md text-amber-700 mb-6">
                {error}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Graphique des inscriptions */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-medium mb-4">Évolution des inscriptions</h2>
                  <Line data={registrationsChartData} options={chartOptions} />
                </div>

                {/* Graphique des check-ins */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-medium mb-4">Check-ins mensuels</h2>
                  <Bar data={checkInsChartData} options={chartOptions} />
                </div>

                {/* Graphique des meilleurs événements */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-medium mb-4">Top 5 des événements</h2>
                  {data?.topEventsData && data.topEventsData.length > 0 ? (
                    <Doughnut data={topEventsChartData} options={doughnutOptions} />
                  ) : (
                    <p className="text-gray-500 text-center py-12">Aucune donnée disponible</p>
                  )}
                </div>

                {/* Carte de statistiques globales */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-medium mb-4">Statistiques clés</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total inscriptions</p>
                      <p className="text-2xl font-bold text-green-700">
                        {data?.registrationsByMonth.reduce((acc, item) => acc + item.count, 0) || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total check-ins</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {data?.checkInsByMonth.reduce((acc, item) => acc + item.count, 0) || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Taux de présence</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {data ? 
                          Math.round(
                            (data.checkInsByMonth.reduce((acc, item) => acc + item.count, 0) / 
                            Math.max(1, data.registrationsByMonth.reduce((acc, item) => acc + item.count, 0))) * 100
                          ) + '%'
                          : '0%'
                        }
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Tendance</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {data && data.registrationsByMonth.length >= 2 ? 
                          data.registrationsByMonth[data.registrationsByMonth.length - 1].count > 
                          data.registrationsByMonth[data.registrationsByMonth.length - 2].count ? 
                            '↗️ En hausse' : '↘️ En baisse'
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Graphique des inscriptions */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-medium mb-4">Évolution des inscriptions</h2>
                <Line data={registrationsChartData} options={chartOptions} />
              </div>

              {/* Graphique des check-ins */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-medium mb-4">Check-ins mensuels</h2>
                <Bar data={checkInsChartData} options={chartOptions} />
              </div>

              {/* Graphique des meilleurs événements */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-medium mb-4">Top 5 des événements</h2>
                {data?.topEventsData && data.topEventsData.length > 0 ? (
                  <Doughnut data={topEventsChartData} options={doughnutOptions} />
                ) : (
                  <p className="text-gray-500 text-center py-12">Aucune donnée disponible</p>
                )}
              </div>

              {/* Carte de statistiques globales */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-medium mb-4">Statistiques clés</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total inscriptions</p>
                    <p className="text-2xl font-bold text-green-700">
                      {data?.registrationsByMonth.reduce((acc, item) => acc + item.count, 0) || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total check-ins</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {data?.checkInsByMonth.reduce((acc, item) => acc + item.count, 0) || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Taux de présence</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {data ? 
                        Math.round(
                          (data.checkInsByMonth.reduce((acc, item) => acc + item.count, 0) / 
                          Math.max(1, data.registrationsByMonth.reduce((acc, item) => acc + item.count, 0))) * 100
                        ) + '%'
                        : '0%'
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Tendance</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {data && data.registrationsByMonth.length >= 2 ? 
                        data.registrationsByMonth[data.registrationsByMonth.length - 1].count > 
                        data.registrationsByMonth[data.registrationsByMonth.length - 2].count ? 
                          '↗️ En hausse' : '↘️ En baisse'
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
} 