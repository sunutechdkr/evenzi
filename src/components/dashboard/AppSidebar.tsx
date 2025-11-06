"use client";

import Link from "next/link";
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
  UsersIcon
} from "@heroicons/react/24/outline";
import { UserRole } from "@/types/models";
import Logo from "@/components/ui/Logo";
import { UserProfile } from "@/components/dashboard/UserProfile";
import { useNotifications } from '@/hooks/useNotifications';
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
];

/**
 * Composant NotificationButton - Bouton de notifications dans le sidebar
 */
function NotificationButton({ onToggle }: { onToggle: (show: boolean) => void }) {
  const { data: session } = useSession();
  const { unreadCount } = useNotifications({});
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
 * Composant AppSidebar - Sidebar principale pour Admin Dashboard avec Shadcn
 */
export function AppSidebar({ 
  onNotificationToggle 
}: { 
  onNotificationToggle: (show: boolean) => void 
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Fonction pour vérifier si un lien est actif
  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  // Filtrer les liens de navigation en fonction du rôle de l'utilisateur
  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly) {
      return session?.user?.role === UserRole.ADMIN;
    }
    return true;
  });

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
              <NotificationButton onToggle={onNotificationToggle} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => {
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

