"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
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
  ChevronLeftIcon,
  PresentationChartLineIcon,
  ClockIcon,
  EnvelopeIcon,
  TicketIcon,
  TrophyIcon,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
 * Composant AdminEventSidebar - Sidebar pour la gestion d'un événement (Admin)
 */
export function AdminEventSidebar({ 
  eventId, 
  onNotificationToggle,
  activeTab 
}: { 
  eventId: string,
  onNotificationToggle: (show: boolean) => void,
  activeTab?: string 
}) {
  const pathname = usePathname();
  const [inscriptionExpanded, setInscriptionExpanded] = useState(
    pathname.includes('/billets') || 
    pathname.includes('/badges') || 
    pathname.includes('/formulaire')
  );
  
  const baseUrl = `/dashboard/events/${eventId}`;

  // Fonction pour vérifier si un lien est actif
  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Configuration des liens de navigation pour un événement
  const navigationItems = [
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
      href: `${baseUrl}/sponsors`, 
      icon: BuildingOfficeIcon,
    },
    { 
      name: "Sessions", 
      href: `${baseUrl}/sessions`, 
      icon: CalendarIcon,
    },
    { 
      name: "Gamification", 
      href: `${baseUrl}/game`, 
      icon: TrophyIcon,
    },
    { 
      name: "Badges", 
      href: `${baseUrl}/badges`, 
      icon: IdentificationIcon,
    },
    { 
      name: "Réglages", 
      href: `${baseUrl}/settings`, 
      icon: Cog6ToothIcon,
    },
  ];

  const inscriptionSubItems = [
    { name: "Billets", href: `${baseUrl}/billets`, icon: TicketIcon },
    { name: "Badges", href: `${baseUrl}/badges`, icon: IdentificationIcon },
    { name: "Formulaire", href: `${baseUrl}/formulaire`, icon: DocumentTextIcon },
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

        {/* Retour au dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Retour au dashboard">
                  <Link href="/dashboard">
                    <ChevronLeftIcon className="h-5 w-5" />
                    <span>Retour au dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestion de l'événement</SidebarGroupLabel>
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

        {/* Section Inscription (Collapsible) */}
        <SidebarGroup>
          <SidebarGroupLabel>Inscription</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                open={inscriptionExpanded}
                onOpenChange={setInscriptionExpanded}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Inscription">
                      <ClipboardDocumentListIcon className="h-5 w-5" />
                      <span>Inscription</span>
                      <ChevronRightIcon className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {inscriptionSubItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const active = isActive(subItem.href);
                        
                        return (
                          <SidebarMenuSubItem key={subItem.name}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={active}
                            >
                              <Link href={subItem.href}>
                                <SubIcon className="h-4 w-4" />
                                <span>{subItem.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
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

