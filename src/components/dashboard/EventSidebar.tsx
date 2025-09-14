"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  IdentificationIcon,
  DocumentTextIcon,
  BellIcon,
  XMarkIcon,
  ChevronLeftIcon,
  PresentationChartLineIcon,
  Bars3Icon,
  ClockIcon,
  EnvelopeIcon,
  TicketIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import Logo from "@/components/ui/Logo";
import { ParticipantNotificationList } from '@/components/notifications/ParticipantNotificationList';
import { useNotifications } from '@/hooks/useNotifications';
import { useSession } from 'next-auth/react';
import { UserProfile } from "@/components/dashboard/UserProfile";

// Define types for menu items
type SubMenuItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type MenuItem = {
  name: string;
  href?: string;
  icon: React.ElementType;
  exact?: boolean;
  collapsible?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  subItems?: SubMenuItem[];
};

/**
 * Composant NotificationCenter - Centre de notifications réutilisable
 */
export function NotificationCenter({ 
  isExpanded = true, 
  onToggle,
  eventId 
}: { 
  isExpanded: boolean, 
  onToggle: (show: boolean) => void,
  eventId?: string 
}) {
  const { data: session } = useSession();
  const { unreadCount } = useNotifications({ eventId });

  if (!session?.user?.id) {
    return null;
  }

  return (
    <>
      {/* Bouton de notification dans le sidebar */}
      <div className="notification-center px-3 mb-2">
        {isExpanded ? (
          <button 
            onClick={() => onToggle(true)}
            className="w-full flex justify-between items-center bg-gray-700 hover:bg-gray-600 p-2 rounded-lg cursor-pointer transition-colors duration-200"
          >
            <div className="flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-[#81B441]" />
              <span className="text-sm text-white">Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-[#81B441] text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={() => onToggle(true)}
              className="relative p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-700 transition-all duration-300"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#81B441] text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-gray-800">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Composant NotificationPanel - Panneau de notifications réutilisable
 */
export function NotificationPanel({ 
  show, 
  onClose,
  eventId 
}: { 
  show: boolean, 
  onClose: () => void,
  eventId?: string 
}) {
  const { data: session } = useSession();
  
  if (!session?.user?.id) {
    return null;
  }
  return (
    <>
      {/* Overlay */}
      {show && (
        <div 
          className="fixed inset-0 bg-black/30 z-30" 
          onClick={onClose}
        ></div>
      )}
      
      {/* Panneau latéral */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-[#212529] shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <ParticipantNotificationList 
              userId={session.user.id} 
              eventId={eventId}
            />
          </div>
          
          <div className="p-4 border-t border-white/10">
            <button className="w-full bg-[#81B441]/20 hover:bg-[#81B441]/30 text-[#81B441] font-medium py-2 rounded transition-colors flex justify-center items-center">
              <span>Voir toutes les notifications</span>
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Composant EventSidebar - Barre latérale spécifique à un événement
 * 
 * Affiche les options de navigation propres à la gestion d'un événement spécifique
 */
export function EventSidebar({ 
  eventId, 
  onExpandChange, 
  activeTab 
}: { 
  eventId: string,
  onExpandChange?: (expanded: boolean) => void,
  activeTab?: string 
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [inscriptionExpanded, setInscriptionExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Notifier le parent du changement d'état de la sidebar
  const toggleExpand = (expanded: boolean) => {
    setIsExpanded(expanded);
    if (onExpandChange) {
      onExpandChange(expanded);
    }
  };
  
  const baseUrl = `/dashboard/events/${eventId}`;

  // Configuration des liens de navigation pour un événement
  const navigation: MenuItem[] = [
    { 
      name: "Retour au dashboard", 
      href: "/dashboard", 
      icon: ChevronLeftIcon,
      exact: false,
    },
    { 
      name: "Aperçu", 
      href: `${baseUrl}`, 
      icon: ChartBarIcon,
      exact: true,
    },
    { 
      name: "Analytique", 
      href: `${baseUrl}/analytique`, 
      icon: PresentationChartLineIcon,
    },
    { 
      name: "Inscription", 
      icon: ClipboardDocumentListIcon,
      collapsible: true,
      expanded: inscriptionExpanded,
      onClick: () => setInscriptionExpanded(!inscriptionExpanded),
      subItems: [
        { name: "Billets", href: `${baseUrl}/billets`, icon: TicketIcon },
        { name: "Badges", href: `${baseUrl}/inscription/badges`, icon: IdentificationIcon },
        { name: "Formulaire", href: `${baseUrl}/formulaire`, icon: DocumentTextIcon },
      ]
    },
    { 
      name: "Participants", 
      href: `${baseUrl}/participants`, 
      icon: UserGroupIcon,
    },
    { 
      name: "Communication", 
      href: `${baseUrl}/communication`, 
      icon: EnvelopeIcon,
    },
    { 
      name: "Rendez-vous", 
      href: `${baseUrl}/rendez-vous`, 
      icon: ClockIcon,
    },
    { 
      name: "Exposants", 
      href: `${baseUrl}/exposants`, 
      icon: BuildingOfficeIcon,
    },
    { 
      name: "Sessions", 
      href: `${baseUrl}/sessions`, 
      icon: CalendarIcon,
    },
    { 
      name: "Game", 
      href: `${baseUrl}/game`, 
      icon: TrophyIcon,
    },
    { 
      name: "Réglages", 
      href: `${baseUrl}/settings`, 
      icon: Cog6ToothIcon,
    },
  ];

  // Use activeTab to determine the active link
  const isActive = (href: string, exact: boolean = false) => {
    if (typeof window === 'undefined') {
      return false;
    }
    const pathname = window.location.pathname || "";
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href) || activeTab === href;
  };

  return (
    <>
      {/* Version mobile: bouton d'ouverture */}
      <button
        className={`md:hidden fixed z-30 bottom-4 right-4 p-3 rounded-full bg-[#81B441] text-white shadow-lg transition-transform duration-200 ${
          isExpanded ? 'rotate-45' : 'rotate-0'
        }`}
        onClick={() => toggleExpand(!isExpanded)}
      >
        {isExpanded ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <ChevronRightIcon className="h-6 w-6" />
        )}
      </button>
      
      {/* Version desktop: bouton d'ouverture quand sidebar est cachée */}
      {!isExpanded && (
        <button
          className="hidden md:flex fixed z-30 top-4 left-4 p-2 rounded-md bg-[#81B441] text-white shadow-lg hover:bg-[#6a9636] transition-all duration-200 items-center justify-center"
          onClick={() => toggleExpand(true)}
          title="Ouvrir le menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      )}
      
      {/* Overlay pour la version mobile */}
      {isExpanded && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => toggleExpand(false)}
        ></div>
      )}
      
      {/* Barre latérale */}
      <aside 
        className={`${
          isExpanded ? 'translate-x-0 w-64' : '-translate-x-full w-0'
        } fixed left-0 top-0 h-screen z-30 bg-gray-800 transition-all duration-300 ease-in-out transform overflow-y-auto overflow-x-hidden border-r border-gray-700`}
        style={{ 
          height: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: isExpanded ? '16rem' : '0',
          minHeight: '100vh',
          maxHeight: '100vh',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="sidebar-content h-full flex flex-col">
          {/* En-tête avec logo */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
            <div className="flex items-center space-x-2">
              {/* Logo */}
              <div className="flex flex-col">
                <Logo width={120} height={30} color="white" />
                <span className="text-gray-400 text-xs">Événement</span>
              </div>
            </div>
            {/* Bouton pour réduire la sidebar (version desktop) */}
            <button
              className="hidden md:block text-gray-400 hover:text-white p-1 rounded-md transition-colors"
              onClick={() => toggleExpand(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronLeftIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Profil utilisateur */}
          <UserProfile isExpanded={isExpanded} />
          
          {/* Centre de notifications */}
          <NotificationCenter 
            isExpanded={isExpanded} 
            onToggle={(show) => setShowNotifications(show)}
            eventId={eventId}
          />
          
          {/* Navigation principale */}
          <nav className="flex-1 px-3 pb-4 mt-2 space-y-2">
          {navigation.map((item) => (
              <div key={item.name}>
                {/* Élément de navigation */}
                {item.href ? (
                  <Link 
                    href={item.href}
                    className={`
                      block py-2 px-3 rounded-md transition-colors duration-200
                      ${isActive(item.href, item.exact) 
                        ? 'bg-[#81B441] text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{item.name}</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  // Élément déroulant
                  <div>
                    <button
                      className={`
                        w-full text-left py-2 px-3 rounded-md transition-colors duration-200
                        ${item.subItems?.some(subItem => isActive(subItem.href))
                          ? 'bg-[#81B441]/20 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                      onClick={item.onClick}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        {item.collapsible && (
                          item.expanded 
                            ? <ChevronDownIcon className="h-4 w-4" />
                            : <ChevronRightIcon className="h-4 w-4" />
                        )}
                      </div>
                  </button>
                  
                    {/* Sous-éléments */}
                    {item.expanded && item.subItems && (
                      <div className="pl-9 space-y-1 mt-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                            className={`
                              block py-2 px-3 rounded-md text-sm transition-colors duration-200
                              ${isActive(subItem.href)
                                ? 'bg-[#81B441]/30 text-white' 
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                              }
                            `}
                          >
                            <div className="flex items-center">
                              <subItem.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                            {subItem.name}
                            </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  </div>
              )}
            </div>
          ))}
        </nav>
        
          {/* Pied de sidebar */}
          <div className="p-3 mt-auto">
            <div className="py-2 px-3 bg-gray-700/50 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-5 w-5 text-[#81B441]" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-white font-medium">Besoin d&apos;aide?</p>
                  <a 
                    href="mailto:support@evenzi.io" 
                    className="text-xs text-[#81B441] hover:underline"
                  >
                    support@evenzi.io
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Panneau de notifications */}
      <NotificationPanel 
        show={showNotifications} 
        onClose={() => setShowNotifications(false)}
        eventId={eventId}
      />
    </>
  );
} 
