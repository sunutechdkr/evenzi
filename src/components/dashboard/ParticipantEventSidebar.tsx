"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  EyeIcon,
  UserGroupIcon, 
  BuildingOfficeIcon,
  CalendarIcon,
  IdentificationIcon,
  ChevronRightIcon,
  BellIcon,
  ChevronLeftIcon,
  MicrophoneIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Logo from "@/components/ui/Logo";
import { UserProfile } from "@/components/dashboard/UserProfile";
import { useNotifications } from '@/hooks/useNotifications';
import { useSession } from 'next-auth/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Composant NotificationButton - Bouton de notifications dans le sidebar
 */
function NotificationButton({ 
  onToggle, 
  eventId 
}: { 
  onToggle: (show: boolean) => void,
  eventId: string 
}) {
  const { data: session } = useSession();
  const { unreadCount } = useNotifications({ eventId });
  const { open } = useSidebar();

  if (!session?.user?.id) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => onToggle(true)}
        className="relative"
        tooltip="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {open && <span>Notifications</span>}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#81B441] text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-sidebar">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * Composant ParticipantEventSidebar - Sidebar pour les participants d'un événement
 */
export function ParticipantEventSidebar({ 
  eventId, 
  onNotificationToggle,
  activeTab 
}: { 
  eventId: string,
  onNotificationToggle: (show: boolean) => void,
  activeTab?: string 
}) {
  const pathname = usePathname();
  
  const baseUrl = `/dashboard/user/events/${eventId}`;

  // Fonction pour vérifier si un lien est actif
  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href) || activeTab === href;
  };

  // Configuration des liens de navigation pour un événement (Participant)
  const navigationItems = [
    { 
      name: "Aperçu", 
      href: `${baseUrl}`, 
      icon: EyeIcon,
      exact: true,
    },
    { 
      name: "Participants", 
      href: `${baseUrl}/participants`, 
      icon: UserGroupIcon,
    },
    { 
      name: "Rendez-Vous", 
      href: `${baseUrl}/rendez-vous`, 
      icon: ClockIcon,
    },
    { 
      name: "Sponsors", 
      href: `${baseUrl}/sponsors`, 
      icon: BuildingOfficeIcon,
    },
    { 
      name: "Sessions", 
      href: `${baseUrl}/sessions`, 
      icon: CalendarIcon,
    },
    { 
      name: "Speakers", 
      href: `${baseUrl}/speakers`, 
      icon: MicrophoneIcon,
    },
    { 
      name: "Mon Badge", 
      href: `${baseUrl}/badge`, 
      icon: IdentificationIcon,
    },
    { 
      name: "Aide", 
      href: `${baseUrl}/aide`, 
      icon: QuestionMarkCircleIcon,
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-center py-4 px-2">
          <Logo width={120} height={30} color="white" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Profil utilisateur */}
        <SidebarGroup>
          <SidebarGroupContent>
            <UserProfile isExpanded={true} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Notifications */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NotificationButton onToggle={onNotificationToggle} eventId={eventId} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Retour aux événements */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Retour aux événements">
                  <Link href="/dashboard/user/events">
                    <ChevronLeftIcon className="h-5 w-5" />
                    <span>Retour aux événements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.name}
                    >
                      <Link href={item.href}>
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-2 text-xs text-sidebar-foreground/60 text-center">
          © 2024 Evenzi
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

