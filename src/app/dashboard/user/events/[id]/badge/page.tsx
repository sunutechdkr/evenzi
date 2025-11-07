"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ParticipantBadge from "@/components/events/ParticipantBadge";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";

import { 
  ChevronLeftIcon,
  IdentificationIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  QrCodeIcon,
  PrinterIcon,
  DocumentArrowDownIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "react-hot-toast";

// Types pour les données du badge
type BadgeData = {
  id: string;
  status: string;
  qrCodeData: string;
  participant: {
    name: string;
    email: string;
    company?: string;
    jobTitle?: string;
    type: string;
  };
  event: {
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  template: {
    id: string;
    name: string;
    description: string;
  };
  generatedAt: string;
  printedAt?: string;
  createdAt: string;
};

type EventRegistration = {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
  type: string;
  shortCode?: string;
  qrCode?: string;
};

export default function UserBadgePage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [eventData, setEventData] = useState<{
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    banner?: string;
  } | null>(null);
  const [registrationData, setRegistrationData] = useState<EventRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les données du badge de l'utilisateur
  const fetchBadgeData = async () => {
    if (!session?.user?.email || !id) return;

    try {
      setLoading(true);
      
      // Récupérer les données du badge
      const badgeResponse = await fetch(`/api/participant-badges?email=${session.user.email}&eventId=${id}`);
      
      if (badgeResponse.ok) {
        const badgeResult = await badgeResponse.json();
        if (badgeResult.success && badgeResult.badges.length > 0) {
          setBadgeData(badgeResult.badges[0]);
        }
      }

      // Récupérer les données de l'événement
      const eventResponse = await fetch(`/api/events/${id}`);
      if (eventResponse.ok) {
        const eventResult = await eventResponse.json();
        setEventData(eventResult);
      }

      // Récupérer les données d'inscription pour le badge
      const registrationResponse = await fetch(`/api/events/${id}/registrations?userEmail=${session.user.email}`);
      if (registrationResponse.ok) {
        const registrationResult = await registrationResponse.json();
        if (registrationResult.registration) {
          setRegistrationData(registrationResult.registration);
        }
      }

      setError(null);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de charger les données du badge");
      toast.error("Erreur lors du chargement du badge");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchBadgeData();
    }

    // Vérifier si l'écran est mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [id, session, status]);

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="dashboard-container min-h-screen overflow-hidden">
        <UserEventSidebar 
          eventId={id as string}
          activeTab="badge"
          onExpandChange={(expanded) => setSidebarExpanded(expanded)}
        />
        
        <div 
          className={`dashboard-content bg-gray-50 ${!sidebarExpanded ? 'dashboard-content-collapsed' : ''}`}
          style={{ 
            marginLeft: isMobile ? 0 : sidebarExpanded ? '16rem' : '4rem',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <main className="dashboard-main flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#81B441] mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement de votre badge...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container min-h-screen overflow-hidden">
      <UserEventSidebar 
        eventId={id as string}
        activeTab="badge"
        onExpandChange={(expanded) => setSidebarExpanded(expanded)}
      />
      
      <div 
        className={`dashboard-content bg-gray-50 ${!sidebarExpanded ? 'dashboard-content-collapsed' : ''}`}
        style={{ 
          marginLeft: isMobile ? 0 : sidebarExpanded ? '16rem' : '4rem',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <main className="dashboard-main flex-1">
          {/* En-tête */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/dashboard/user/events/${id}`}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-2" />
                  <span>Retour à l&apos;événement</span>
                </Link>
                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                  <IdentificationIcon className="w-6 h-6 mr-2 text-[#81B441]" />
                  Mon Badge
                </h1>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="p-6">
            {error ? (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="text-center text-red-500">
                    <InformationCircleIcon className="w-12 h-12 mx-auto mb-4" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : registrationData && eventData ? (
              <>
                {/* Informations sur l'utilisation du badge */}
                <Card className="mb-6 border-l-4 border-[#81B441]">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <InformationCircleIcon className="w-5 h-5 mr-2 text-[#81B441]" />
                      À propos de votre badge
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Utilisation pendant l&apos;événement</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start">
                            <QrCodeIcon className="w-4 h-4 mr-2 mt-0.5 text-[#81B441] flex-shrink-0" />
                            <span>Présentez ce badge à l&apos;entrée pour un accès rapide</span>
                          </li>
                          <li className="flex items-start">
                            <IdentificationIcon className="w-4 h-4 mr-2 mt-0.5 text-[#81B441] flex-shrink-0" />
                            <span>Facilite votre identification auprès des organisateurs</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircleIcon className="w-4 h-4 mr-2 mt-0.5 text-[#81B441] flex-shrink-0" />
                            <span>Permet l&apos;enregistrement automatique aux sessions</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Conseils pratiques</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start">
                            <PrinterIcon className="w-4 h-4 mr-2 mt-0.5 text-[#81B441] flex-shrink-0" />
                            <span>Imprimez votre badge ou gardez-le sur votre téléphone</span>
                          </li>
                          <li className="flex items-start">
                            <DocumentArrowDownIcon className="w-4 h-4 mr-2 mt-0.5 text-[#81B441] flex-shrink-0" />
                            <span>Téléchargez-le en format image pour usage hors ligne</span>
                          </li>
                          <li className="flex items-start">
                            <ClockIcon className="w-4 h-4 mr-2 mt-0.5 text-[#81B441] flex-shrink-0" />
                            <span>Arrivez un peu plus tôt pour éviter les files d&apos;attente</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations sur le badge */}
                {badgeData && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Statut du badge</CardTitle>
                      <CardDescription>
                        Informations sur votre badge pour cet événement
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircleIcon className="w-8 h-8 text-green-500" />
                          <div>
                            <p className="font-medium text-green-800">Badge généré</p>
                            <p className="text-sm text-green-600">
                              {formatDate(badgeData.generatedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <IdentificationIcon className="w-8 h-8 text-blue-500" />
                          <div>
                            <p className="font-medium text-blue-800">Type de participant</p>
                            <p className="text-sm text-blue-600">
                              {registrationData.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <QrCodeIcon className="w-8 h-8 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-800">Code unique</p>
                            <p className="text-sm text-gray-600 font-mono">
                              {registrationData.shortCode || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Badge principal */}
                <Card>
                  <CardHeader>
                    <CardTitle>Votre badge d&apos;événement</CardTitle>
                    <CardDescription>
                      Badge officiel pour {eventData.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ParticipantBadge
                      firstName={registrationData.firstName}
                      lastName={registrationData.lastName}
                      jobTitle={registrationData.jobTitle}
                      company={registrationData.company}
                      qrCode={registrationData.qrCode}
                      eventName={eventData.name}
                      eventBanner={eventData.banner}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <IdentificationIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Badge non disponible</h3>
                    <p className="text-gray-600 mb-4">
                      Votre badge n&apos;a pas encore été généré pour cet événement.
                    </p>
                    <p className="text-sm text-gray-500">
                      Veuillez contacter l&apos;organisateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 