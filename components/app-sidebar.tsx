'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  PencilLine,
  BarChart3,
  Landmark,
  Truck,
  FileText,
  Building2,
  ScrollText,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, group: 'Pilotage' },
  { href: '/plan-comptable', label: 'Plan Comptable', icon: BookOpen, group: 'Comptabilite' },
  { href: '/saisie', label: 'Saisie Comptable', icon: PencilLine, group: 'Comptabilite' },
  { href: '/restitutions', label: 'Restitutions', icon: BarChart3, group: 'Comptabilite' },
  { href: '/rapprochement', label: 'Rapprochement Bancaire', icon: Landmark, group: 'Comptabilite' },
  { href: '/terrain', label: 'Saisie Terrain', icon: Smartphone, group: 'Operations' },
  { href: '/ventes', label: 'Ventes & Facturation', icon: Receipt, group: 'Operations' },
  { href: '/logistique', label: 'Suivi Logistique', icon: Truck, group: 'Operations' },
  { href: '/paiements', label: 'Gestion des Paiements', icon: CreditCard, group: 'Operations' },
  { href: '/immobilisations', label: 'Immobilisations', icon: Building2, group: 'Operations' },
  { href: '/etats-financiers', label: 'Etats Financiers OHADA', icon: FileText, group: 'Cloture' },
  { href: '/audit', label: "Journal d'Audit", icon: ScrollText, group: 'Systeme' },
  { href: '/parametres', label: 'Parametres', icon: Settings, group: 'Systeme' },
];

export function AppSidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  const groups = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof NAV_ITEMS>);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
          open ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:translate-x-0 lg:w-20'
        )}
      >
        <div className="relative flex items-center gap-3 px-5 h-16 border-b border-sidebar-border shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          {open && (
            <div className="overflow-hidden">
              <p className="font-bold text-lg leading-none">FinERP</p>
              <p className="text-xs text-muted-foreground mt-1">SYSCOHADA - RDC</p>
            </div>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={onToggle}
            className="hidden lg:flex absolute -right-4 top-4 h-8 w-8 rounded-full bg-background shadow-sm text-muted-foreground hover:text-foreground z-50"
          >
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-6">
              {open && (
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group}
                </p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!open ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5 shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                      {open && <span className="truncate">{item.label}</span>}
                      {active && open && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>


      </aside>
    </>
  );
}
