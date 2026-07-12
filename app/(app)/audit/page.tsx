'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Download,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Eye,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AUDIT_ENTRIES } from '@/lib/mock-data';
import type { AuditEntry } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const ACTION_STYLE: Record<string, string> = {
  CONNEXION: 'bg-primary/10 text-primary',
  DÉCONNEXION: 'bg-muted text-muted-foreground',
  CRÉATION: 'bg-chart-2/10 text-chart-2',
  LECTURE: 'bg-muted text-muted-foreground',
  MODIFICATION: 'bg-warning/10 text-warning',
  SUPPRESSION: 'bg-destructive/10 text-destructive',
  VALIDATION: 'bg-success/10 text-success',
  ANNULATION: 'bg-destructive/10 text-destructive',
  EXPORTATION: 'bg-chart-4/10 text-chart-4',
  IMPRESSION: 'bg-chart-4/10 text-chart-4',
};

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>(AUDIT_ENTRIES);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [viewing, setViewing] = useState<AuditEntry | null>(null);

  const users = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.utilisateur)));
  }, [entries]);

  const actions = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.action)));
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        e.objet.toLowerCase().includes(search.toLowerCase()) ||
        e.module.toLowerCase().includes(search.toLowerCase()) ||
        e.utilisateur.toLowerCase().includes(search.toLowerCase());
      const matchAction = filterAction === 'all' || e.action === filterAction;
      const matchUser = filterUser === 'all' || e.utilisateur === filterUser;
      return matchSearch && matchAction && matchUser;
    });
  }, [entries, search, filterAction, filterUser]);

  const stats = {
    total: entries.length,
    today: entries.filter((e) => e.timestamp.startsWith('2025-07-08')).length,
    modifications: entries.filter((e) => e.action === 'MODIFICATION').length,
    suppressions: entries.filter((e) => e.action === 'SUPPRESSION').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Journal d'Audit</h1>
          <p className="text-muted-foreground mt-1">
            Traçabilité complète et immuable de toutes les actions utilisateur
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success('Export PDF horodaté généré')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success('Export CSV généré')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Integrity banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 text-success border border-success/20">
        <ShieldCheck className="h-6 w-6 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Intégrité du journal vérifiée</p>
          <p className="text-sm opacity-80">
            {entries.length} entrées · Aucune modification détectée · Chiffrement actif
          </p>
        </div>
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          Intègre
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total actions</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Aujourd'hui</p>
            <p className="text-2xl font-bold">{stats.today}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Modifications</p>
            <p className="text-2xl font-bold text-warning">{stats.modifications}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Suppressions</p>
            <p className="text-2xl font-bold text-destructive">{stats.suppressions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans le journal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Chronologie des actions</CardTitle>
          <CardDescription>{filtered.length} entrée(s) · Tri par ordre antéchronologique</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
            {filtered.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group"
                onClick={() => setViewing(e)}
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', ACTION_STYLE[e.action])}>
                  <ScrollText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn('text-xs', ACTION_STYLE[e.action])}>{e.action}</Badge>
                    <span className="text-sm font-medium">{e.utilisateur}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{e.module}</span>
                  </div>
                  <p className="text-sm mt-1 truncate">{e.objet}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatDateTime(e.timestamp)}</span>
                    <span>·</span>
                    <span>{e.ip}</span>
                    <span>·</span>
                    <span>{e.terminal}</span>
                  </div>
                </div>
                <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">Aucune entrée trouvée</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-primary" />
                  Détail de l'entrée d'audit
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Horodatage</p>
                    <p className="font-medium">{formatDateTime(viewing.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Action</p>
                    <Badge className={cn('text-xs', ACTION_STYLE[viewing.action])}>{viewing.action}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Utilisateur</p>
                    <p className="font-medium">{viewing.utilisateur}</p>
                    <p className="text-xs text-muted-foreground">{viewing.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Terminal</p>
                    <p className="font-medium">{viewing.terminal}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse IP</p>
                    <p className="font-mono font-medium">{viewing.ip}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Module</p>
                    <p className="font-medium">{viewing.module}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">Objet concerné</p>
                  <p className="text-sm font-medium">{viewing.objet}</p>
                </div>
                {viewing.avant && viewing.apres && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Snapshot Avant / Après</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <p className="text-xs text-destructive font-semibold mb-1">AVANT</p>
                        <p className="text-sm font-mono">{viewing.avant}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                        <p className="text-xs text-success font-semibold mb-1">APRÈS</p>
                        <p className="text-sm font-mono">{viewing.apres}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
