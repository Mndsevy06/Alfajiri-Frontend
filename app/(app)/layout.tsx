'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';

import { useEntite } from '@/lib/entite-context';

// Chargement dynamique côté client uniquement pour éviter les erreurs SSR
// sur les providers qui utilisent localStorage et WebSocket
const ClientProviders = dynamic(
  () => import('@/components/client-providers').then(m => m.ClientProviders),
  { ssr: false }
);

function AppMain({ 
  children, 
  sidebarOpen, 
  setSidebarOpen 
}: { 
  children: React.ReactNode; 
  sidebarOpen: boolean; 
  setSidebarOpen: (o: boolean) => void; 
}) {
  const { activeEntite } = useEntite();

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <AppSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <section className={cn(
        'h-screen flex flex-col transition-all duration-300',
        sidebarOpen ? 'lg:pl-[240px]' : 'lg:pl-[64px]'
      )}>
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main 
          key={activeEntite?.id || 'no-entity'} 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 sm:px-4 lg:px-8 py-3 sm:py-4"
        >
          {children}
        </main>
      </section>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  return (
    <ClientProviders>
      <AppMain sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
        {children}
      </AppMain>
    </ClientProviders>
  );
}
