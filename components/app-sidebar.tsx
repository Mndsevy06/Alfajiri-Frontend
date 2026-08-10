'use client';

import { useState, useEffect } from 'react';
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
  Smartphone,
  CreditCard,
  Users,
  FileSignature,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Moon,
  Sun,
  User,
  Contact,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/api';
import { Logo } from '@/components/logo';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileEditModal } from '@/components/profile-edit-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, group: 'Pilotage', requiredPermission: 'dashboard_read' },
  { href: '/plan-comptable', label: 'Plan Comptable', icon: BookOpen, group: 'Comptabilite', requiredPermission: 'compta_read' },
  { href: '/tiers', label: 'Tiers', icon: Contact, group: 'Comptabilite', requiredPermission: 'compta_read' },
  { href: '/saisie', label: 'Saisie Comptable', icon: PencilLine, group: 'Comptabilite', requiredPermission: 'saisie_create' },
  { href: '/restitutions', label: 'Restitutions', icon: BarChart3, group: 'Comptabilite', requiredPermission: 'restitutions_read' },

  { href: '/terrain', label: 'Saisie Terrain', icon: Smartphone, group: 'Operations', requiredPermission: 'terrain_read' },

  { href: '/etats-financiers', label: 'Etats Financiers OHADA', icon: FileText, group: 'Cloture', requiredPermission: 'etats_financiers_read' },
  // { href: '/utilisateurs', label: 'Utilisateurs', icon: Users, group: 'Systeme', requiredPermission: 'users_read' },
  // { href: '/notifications', label: 'Notifications', icon: ScrollText, group: 'Systeme', requiredPermission: 'dashboard_read' },
  // { href: '/parametres', label: 'Parametres', icon: Settings, group: 'Systeme', requiredPermission: 'settings_write' },
];

export function AppSidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchMe = async () => {
    try {
      const data = await fetchWithAuth('/users/me/');
      setUserPermissions(data.permissions || {});
      setUserRole(data.role || null);
      setUserName(data.nom || data.email || '');
      setCurrentUserData(data);
    } catch (error) {
      console.error('Failed to fetch user permissions');
    }
  };

  const getAvatarUrl = (user: any) => {
    if (user?.photo_profil) {
      return user.photo_profil.startsWith('http')
        ? user.photo_profil
        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${user.photo_profil.startsWith('/') ? '' : '/'}${user.photo_profil}`;
    }
    return user?.avatar || '';
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (userRole === 'Super Admin') return true;
    if (!item.requiredPermission) return true;
    if (userPermissions && userPermissions[item.requiredPermission]) return true;
    return false;
  });

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  const handleToggle = () => {
    if (window.innerWidth < 1024) {
      onToggle();
      return;
    }
    onToggle();
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--bg-primary)] border-r border-[var(--border-default)] transition-all duration-300',
          open ? 'w-[240px] translate-x-0' : 'w-[240px] -translate-x-full lg:translate-x-0 lg:w-[64px]'
        )}
      >
        {/* ── Header ── */}
        <div className={cn(
          'flex items-center gap-3 px-4 h-16 border-b border-[var(--border-default)] flex-shrink-0',
          !open && 'lg:justify-center lg:px-0'
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Logo className="h-4 w-4" />
          </div>
          {open && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-widest leading-none">
                FinERP
              </p>
              <p className="text-xs font-medium text-[var(--text-primary)] truncate mt-0.5">
                SYSCOHADA - RDC
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg text-foreground hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0',
              !open && 'lg:mt-0 lg:mx-auto'
            )}
          >
            {open ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 flex flex-col py-3 px-3 overflow-y-auto scrollbar-thin">
          <div className="flex flex-col flex-1 gap-0.5">
            {visibleNavItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!open ? item.label : undefined}
                  onClick={() => {
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={cn(
                    'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors',
                    !open && 'lg:justify-center lg:px-0',
                    active
                      ? 'bg-primary/[0.08] text-primary font-semibold'
                      : 'text-foreground hover:bg-[var(--bg-secondary)] hover:text-primary font-medium'
                  )}
                >
                  {/* Active left bar */}
                  {active && (
                    <motion.span
                      layoutId="sidebar-active-bar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  <span className={cn('shrink-0', active ? 'text-primary' : 'text-foreground')}>
                    <item.icon className="h-[17px] w-[17px]" />
                  </span>

                  {open && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Footer ── */}
        <div className="border-t border-[var(--border-default)] px-3 py-3 space-y-1 flex-shrink-0">
          {/* User button + menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(p => !p)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors',
                !open && 'lg:justify-center lg:px-0'
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={getAvatarUrl(currentUserData)} alt={currentUserData?.nom} />
                <AvatarFallback className="bg-primary text-white text-[10px] font-bold">
                  {currentUserData?.nom ? currentUserData.nom.substring(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              {open && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                    {userName || 'Utilisateur'}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate leading-tight">
                    {userRole || 'Rôle'}
                  </p>
                </div>
              )}
            </button>

            {/* User menu popover */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.14 }}
                  className={cn(
                    'absolute z-[100] w-56 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] shadow-lg p-1',
                    !open
                      ? 'bottom-0 left-[calc(100%+8px)]'
                      : 'bottom-[calc(100%+6px)] left-0'
                  )}
                >
                  <div className="px-3 py-2 border-b border-[var(--border-default)] mb-1">
                    <p className="text-sm font-medium">{currentUserData?.nom}</p>
                    <p className="text-xs text-muted-foreground font-normal truncate">{currentUserData?.email}</p>
                  </div>
                  {mounted && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setTheme(theme === 'dark' ? 'light' : 'dark');
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      {theme === 'light'
                        ? <Moon size={14} className="text-primary" />
                        : <Sun size={14} className="text-primary" />
                      }
                      {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
                    </button>
                  )}
                  <div className="h-px bg-[var(--border-default)] my-1" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <User size={14} className="text-[var(--text-primary)]" />
                    Mon profil
                  </button>
                  <Link
                    href="/parametres"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <Settings size={14} className="text-[var(--text-primary)]" />
                    Paramètres
                  </Link>
                  <div className="h-px bg-[var(--border-default)] my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Déconnexion
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUserData}
        onProfileUpdated={fetchMe}
      />
    </>
  );
}
