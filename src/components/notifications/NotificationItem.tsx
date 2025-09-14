/**
 * Composant NotificationItem - Affichage d'une notification individuelle
 * Design avec Shadcn/ui et couleurs de la marque Evenzi
 */

'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BellIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  TrophyIcon,
  EnvelopeIcon,
  HeartIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    actionUrl?: string | null;
    event?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    metadata?: any;
  };
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: any) => void;
}

// Icônes par type de notification
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'SYSTEM':
      return CogIcon;
    case 'EVENT':
      return CalendarIcon;
    case 'REGISTRATION':
      return UserGroupIcon;
    case 'APPOINTMENT':
      return CalendarIcon;
    case 'GAME':
      return TrophyIcon;
    case 'EMAIL':
      return EnvelopeIcon;
    case 'MATCHMAKING':
      return HeartIcon;
    case 'SESSION':
      return CalendarIcon;
    case 'BADGE':
      return TrophyIcon;
    default:
      return BellIcon;
  }
};

// Couleurs par type de notification
const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'SYSTEM':
      return 'text-blue-500';
    case 'EVENT':
      return 'text-[#81B441]';
    case 'REGISTRATION':
      return 'text-green-500';
    case 'APPOINTMENT':
      return 'text-purple-500';
    case 'GAME':
      return 'text-yellow-500';
    case 'EMAIL':
      return 'text-indigo-500';
    case 'MATCHMAKING':
      return 'text-pink-500';
    case 'SESSION':
      return 'text-orange-500';
    case 'BADGE':
      return 'text-amber-500';
    default:
      return 'text-gray-500';
  }
};

// Couleurs de priorité
const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case 'URGENT':
      return 'border-l-red-500 bg-red-50/50';
    case 'HIGH':
      return 'border-l-orange-500 bg-orange-50/50';
    case 'NORMAL':
      return 'border-l-[#81B441] bg-green-50/50';
    case 'LOW':
      return 'border-l-gray-400 bg-gray-50/50';
    default:
      return 'border-l-gray-400 bg-gray-50/50';
  }
};

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onClick 
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);
  const priorityColor = getPriorityColor(notification.priority);
  
  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
    
    // Marquer comme lu automatiquement au clic
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    
    // Rediriger si une URL d'action est fournie
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={cn(
        'relative p-4 border-l-4 rounded-r-lg transition-all duration-200 cursor-pointer group',
        priorityColor,
        notification.isRead 
          ? 'bg-gray-50/30 border-opacity-50' 
          : 'bg-white border-opacity-100 shadow-sm hover:shadow-md',
        'hover:bg-gray-50/50'
      )}
      onClick={handleClick}
    >
      {/* Indicateur non lu */}
      {!notification.isRead && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-[#81B441] rounded-full animate-pulse"></div>
      )}

      <div className="flex items-start space-x-3">
        {/* Icône */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          notification.isRead ? 'bg-gray-100' : 'bg-white shadow-sm'
        )}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={cn(
                'text-sm font-medium truncate',
                notification.isRead ? 'text-gray-600' : 'text-gray-900'
              )}>
                {notification.title}
              </h4>
              
              <p className={cn(
                'text-sm mt-1',
                notification.isRead ? 'text-gray-500' : 'text-gray-700'
              )}>
                {notification.message}
              </p>

              {/* Informations supplémentaires */}
              <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                <span>
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
                
                {notification.event && (
                  <span className="flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {notification.event.name}
                  </span>
                )}
                
                {notification.priority !== 'NORMAL' && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    notification.priority === 'URGENT' && 'bg-red-100 text-red-800',
                    notification.priority === 'HIGH' && 'bg-orange-100 text-orange-800',
                    notification.priority === 'LOW' && 'bg-gray-100 text-gray-800'
                  )}>
                    {notification.priority}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && onMarkAsRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1 text-gray-400 hover:text-[#81B441] rounded-full hover:bg-gray-100 transition-colors"
                  title="Marquer comme lu"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
              )}
              
              {notification.isRead && (
                <div className="p-1 text-gray-300" title="Lu">
                  <EyeIcon className="w-4 h-4" />
                </div>
              )}
              
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors"
                  title="Supprimer"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
