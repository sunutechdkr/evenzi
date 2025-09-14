/**
 * Composant ParticipantNotificationList - Liste des notifications simplifiée pour les participants
 * Interface épurée avec seulement les filtres "Toutes" et "Non lues"
 */

'use client';

import React, { useState, useEffect } from 'react';
import { NotificationItem } from './NotificationItem';
import { 
  BellIcon, 
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { NotificationType } from '@prisma/client';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: string;
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
}

interface ParticipantNotificationListProps {
  userId: string;
  eventId?: string;
  className?: string;
}

export function ParticipantNotificationList({ userId, eventId, className }: ParticipantNotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Charger les notifications
  const loadNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.append('isRead', 'false');
      }
      if (eventId) {
        params.append('eventId', eventId);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_read' }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            isRead: true, 
            readAt: new Date() 
          }))
        );
      }
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  };

  // Actualiser les notifications
  const refresh = () => {
    setRefreshing(true);
    loadNotifications(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [filter, eventId]);

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    return true; // 'all'
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BellIcon className="w-5 h-5 mr-2 text-[#81B441]" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-[#81B441] text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-gray-400 hover:text-[#81B441] transition-colors flex items-center"
              title="Tout marquer comme lu"
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              Tout lire
            </button>
          )}
          
          <button
            onClick={refresh}
            disabled={refreshing}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
            title="Actualiser"
          >
            <ArrowPathIcon className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filtres simplifiés pour participants */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1 text-xs rounded-full transition-colors',
            filter === 'all'
              ? 'bg-[#81B441] text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          )}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-3 py-1 text-xs rounded-full transition-colors',
            filter === 'unread'
              ? 'bg-[#81B441] text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          )}
        >
          Non lues ({unreadCount})
        </button>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BellIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {filter === 'unread' 
                ? 'Aucune notification non lue' 
                : 'Aucune notification'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>

      {/* Pied de page */}
      {filteredNotifications.length > 0 && (
        <div className="text-center pt-4 border-t border-gray-600">
          <p className="text-xs text-gray-400">
            {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
