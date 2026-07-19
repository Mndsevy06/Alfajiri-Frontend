'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, ShieldAlert, TriangleAlert, AlertTriangle, CircleCheck,
  Search, Filter, CheckCheck, Trash2, ExternalLink,
  Wifi, WifiOff, RefreshCw, InboxIcon,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/lib/notifications-context';
import type { AppNotification, NotificationType, NotificationModule } from '@/lib/types';

// ─── Config visuelle ───────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  critical: { icon: ShieldAlert,    color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    badge: 'bg-red-500/15 text-red-400',    label: 'Critique',    dot: 'bg-red-500' },
  urgent:   { icon: TriangleAlert,  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  badge: 'bg-amber-500/15 text-amber-400', label: 'Urgent',     dot: 'bg-amber-500' },
  warning:  { icon: AlertTriangle,  color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', badge: 'bg-yellow-500/15 text-yellow-400',label: 'Attention',  dot: 'bg-yellow-500' },
  info:     { icon: CircleCheck,    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   badge: 'bg-blue-500/15 text-blue-400',   label: 'Info',       dot: 'bg-blue-500' },
} satisfies Record<NotificationType, object>;

const MODULE_LABELS: Record<string, string> = {
  comptabilite: 'Comptabilité', ventes: 'Ventes & Facturation',
  paiements: 'Trésorerie', logistique: 'Logistique',
  terrain: 'Terrain', rh: 'RH & Paie', fiscalite: 'Fiscalité',
  rapprochement: 'Rapprochement', immobilisations: 'Immobilisations',
  cloture: 'Clôture', securite: 'Sécurité',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <GlassCard className="flex flex-col items-center justify-center py-4 px-6 gap-1">
      <span className={cn('text-3xl font-bold', colorClass)}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </GlassCard>
  );
}

// ─── Full page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { notifications, unreadCount, isConnected, markRead, markAllRead, deleteNotif, refresh, isLoading } = useNotifications();

  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState<NotificationType | 'all'>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterLu, setFilterLu]       = useState<'all' | 'unread' | 'read'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const modules = useMemo(() =>
    Array.from(new Set(notifications.map(n => n.module))), [notifications]);

  const filtered = useMemo(() => notifications.filter(n => {
    const matchSearch  = !search || n.titre.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
    const matchType    = filterType === 'all' || n.type === filterType;
    const matchModule  = filterModule === 'all' || n.module === filterModule;
    const matchLu      = filterLu === 'all' || (filterLu === 'unread' ? !n.lu : n.lu);
    return matchSearch && matchType && matchModule && matchLu;
  }), [notifications, search, filterType, filterModule, filterLu]);

  const stats = useMemo(() => ({
    total:    notifications.length,
    critical: notifications.filter(n => !n.lu && n.type === 'critical').length,
    urgent:   notifications.filter(n => !n.lu && n.type === 'urgent').length,
    unread:   unreadCount,
  }), [notifications, unreadCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const TYPE_FILTERS: Array<{ key: NotificationType | 'all'; label: string; count?: number }> = [
    { key: 'all',      label: 'Tout',      count: notifications.length },
    { key: 'critical', label: '🔴 Critique',count: notifications.filter(n => n.type === 'critical').length },
    { key: 'urgent',   label: '🟠 Urgent',  count: notifications.filter(n => n.type === 'urgent').length },
    { key: 'warning',  label: '🟡 Attention',count: notifications.filter(n => n.type === 'warning').length },
    { key: 'info',     label: '🟢 Info',    count: notifications.filter(n => n.type === 'info').length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Centre de Notifications</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                {isConnected
                  ? <><Wifi className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Connecté en temps réel</span></>
                  : <><WifiOff className="h-3 w-3 text-muted-foreground" /> Hors ligne</>
                }
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            Actualiser
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Non lues" value={stats.unread} colorClass="text-primary" />
        <StatCard label="Critiques" value={stats.critical} colorClass="text-red-400" />
        <StatCard label="Urgentes" value={stats.urgent} colorClass="text-amber-400" />
        <StatCard label="Total" value={stats.total} colorClass="text-muted-foreground" />
      </div>

      {/* Filtres */}
      <GlassCard className="p-4 space-y-3">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les notifications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Filtres type */}
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-all font-medium flex items-center gap-1.5',
                  filterType === f.key
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/40',
                )}
              >
                {f.label}
                {f.count !== undefined && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', filterType === f.key ? 'bg-white/20' : 'bg-muted')}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          {/* Filtre lu/non lu */}
          <div className="flex gap-1">
            {(['all', 'unread', 'read'] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilterLu(v)}
                className={cn(
                  'text-xs px-2.5 py-1.5 rounded-full border transition-all',
                  filterLu === v
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'border-border text-muted-foreground hover:border-primary/30',
                )}
              >
                {v === 'all' ? 'Tous' : v === 'unread' ? 'Non lus' : 'Lus'}
              </button>
            ))}
          </div>

          {/* Filtre module */}
          {modules.length > 0 && (
            <select
              value={filterModule}
              onChange={e => setFilterModule(e.target.value)}
              className="text-xs border border-border rounded-full px-3 py-1.5 bg-background text-muted-foreground hover:border-primary/40 transition-colors outline-none"
            >
              <option value="all">Tous les modules</option>
              {modules.map(m => (
                <option key={m} value={m}>{MODULE_LABELS[m] || m}</option>
              ))}
            </select>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </GlassCard>

      {/* Liste principale */}
      <GlassCard className="overflow-hidden p-0">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 opacity-40" />
            <p>Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <InboxIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Aucune notification trouvée</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search ? 'Essayez une autre recherche' : 'Vous êtes à jour !'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((notif, idx) => {
              const cfg = TYPE_CONFIG[notif.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 60, height: 0 }}
                  transition={{ duration: 0.2, delay: idx < 10 ? idx * 0.03 : 0 }}
                  className={cn(
                    'group flex items-start gap-4 px-5 py-4 border-b border-border last:border-0',
                    'hover:bg-muted/30 transition-colors relative',
                    !notif.lu && 'bg-primary/[0.03]',
                  )}
                >
                  {/* Barre latérale non lu */}
                  {!notif.lu && (
                    <span className={cn('absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full', cfg.dot)} />
                  )}

                  {/* Icône type */}
                  <div className={cn('shrink-0 p-2 rounded-xl border mt-0.5', cfg.bg, cfg.border)}>
                    <Icon className={cn('h-4 w-4', cfg.color)} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-semibold', !notif.lu && 'text-foreground', notif.lu && 'text-muted-foreground')}>
                          {notif.titre}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      {/* Actions hover */}
                      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {notif.action_url && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 hover:text-primary"
                            onClick={() => window.location.href = notif.action_url!}
                            title="Ouvrir"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!notif.lu && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 hover:text-emerald-400"
                            onClick={() => markRead(notif.id)}
                            title="Marquer comme lu"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={() => deleteNotif(notif.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', cfg.badge)}>
                        {cfg.label}
                      </span>
                      <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-auto font-normal">
                        {MODULE_LABELS[notif.module] || notif.module}
                      </Badge>
                      {notif.lu && (
                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" /> Lu
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground/60 ml-auto">
                        {timeAgo(notif.cree_le)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </GlassCard>
    </div>
  );
}
