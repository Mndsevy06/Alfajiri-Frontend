'use client';

/**
 * ClientProviders — wrapper client-only pour tous les providers
 * qui utilisent des APIs navigateur (localStorage, WebSocket, etc.)
 * 
 * Rendu uniquement côté client grâce à `dynamic` ssr:false dans le layout.
 */
import { EntiteProvider } from '@/lib/entite-context';
import { NotificationsProvider } from '@/lib/notifications-context';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <EntiteProvider>
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </EntiteProvider>
  );
}
