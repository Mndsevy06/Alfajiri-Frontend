'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { toast } from 'sonner';
import { fetchWithAuth } from './api';
import type { AppNotification } from './types';
import { useEntite } from './entite-context';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotif: (id: string) => void;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);


// ─── Provider ──────────────────────────────────────────────────────────────────
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { activeEntite } = useEntite();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const wsRef      = useRef<WebSocket | null>(null);
  const retryRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 10;
  const BASE_RETRY_MS = 1500;

  // ─ REST: charger l'historique initial ──────────────────────────────────────
  const refresh = useCallback(async () => {
    // Guard SSR
    if (typeof window === 'undefined') return;
    try {
      const data = await fetchWithAuth('/notifications/');
      setNotifications(data.results ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // silencieux — le WS prend le relais
    } finally {
      setIsLoading(false);
    }
  }, [activeEntite?.id]);

  // ─ WebSocket ───────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    // Guard SSR
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const wsBase = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000')
      .replace(/^http/, 'ws');
    const dossierIdParam = activeEntite?.id ? `&dossier_id=${activeEntite.id}` : '';
    const ws = new WebSocket(`${wsBase}/ws/notifications/?token=${token}${dossierIdParam}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      retryCount.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'NOTIFICATION_HISTORY') {
          // Historique reçu à la connexion
          setNotifications(msg.notifications ?? []);
          setUnreadCount((msg.notifications ?? []).filter((n: AppNotification) => !n.lu).length);

        } else if (msg.type === 'NEW_NOTIFICATION') {
          const notif: AppNotification = msg.notification;

          // Ajouter en tête de liste
          setNotifications(prev => [notif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Toast Sonner contextuel
          const toastFn = notif.type === 'critical' || notif.type === 'urgent'
            ? toast.error
            : notif.type === 'warning'
              ? toast.warning
              : toast.success;

          toastFn(notif.titre, {
            description: notif.message,
            duration: notif.type === 'critical' ? 8000 : 4000,
            action: notif.action_url
              ? { label: 'Voir', onClick: () => window.location.href = notif.action_url! }
              : undefined,
          });

        } else if (msg.type === 'NOTIFICATION_READ') {
          setNotifications(prev =>
            prev.map(n => n.id === msg.id ? { ...n, lu: true } : n)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));

        } else if (msg.type === 'NOTIFICATIONS_ALL_READ') {
          setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
          setUnreadCount(0);
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = (evt) => {
      setIsConnected(false);
      wsRef.current = null;
      // Reconnexion automatique (backoff exponentiel) sauf déconnexion auth ou démontage (1000)
      if (evt.code !== 4001 && evt.code !== 1000 && retryCount.current < MAX_RETRIES) {
        const delay = Math.min(BASE_RETRY_MS * 2 ** retryCount.current, 30000);
        retryCount.current += 1;
        retryRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => ws.close();
  }, [activeEntite?.id]);

  useEffect(() => {
    refresh();
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close(1000, 'component unmount');
    };
  }, [connect, refresh]);

  // ─ Actions ─────────────────────────────────────────────────────────────────
  const markRead = useCallback((id: string) => {
    // Optimiste
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    // Via WebSocket si connecté, sinon REST
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'mark_read', id }));
    } else {
      fetchWithAuth(`/notifications/${id}/read/`, { method: 'PATCH' }).catch(() => {});
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    setUnreadCount(0);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'mark_all_read' }));
    } else {
      fetchWithAuth('/notifications/read-all/', { method: 'POST' }).catch(() => {});
    }
  }, []);

  const deleteNotif = useCallback((id: string) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === id);
      if (notif && !notif.lu) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(n => n.id !== id);
    });
    fetchWithAuth(`/notifications/${id}/`, { method: 'DELETE' }).catch(() => {});
  }, []);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      isConnected,
      isLoading,
      markRead,
      markAllRead,
      deleteNotif,
      refresh,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
const EMPTY_CONTEXT: NotificationsContextValue = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isLoading: false,
  markRead: () => {},
  markAllRead: () => {},
  deleteNotif: () => {},
  refresh: async () => {},
};

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  // Retourner des valeurs par défaut si hors contexte (SSR / chargement dynamique)
  return ctx ?? EMPTY_CONTEXT;
}
