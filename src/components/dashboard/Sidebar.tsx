"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  HomeIcon,
  CalendarIcon, 
  QrCodeIcon, 
  IdentificationIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BellIcon,
  ChevronRightIcon,
  XMarkIcon,
  ChevronLeftIcon,
  Bars3Icon,
  UsersIcon
} from "@heroicons/react/24/outline";
import { NotificationList } from '@/components/notifications/NotificationList';
import { useNotifications } from '@/hooks/useNotifications';
import { UserRole } from "@/types/models";
import Logo from "@/components/ui/Logo";

import { UserProfile } from "@/components/dashboard/UserProfile";
// Configuration des liens de navigation
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, exact: true },
  { name: "Événements", href: "/dashboard/events", icon: CalendarIcon },
  { name: "Analytique", href: "/dashboard/analytics", icon: ChartBarIcon },
  { name: "Check-in", href: "/dashboard/check-in", icon: QrCodeIcon },
  { name: "Badge", href: "/dashboard/badges", icon: IdentificationIcon },
  { name: "Communication", href: "/dashboard/communications", icon: EnvelopeIcon },
  { 
    name: "Gestion des utilisateurs", 
    href: "/dashboard/admin/users", 
    icon: UsersIcon,
    adminOnly: true 
  },
  { name: "Réglages", href: "/dashboard/settings", icon: Cog6ToothIcon },
  { name: "Shadcn UI", href: "/shadcn-example", icon: HomeIcon, highlight: true },
];

/**
 * Composant NotificationPanel - Panneau de notifications
 */
export function NotificationPanel({ 
  show, 
  onClose 
}: { 
  show: boolean, 
  onClose: () => void 
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
            <NotificationList userId={session.user.id} />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Composant NotificationCenter - Centre de notifications réutilisable
 */
export function NotificationCenter({ 
  isExpanded = true, 
  onToggle 
}: { 
  isExpanded: boolean, 
  onToggle: (show: boolean) => void 
}) {
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();

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
 * Composant Sidebar - Barre latérale de navigation principale
 * 
 * Fournit les liens de navigation principaux avec le même design que EventSidebar
 */
export default function Sidebar({ onExpandChange }: { onExpandChange?: (expanded: boolean) => void }) {
  // États pour contrôler l'expansion et les notifications
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Notifier le parent du changement d'état de la sidebar
  const toggleExpand = (expanded: boolean) => {
    setIsExpanded(expanded);
    if (onExpandChange) {
      onExpandChange(expanded);
    }
  };

  // Fonction pour vérifier si un lien est actif
  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  // Filtrer les liens de navigation en fonction du rôle de l'utilisateur
  const filteredNavigation = navigation.filter(item => {
    // Si l'élément est réservé aux administrateurs, vérifier le rôle
    if (item.adminOnly) {
      return session?.user?.role === UserRole.ADMIN;
    }
    return true;
  });

  return (
    <>
      {/* Version mobile: bouton d'ouverture */}
      <button
        className={`md:hidden fixed z-30 top-4 left-4 p-3 rounded-full bg-[#81B441] text-white shadow-lg transition-transform duration-200 ${
          isExpanded ? 'rotate-45' : 'rotate-0'
        }`}
        onClick={() => toggleExpand(!isExpanded)}
      >
        {isExpanded ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
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
        onClick={() => { if (window.innerWidth < 768) { toggleExpand(false); } }} className={`${
          isExpanded ? 'translate-x-0 w-64' : '-translate-x-full w-0 md:w-16 md:translate-x-0'
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
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="flex flex-col">
                <Logo width={120} height={30} color="white" />
                <span className="text-gray-400 text-xs">Dashboard</span>
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
          
          {/* Profil admin */}
          <UserProfile isExpanded={isExpanded} />
          
          {/* Centre de notifications */}
          <NotificationCenter 
            isExpanded={isExpanded} 
            onToggle={(show) => setShowNotifications(show)} 
          />
          
          {/* Navigation principale */}
          <nav className="flex-1 px-3 pb-4 mt-2 space-y-2">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
                onClick={() => { if (window.innerWidth < 768) { toggleExpand(false); } }} className={`
                  block py-2 px-3 rounded-md transition-colors duration-200
                  ${item.highlight 
                    ? 'bg-purple-100 text-purple-900 hover:bg-purple-200' 
                    : isActive(item.href, item.exact) 
                      ? 'bg-[#81B441] text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center">
                  <item.icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${item.highlight ? 'text-purple-700' : isActive(item.href, item.exact) ? 'text-white' : 'text-gray-400'}
                  `} />
              {isExpanded && (
                    <div className="flex items-center">
                      <span className="text-sm">{item.name}</span>
                      {item.highlight && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-purple-500 px-2 py-0.5 text-xs font-medium text-white">
                          Nouveau
                </span>
              )}
                    </div>
                  )}
                </div>
            </Link>
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
      <NotificationPanel show={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
} 
