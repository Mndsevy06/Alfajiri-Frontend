'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Palette,
  Bell,
  Plus,
  Pencil,
  Shield,
  Sun,
  Globe,
  Mail,
  Check,
  Coins,
  Bot,
  ShieldCheck,
  Database,
  Lock,
  Activity,
  CheckCircle2,
  TrendingUp,
  Zap,
  ServerCog,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard, Button as NeonButton } from '@/components/ui/Layout';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { DOSSIERS } from '@/lib/mock-data';
import type { Dossier } from '@/lib/types';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'dossiers',       label: 'Dossiers',         icon: Building2 },
  { id: 'apparence',      label: 'Apparence',         icon: Palette },
  { id: 'notifications',  label: 'Notifications',     icon: Bell },
  { id: 'taux-change',    label: 'Taux de change',    icon: Coins },
  { id: 'ia-gemini',      label: 'IA Gemini',         icon: Bot },
  { id: 'securite',       label: 'Securite',          icon: ShieldCheck },
] as const;

type TabId = typeof TABS[number]['id'];

const NOTIF_ITEMS = [
  { key: 'email',     label: 'Notifications par e-mail',  desc: 'Recevoir les alertes et rapports par email',     icon: Mail,         color: 'text-primary',    bg: 'bg-primary/10' },
  { key: 'push',      label: 'Notifications push',         desc: 'Alertes en temps reel sur le navigateur',        icon: Bell,         color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'anomalies', label: "Detection d'anomalies",      desc: 'Anomalies comptables, logistiques et fiscales',  icon: Activity,     color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  { key: 'cloture',   label: 'Rappels de cloture',         desc: 'Notifications pour les periodes de cloture',     icon: CheckCircle2, color: 'text-chart-2',    bg: 'bg-chart-2/10' },
] as const;

const TAUX_DATA = [
  { devise: 'CDF', nom: 'Franc Congolais', taux: '2850.50', date: '2025-07-08', source: 'BCC', trend: '+0.3%', up: true },
  { devise: 'EUR', nom: 'Euro',            taux: '0.92',    date: '2025-07-08', source: 'BCE', trend: '-0.1%', up: false },
  { devise: 'ZMW', nom: 'Kwacha Zambien',  taux: '25.40',   date: '2025-07-08', source: 'BOZ', trend: '+1.2%', up: true },
];

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<TabId>('dossiers');
  const [dossiers, setDossiers] = useState<Dossier[]>(DOSSIERS);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);
  const [notifSettings, setNotifSettings] = useState({
    email: true,
    push: true,
    anomalies: true,
    cloture: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const saveDossier = (dossier: Dossier) => {
    setDossiers(dossiers.map((d) => (d.id === dossier.id ? dossier : d)));
    setEditingDossier(null);
    toast.success('Dossier mis a jour avec succes');
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Mini stat cards */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Dossiers actifs</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-primary truncate">{dossiers.length}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Dernier backup</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-chart-2 truncate">Aujourd'hui</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-chart-2/10 text-chart-2 shrink-0">
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Statut systeme</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-emerald-500 truncate">Operationnel</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Tab bar — same pill style as users/permissions */}
      <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-[var(--border-default)]/50 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all flex-1 sm:flex-none justify-center sm:justify-start',
              activeTab === id
                ? 'bg-blue-600 shadow-sm text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── DOSSIERS ──────────────────────────────────────────── */}
      {activeTab === 'dossiers' && (
        <div className="space-y-3">
          {dossiers.map((d) => (
            <GlassCard glow={false} key={d.id} className="border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight">{d.raisonSociale}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 border-primary/30 text-primary bg-primary/5">
                            {d.sigle}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Exercice {d.exerciceEnCours}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: 'RCCM',      value: d.rccm },
                        { label: 'ID National', value: d.idNat },
                        { label: 'N Impot',   value: d.nImpot },
                        { label: 'Adresse',   value: d.adresse },
                        { label: 'Devise',    value: d.devise },
                        { label: 'Periode',   value: `${d.dateDebut} - ${d.dateFin}` },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-lg bg-muted/30 border border-border/30 px-3 py-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-sm font-medium font-mono leading-tight truncate">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <NeonButton
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDossier(d)}
                    className="shrink-0 h-8 px-3 text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Modifier
                  </NeonButton>
                </div>
              </CardContent>
            </GlassCard>
          ))}
        </div>
      )}

      {/* ── APPARENCE ─────────────────────────────────────────── */}
      {activeTab === 'apparence' && (
        <div className="space-y-3">
          <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Sun className="h-4 w-4" />
                </div>
                Theme et Affichage
              </CardTitle>
              <CardDescription>Personnalisez l'interface de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sun className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Mode clair / sombre</p>
                    <p className="text-xs text-muted-foreground">Basculer entre les themes</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              <Separator className="border-border/30" />
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Langue de l'interface</p>
                    <p className="text-xs text-muted-foreground">Choisir la langue d'affichage</p>
                  </div>
                </div>
                <Select defaultValue="fr" onValueChange={() => toast.info('Langue modifiee')}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Francais</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator className="border-border/30" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Couleur principale</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: 'Bleu',  color: 'hsl(221 83% 53%)', active: true },
                    { name: 'Vert',  color: 'hsl(142 71% 45%)', active: false },
                    { name: 'Ambre', color: 'hsl(38 92% 50%)',  active: false },
                    { name: 'Rose',  color: 'hsl(0 84% 60%)',   active: false },
                  ].map((c) => (
                    <button
                      key={c.name}
                      className={cn(
                        'flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all hover:scale-105',
                        c.active ? 'border-primary shadow-md shadow-primary/10' : 'border-border/40 hover:border-muted-foreground/30'
                      )}
                      onClick={() => toast.info(`Theme ${c.name} selectionne`)}
                    >
                      <div className="h-9 w-9 rounded-full shadow-md" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-semibold">{c.name}</span>
                      {c.active && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      )}

      {/* ── NOTIFICATIONS ─────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Bell className="h-4 w-4" />
                </div>
                Preferences de notifications
              </CardTitle>
              <CardDescription>Choisissez les alertes que vous souhaitez recevoir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {NOTIF_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                const key = item.key as keyof typeof notifSettings;
                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.bg, item.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider transition-colors',
                            notifSettings[key]
                              ? 'text-chart-2 bg-chart-2/10 border-chart-2/30'
                              : 'text-muted-foreground bg-muted/30 border-border/30'
                          )}
                        >
                          {notifSettings[key] ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={notifSettings[key]}
                          onCheckedChange={(v) => {
                            setNotifSettings({ ...notifSettings, [item.key]: v });
                            toast.success(`${item.label} ${v ? 'activee' : 'desactivee'}`);
                          }}
                        />
                      </div>
                    </div>
                    {idx < NOTIF_ITEMS.length - 1 && <Separator className="border-border/20 mx-3" />}
                  </div>
                );
              })}
            </CardContent>
          </GlassCard>
        </div>
      )}

      {/* ── TAUX DE CHANGE ────────────────────────────────────── */}
      {activeTab === 'taux-change' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1 border-b border-[var(--border-default)]/50">
            <div className="text-xs text-muted-foreground font-medium">
              {TAUX_DATA.length} devise{TAUX_DATA.length > 1 ? 's' : ''} · Reference USD
            </div>
            <NeonButton size="icon" className="h-8 w-8 rounded-lg shadow-sm" title="Ajouter un taux">
              <Plus className="h-3.5 w-3.5" />
            </NeonButton>
          </div>
          <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-[var(--border-default)]/50">
                      <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Devise</th>
                      <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Taux (1 USD =)</th>
                      <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Evolution</th>
                      <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Source</th>
                      <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Mis a jour</th>
                      <th className="py-3.5 px-4 w-[60px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {TAUX_DATA.map((t) => (
                      <tr key={t.devise} className="border-b border-border/30 hover:bg-muted/40 transition-all duration-200 group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 shrink-0">
                              {t.devise}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{t.nom}</p>
                              <p className="text-xs text-muted-foreground font-mono">{t.devise}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold">{t.taux}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className={cn(
                            'text-[11px] font-semibold border',
                            t.up
                              ? 'text-chart-2 bg-chart-2/10 border-chart-2/30'
                              : 'text-destructive bg-destructive/10 border-destructive/30'
                          )}>
                            <TrendingUp className={cn('h-3 w-3 mr-1', !t.up && 'rotate-180')} />
                            {t.trend}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs font-medium">{t.source}</td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">{t.date}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <NeonButton variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => toast.info(`Modifier le taux ${t.devise}`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </NeonButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      )}

      {/* ── IA GEMINI ─────────────────────────────────────────── */}
      {activeTab === 'ia-gemini' && (
        <div className="space-y-3">
          {/* Gemini badge */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-chart-2/10 border border-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Powered by Google Gemini</p>
              <p className="text-xs text-muted-foreground">Intelligence artificielle pour l'extraction, la detection et le rapprochement automatiques</p>
            </div>
            <Badge className="bg-chart-2/15 text-chart-2 border-chart-2/30 border shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-chart-2 mr-1.5 animate-pulse" />
              Actif
            </Badge>
          </div>

          <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                Configuration IA (Gemini OCR)
              </CardTitle>
              <CardDescription>Parametres de l'intelligence artificielle pour l'extraction automatique des donnees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { title: 'Extraction Automatique (OCR)',    desc: 'Pre-remplissage des champs comptables via Gemini Vision',                            icon: Eye,      color: 'text-primary',    bg: 'bg-primary/10',    key: 'ocr' },
                { title: "Detection d'Anomalies Avancee",  desc: 'Alerte IA sur des montants ou frequences inhabituels',                               icon: Activity, color: 'text-amber-500',  bg: 'bg-amber-500/10',  key: 'anomalies' },
                { title: 'Smart Matching Bancaire',         desc: 'Rapprochement automatique intelligent entre paiements et factures',                  icon: Zap,      color: 'text-purple-500', bg: 'bg-purple-500/10', key: 'matching' },
              ].map((item, idx, arr) => {
                const Icon = item.icon;
                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.bg, item.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch defaultChecked onCheckedChange={(v) => toast.success(`${item.title} ${v ? 'active' : 'desactive'}`)} />
                    </div>
                    {idx < arr.length - 1 && <Separator className="border-border/20 mx-3" />}
                  </div>
                );
              })}

              <Separator className="border-border/30 my-1" />

              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Seuil de confiance minimal pour la validation automatique
                </Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input type="number" defaultValue={95} min={50} max={100} className="w-20 h-8 text-sm font-mono" />
                  <span className="text-sm text-muted-foreground font-medium">%</span>
                  <span className="text-xs text-muted-foreground ml-auto">(recommande : 90-98%)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Cle API Gemini
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    defaultValue="AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="h-8 text-sm font-mono flex-1"
                    readOnly
                  />
                  <NeonButton variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </NeonButton>
                  <NeonButton variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={() => toast.success('Cle API testee avec succes')}>
                    Tester
                  </NeonButton>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      )}

      {/* ── SECURITE ──────────────────────────────────────────── */}
      {activeTab === 'securite' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-chart-2/10 text-chart-2 border border-chart-2/20">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Systeme securise</p>
              <p className="text-xs opacity-80">Chiffrement actif · Logs d'acces actives · Dernier scan : aujourd'hui 08:00</p>
            </div>
            <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/30 shrink-0">Securise</Badge>
          </div>

          <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                Securite &amp; Sauvegardes
              </CardTitle>
              <CardDescription>Gerez la securite de votre base de donnees et les sauvegardes automatiques</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">Authentification a double facteur (2FA)</p>
                      <Badge className="text-[9px] bg-destructive/10 text-destructive border border-destructive/30 uppercase font-bold tracking-wider py-0">Obligatoire</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Renforcer l'acces aux donnees sensibles (administrateurs)</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator className="border-border/20 mx-3" />

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Sauvegardes Automatiques Cloud</p>
                    <p className="text-xs text-muted-foreground">Frequence de sauvegarde dans le Cloud securise</p>
                  </div>
                </div>
                <Select defaultValue="quotidien">
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horaire">Chaque heure</SelectItem>
                    <SelectItem value="quotidien">Quotidienne</SelectItem>
                    <SelectItem value="hebdo">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="border-border/20 mx-3" />

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <ServerCog className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Expiration de session</p>
                    <p className="text-xs text-muted-foreground">Deconnexion automatique apres inactivite</p>
                  </div>
                </div>
                <Select defaultValue="60">
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="240">4 heures</SelectItem>
                    <SelectItem value="0">Jamais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="border-border/20 mx-3" />

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Sauvegarde manuelle</p>
                    <p className="text-xs text-muted-foreground">Declencher une sauvegarde immediate</p>
                  </div>
                </div>
                <NeonButton variant="outline" size="sm" className="h-8 text-xs" onClick={() => toast.success('Sauvegarde declenchee avec succes')}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Lancer
                </NeonButton>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      )}

      {/* Dossier edit dialog */}
      <Dialog open={!!editingDossier} onOpenChange={(o) => !o && setEditingDossier(null)}>
        <DialogContent className="sm:max-w-lg border-muted/50 shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary" />
          {editingDossier && (
            <>
              <DialogHeader className="pt-4">
                <DialogTitle className="flex items-center gap-2.5 text-xl">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  Modifier le dossier
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Raison sociale</Label>
                  <Input value={editingDossier.raisonSociale} onChange={(e) => setEditingDossier({ ...editingDossier, raisonSociale: e.target.value })} className="bg-muted/20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sigle</Label>
                    <Input value={editingDossier.sigle} onChange={(e) => setEditingDossier({ ...editingDossier, sigle: e.target.value })} className="bg-muted/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Devise</Label>
                    <Select value={editingDossier.devise} onValueChange={(v) => setEditingDossier({ ...editingDossier, devise: v })}>
                      <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CDF">CDF</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Adresse</Label>
                  <Input value={editingDossier.adresse} onChange={(e) => setEditingDossier({ ...editingDossier, adresse: e.target.value })} className="bg-muted/20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">RCCM</Label>
                    <Input value={editingDossier.rccm} onChange={(e) => setEditingDossier({ ...editingDossier, rccm: e.target.value })} className="bg-muted/20 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">ID National</Label>
                    <Input value={editingDossier.idNat} onChange={(e) => setEditingDossier({ ...editingDossier, idNat: e.target.value })} className="bg-muted/20 font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Compte Client (411)</Label>
                    <Input placeholder="ex: 411ENT" value={editingDossier.compteClient || ''} onChange={(e) => setEditingDossier({ ...editingDossier, compteClient: e.target.value })} className="bg-muted/20 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Compte Fournisseur (401)</Label>
                    <Input placeholder="ex: 401ENT" value={editingDossier.compteFournisseur || ''} onChange={(e) => setEditingDossier({ ...editingDossier, compteFournisseur: e.target.value })} className="bg-muted/20 font-mono" />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2 border-t border-border/30">
                <DialogClose asChild>
                  <NeonButton variant="ghost">Annuler</NeonButton>
                </DialogClose>
                <NeonButton onClick={() => saveDossier(editingDossier)} className="shadow-md">
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </NeonButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

