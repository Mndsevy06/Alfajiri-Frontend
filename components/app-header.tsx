'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu, Search, Bell, ChevronDown, Building2, Check, LogOut,
  User, Settings, AlertTriangle, Info, XCircle, CheckCircle2,
  Plus, Wifi, WifiOff, Trash2, ExternalLink, CheckCheck,
  Zap, ShieldAlert, TriangleAlert, CircleCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/api';
import { ProfileEditModal } from '@/components/profile-edit-modal';
import { useEntite } from '@/lib/entite-context';
import { useNotifications } from '@/lib/notifications-context';
import type { AppNotification, NotificationType } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers visuels ───────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  badgeClass: string;
  label: string;
}> = {
  critical: {
    icon: ShieldAlert,
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10 border-red-500/20',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    label: 'Critique',
  },
  urgent: {
    icon: TriangleAlert,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    label: 'Urgent',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/10 border-yellow-500/20',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    label: 'Attention',
  },
  info: {
    icon: CircleCheck,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    label: 'Info',
  },
};

const MODULE_LABELS: Record<string, string> = {
  comptabilite: 'Comptabilité', ventes: 'Ventes', paiements: 'Trésorerie',
  logistique: 'Logistique', terrain: 'Terrain', rh: 'RH & Paie',
  fiscalite: 'Fiscalité', rapprochement: 'Rapprochement', immobilisations: 'Immobilisations',
  cloture: 'Clôture', securite: 'Sécurité',
};

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

// ─── Notification Item ─────────────────────────────────────────────────────────
function NotifItem({
  notif,
  onRead,
  onDelete,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group flex items-start gap-3 px-3 py-3 border-b border-border last:border-0',
        'hover:bg-muted/40 cursor-pointer transition-colors relative',
        !notif.lu && 'bg-primary/[0.04]',
      )}
      onClick={() => { if (!notif.lu) onRead(notif.id); }}
    >
      {/* Indicateur non lu */}
      {!notif.lu && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full" />
      )}

      {/* Icône */}
      <div className={cn('mt-0.5 shrink-0 p-1.5 rounded-lg', cfg.bgClass)}>
        <Icon className={cn('h-3.5 w-3.5', cfg.colorClass)} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug truncate">{notif.titre}</p>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {notif.action_url && (
              <button
                onClick={(e) => { e.stopPropagation(); window.location.href = notif.action_url!; }}
                className="p-0.5 hover:text-primary transition-colors"
                title="Ouvrir"
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
              className="p-0.5 hover:text-destructive transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', cfg.badgeClass)}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            {MODULE_LABELS[notif.module] || notif.module}
          </span>
          <span className="text-[10px] text-muted-foreground/50 ml-auto">
            {timeAgo(notif.cree_le)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── AppHeader ─────────────────────────────────────────────────────────────────
export function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { entites, activeEntite, setActiveEntite } = useEntite();
  const { notifications, unreadCount, isConnected, markRead, markAllRead, deleteNotif } = useNotifications();

  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [open, setOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const user = await fetchWithAuth('/users/me/');
      setCurrentUserData(user);
    } catch (e) {
      console.error('Failed to fetch user profile', e);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const getAvatarUrl = (user: any) => {
    if (user?.photo_profil) {
      return user.photo_profil.startsWith('http')
        ? user.photo_profil
        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${user.photo_profil.startsWith('/') ? '' : '/'}${user.photo_profil}`;
    }
    return user?.avatar || '';
  };

  const filteredNotifs = filterType === 'all'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  const hasCritical = notifications.some(n => !n.lu && n.type === 'critical');

  const FILTERS: Array<{ key: NotificationType | 'all'; label: string }> = [
    { key: 'all', label: 'Tout' },
    { key: 'critical', label: '🔴' },
    { key: 'urgent', label: '🟠' },
    { key: 'warning', label: '🟡' },
    { key: 'info', label: '🟢' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-background/80 dark:backdrop-blur-md border-b border-border flex items-center px-4 lg:px-6 gap-3">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sélecteur dossier */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Dossiers / Sites">
            <Building2 className="h-5 w-5 text-primary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel>Dossiers / Sites</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {entites.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">Aucune entité configurée</div>
          )}
          {entites.map((d) => (
            <DropdownMenuItem key={d.id} onClick={() => setActiveEntite(d)} className="flex items-start gap-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.raisonSociale}</p>
                <p className="text-xs text-muted-foreground">Exercice {d.exerciceEnCours} - {d.devise}</p>
              </div>
              {activeEntite && activeEntite.id === d.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" title="Nouvelle entité" asChild>
        <Link href="/onboarding"><Plus className="h-5 w-5 text-primary" /></Link>
      </Button>

      <div className="flex-1" />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>

        {/* ─── Cloche Notifications ─────────────────────────────────── */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" id="notifications-bell">
              <Bell className="h-5 w-5" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={cn(
                      'absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center',
                      hasCritical
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-primary text-primary-foreground',
                    )}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[380px] lg:w-[420px] p-0" sideOffset={8}>
            {/* Header panel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Indicateur connexion WS */}
                <span
                  className={cn('flex items-center gap-1 text-[10px]', isConnected ? 'text-emerald-400' : 'text-muted-foreground')}
                  title={isConnected ? 'Connecté en temps réel' : 'Déconnecté'}
                >
                  {isConnected
                    ? <><Wifi className="h-3 w-3" /> Live</>
                    : <><WifiOff className="h-3 w-3" /> Hors ligne</>
                  }
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" /> Tout lire
                  </button>
                )}
              </div>
            </div>

            {/* Filtres par type */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-all font-medium',
                    filterType === f.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
              >
                Tout voir <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Liste notifications */}
            <div className="max-h-[360px] overflow-y-auto">
              {filteredNotifs.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                  <p className="text-sm text-muted-foreground">Aucune notification</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Vous êtes à jour !</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredNotifs.slice(0, 20).map(n => (
                    <NotifItem
                      key={n.id}
                      notif={n}
                      onRead={markRead}
                      onDelete={deleteNotif}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ─── Menu utilisateur ─────────────────────────────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(currentUserData)} alt={currentUserData?.nom} />
                <AvatarFallback>
                  {currentUserData?.nom ? currentUserData.nom.substring(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{currentUserData?.nom}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{currentUserData?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">{currentUserData?.nom}</p>
                <p className="text-xs text-muted-foreground font-normal">{currentUserData?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
              <User className="h-4 w-4 mr-2" /> Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/parametres"><Settings className="h-4 w-4 mr-2" /> Paramètres</Link>
            </DropdownMenuItem>
            <div className="px-2 py-1.5 flex justify-between items-center">
              <span className="text-sm font-medium">Thème</span>
              <ThemeToggle className="h-8 w-8" />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onSelect={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUserData}
        onProfileUpdated={fetchUser}
      />
    </header>
  );
}
