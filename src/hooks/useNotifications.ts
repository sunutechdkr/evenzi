/**
 * Hook personnalisé pour la gestion des notifications
 * Fournit les fonctionnalités de notifications avec mise à jour en temps réel
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { NotificationType } from '@prisma/client';

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

interface UseNotificationsOptions {
  eventId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { eventId, autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    try {
      setError(null);
      
      const params = new URLSearchParams();
      if (eventId) {
        params.append('eventId', eventId);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/notifications?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur lors du chargement des notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Charger le nombre de notifications non lues
  const loadUnreadCount = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('countOnly', 'true');
      if (eventId) {
        params.append('eventId', eventId);
      }

      const response = await fetch(`/api/notifications?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du compteur:', err);
    }
  }, [eventId]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
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
        
        // Mettre à jour le compteur
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erreur lors du marquage de la notification:', err);
      return false;
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
        
        // Mettre à jour le compteur si la notification n'était pas lue
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
      return false;
    }
  }, [notifications]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
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
        
        setUnreadCount(0);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications:', err);
      return false;
    }
  }, [eventId]);

  // Actualiser les données
  const refresh = useCallback(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Effet pour le chargement initial
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Effet pour l'actualisation automatique
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadUnreadCount]);

  // Calculer les notifications non lues depuis l'état local
  const localUnreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount: Math.max(unreadCount, localUnreadCount),
    loading,
    error,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    refresh,
  };
}
