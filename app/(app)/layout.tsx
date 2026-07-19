'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';

// Chargement dynamique côté client uniquement pour éviter les erreurs SSR
// sur les providers qui utilisent localStorage et WebSocket
const ClientProviders = dynamic(
  () => import('@/components/client-providers').then(m => m.ClientProviders),
  { ssr: false }
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  return (
    <ClientProviders>
      <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <AppSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ClientProviders>
  );
}
