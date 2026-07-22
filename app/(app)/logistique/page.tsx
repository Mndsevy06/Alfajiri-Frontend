'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Clock,
  Search,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Settings,
  X,
  Package,
  Route,
  Gauge,
  Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardContent } from '@/components/ui/card';
import { GlassCard, Button as NeonButton } from '@/components/ui/Layout';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api';
import type { Expedition, CircuitLogistique, EtapeCircuit } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LogistiquePage() {
  const [circuits, setCircuits] = useState<CircuitLogistique[]>([]);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('all');

  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterEtape, setFilterEtape] = useState('all');
  const [selected, setSelected] = useState<Expedition | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [circuitsData, expeditionsData] = await Promise.all([
        fetchWithAuth('/logistique/circuits/'),
        fetchWithAuth('/logistique/expeditions/')
      ]);

      setCircuits(circuitsData);
      setExpeditions(expeditionsData);

      if (circuitsData.length > 0 && selectedCircuitId === 'all') {
        setSelectedCircuitId(circuitsData[0].id);
      }

      if (selected) {
        const updatedSelected = expeditionsData.find((e: Expedition) => e.id === selected.id);
        if (updatedSelected) setSelected(updatedSelected);
      }
    } catch (error: any) {
      toast.error('Erreur', { description: "Impossible de charger les données logistiques." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validerPassage = async (exp: Expedition) => {
    try {
      setIsUpdating(true);
      const updatedExpedition = await fetchWithAuth(`/logistique/expeditions/${exp.id}/valider_passage/`, {
        method: 'POST',
      });

      setExpeditions(expeditions.map(e => e.id === updatedExpedition.id ? updatedExpedition : e));
      setSelected(updatedExpedition);

      toast.success('Passage validé', { description: `${exp.identifiant} est maintenant à : ${updatedExpedition.etape_actuelle_detail?.nom || 'Étape validée'}` });
    } catch (error: any) {
      toast.error('Erreur', { description: error.message || "Échec de la validation du passage." });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentCircuit = circuits.find(c => c.id === selectedCircuitId);
  const currentEtapes = currentCircuit?.etapes || [];

  const filteredExpeditions = expeditions.filter((exp) => {
    const matchCircuit = selectedCircuitId === 'all' || exp.circuit === selectedCircuitId;
    const matchSearch =
      exp.identifiant.toLowerCase().includes(search.toLowerCase()) ||
      exp.responsable.toLowerCase().includes(search.toLowerCase()) ||
      (exp.document_reference && exp.document_reference.toLowerCase().includes(search.toLowerCase()));
    const matchEtape = filterEtape === 'all' || exp.etape_actuelle === filterEtape;
    return matchCircuit && matchSearch && matchEtape;
  });

  const counts = currentEtapes.map((etape) => ({
    ...etape,
    count: expeditions.filter((exp) => exp.etape_actuelle === etape.id).length,
  }));

  // KPI cards
  const totalExpeditions = expeditions.length;
  const enTransit = expeditions.filter(e => !e.etape_actuelle_detail?.est_finale).length;
  const livrees = expeditions.filter(e => e.etape_actuelle_detail?.est_finale).length;
  const progressionMoy = totalExpeditions > 0
    ? Math.round(expeditions.reduce((acc, e) => acc + e.progression, 0) / totalExpeditions)
    : 0;

  const KPIS = [
    {
      title: 'Total Expéditions',
      value: totalExpeditions.toString(),
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'En Transit',
      value: enTransit.toString(),
      icon: Truck,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10 text-amber-500',
    },
    {
      title: 'Livrées',
      value: livrees.toString(),
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      title: 'Progression Moy.',
      value: `${progressionMoy}%`,
      icon: Gauge,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10 text-violet-500',
    },
  ];

  // Loading state
  if (isLoading && expeditions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Initialisation du tableau de bord...</p>
      </div>
    );
  }

  // No circuit state
  if (circuits.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-center">
        <div className="bg-muted p-6 rounded-3xl shadow-inner">
          <Settings className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Aucun circuit logistique</h2>
        <p className="text-muted-foreground max-w-md">
          Paramétrez au moins un circuit pour commencer à suivre vos expéditions sur le Kanban interactif.
        </p>
        <Link href="/logistique/configuration">
          <NeonButton size="lg" className="mt-4 rounded-full px-8">
            <Settings className="mr-2 h-4 w-4" />
            Créer un Circuit
          </NeonButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* ── 1. KPIs ── */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
                <div className="flex flex-col overflow-hidden w-full">
                  <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{kpi.title}</span>
                  <span className={cn("text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 truncate", kpi.color)}>{kpi.value}</span>
                </div>
                <div className={cn("p-1 sm:p-1.5 rounded-md shrink-0", kpi.bgColor)}>
                  <kpi.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ── 2. Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-[var(--border-default)]/50 mb-1 relative">
        {/* Gauche: circuit selector + info */}
        <div className="flex items-center gap-2">
          <Select value={selectedCircuitId} onValueChange={(val) => { setSelectedCircuitId(val); setFilterEtape('all'); }}>
            <SelectTrigger className="w-[180px] bg-[var(--bg-secondary)]/40 h-8 text-xs border-border shadow-none rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {circuits.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground font-medium hidden sm:block">
            {filteredExpeditions.length} expédition{filteredExpeditions.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Droite: search, filter, config, refresh */}
        <div className="flex items-center gap-2 shrink-0">
          {showSearch || search ? (
            <div className="relative animate-in slide-in-from-right-5 fade-in duration-200">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus={!search}
                placeholder="Rechercher (ID, Resp.)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => { if (!search) setShowSearch(false); }}
                className="pl-8 h-8 w-[200px] sm:w-[250px] border-border bg-background text-sm shadow-sm rounded-lg"
              />
            </div>
          ) : (
            <NeonButton variant="outline" size="icon" onClick={() => setShowSearch(true)} className="h-8 w-8 rounded-lg shadow-sm group" title="Rechercher">
              <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </NeonButton>
          )}

          <Select value={filterEtape} onValueChange={setFilterEtape}>
            <SelectTrigger className="h-8 w-8 px-0 flex items-center justify-center border-border bg-background shadow-sm hover:bg-accent text-muted-foreground hover:text-foreground [&>svg:last-child]:hidden [&>span]:hidden rounded-lg transition-colors" title="Filtrer par étape">
              <Filter className="h-3.5 w-3.5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les étapes</SelectItem>
              {currentEtapes.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link href="/logistique/configuration">
            <NeonButton variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm group" title="Configurer">
              <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </NeonButton>
          </Link>

          <NeonButton variant="outline" size="icon" onClick={fetchData} disabled={isLoading} className="h-8 w-8 rounded-lg shadow-sm group" title="Actualiser">
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-all duration-500", isLoading && "animate-spin")} />
          </NeonButton>
        </div>
      </div>

      {/* ── 3. Pipeline Steps ── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 sm:gap-2">
        {counts.map((s, idx) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <GlassCard glow={false}
              onClick={() => setFilterEtape(filterEtape === s.id ? 'all' : s.id)}
              className={cn(
                "cursor-pointer transition-shadow hover:shadow-md",
                filterEtape === s.id ? "bg-primary/5 border-primary/40" : "bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm"
              )}
            >
              <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
                <div className="flex flex-col overflow-hidden w-full">
                  <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate" title={s.nom}>{s.nom}</span>
                  <span className={cn("text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 truncate", s.couleur_badge.split(' ')[1])}>{s.count}</span>
                </div>
                <div className={cn("p-1 sm:p-1.5 rounded-md flex-shrink-0", s.couleur_badge)}>
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ── 4. Kanban Board ── */}
      <div className="overflow-x-auto overflow-y-hidden pb-4 no-scrollbar -mx-1 px-1">
        <div className="flex gap-3 min-w-max items-start pt-1">
          {currentEtapes.map((etape) => {
            const expeditionsInEtape = filteredExpeditions.filter(exp => exp.etape_actuelle === etape.id);
            const isFiltered = filterEtape !== 'all' && filterEtape !== etape.id;

            if (isFiltered) return null;

            return (
              <div key={etape.id} className="w-[300px] flex flex-col max-h-[calc(100vh-26rem)] bg-[var(--bg-secondary)]/30 rounded-xl p-2.5 border border-[var(--border-default)]/40">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1.5">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", etape.couleur_badge.split(' ')[0])} />
                    <h3 className="font-bold text-xs">{etape.nom}</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full font-mono text-[10px] h-5 px-1.5 bg-[var(--bg-secondary)]/60">{expeditionsInEtape.length}</Badge>
                </div>

                {/* Column Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  <AnimatePresence>
                    {expeditionsInEtape.map((exp) => (
                      <motion.div
                        key={exp.id}
                        layoutId={`card-${exp.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -2 }}
                        onClick={() => setSelected(exp)}
                        className={cn(
                          "bg-[var(--bg-primary)] rounded-xl p-3 cursor-pointer shadow-sm border border-[var(--border-default)]/50 hover:shadow-md transition-all",
                          selected?.id === exp.id && "ring-2 ring-primary border-primary"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-sm truncate pr-2">{exp.identifiant}</p>
                          {etape.est_finale && (
                            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                          )}
                        </div>

                        <div className="space-y-1.5 mb-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            <span className="truncate">{exp.responsable}</span>
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Truck className="h-3 w-3 opacity-60" />
                            <span className="truncate">{exp.transporteur}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]/30">
                          <span className="text-[10px] font-semibold bg-muted/60 px-2 py-0.5 rounded-md text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exp.position || 'N/A'}
                          </span>
                          <span className="text-xs font-bold text-primary">{exp.progression}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {expeditionsInEtape.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/60 border-2 border-dashed border-[var(--border-default)]/50 rounded-xl">
                      Aucune expédition
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Detail Sliding Panel ── */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              layoutId={`card-${selected.id}`}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--bg-primary)]/95 backdrop-blur-2xl border-l border-[var(--border-default)] shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)]/50">
                <div>
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    {selected.identifiant}
                  </h2>
                  <Badge variant="outline" className={cn("mt-1.5 rounded-full text-xs", selected.etape_actuelle_detail?.couleur_badge)}>
                    {selected.etape_actuelle_detail?.nom || 'Étape Inconnue'}
                  </Badge>
                </div>
                <NeonButton variant="ghost" size="icon" className="rounded-full bg-muted/50 hover:bg-muted h-8 w-8" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </NeonButton>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Responsable', value: selected.responsable },
                    { label: 'Transporteur', value: selected.transporteur },
                    { label: 'Chargement', value: selected.chargement },
                    { label: 'Document Réf.', value: selected.document_reference || '-', mono: true },
                  ].map((item) => (
                    <div key={item.label} className="bg-[var(--bg-secondary)]/60 p-3 rounded-xl border border-[var(--border-default)]/30">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">{item.label}</p>
                      <p className={cn("font-semibold text-sm truncate", item.mono && "font-mono")}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">Parcours</h3>
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-8 top-2 bottom-2 w-0.5 bg-[var(--border-default)]/50 rounded-full" />
                    {currentEtapes.map((etape, i) => {
                      const currentEtapeIndex = currentEtapes.findIndex(e => e.id === selected.etape_actuelle);
                      let done = false;
                      let current = false;

                      if (currentEtapeIndex !== -1) {
                        if (i < currentEtapeIndex) done = true;
                        if (i === currentEtapeIndex) current = true;
                        if (current && etape.est_finale) {
                          done = true;
                          current = false;
                        }
                      }

                      return (
                        <div key={etape.id} className="relative flex items-center gap-3 group">
                          {/* Circle Node */}
                          <div className={cn(
                            'relative z-10 flex h-5 w-5 items-center justify-center rounded-full shrink-0 border-2 transition-all duration-300 bg-[var(--bg-primary)]',
                            done ? 'border-primary' :
                            current ? 'border-primary ring-4 ring-primary/20 scale-125' :
                            'border-[var(--border-default)]'
                          )}>
                            {done ? <div className="h-2 w-2 rounded-full bg-primary" /> :
                             current ? <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" /> : null}
                          </div>

                          <div className="flex-1 bg-[var(--bg-secondary)]/30 p-2.5 rounded-lg border border-[var(--border-default)]/30 group-hover:bg-[var(--bg-secondary)]/50 transition-colors">
                            <p className={cn(
                              'text-sm font-bold',
                              done ? 'text-foreground' : current ? 'text-primary' : 'text-muted-foreground'
                            )}>{etape.nom}</p>
                            {current && (
                              <p className="text-xs text-primary/80 font-medium mt-0.5">En cours...</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financials */}
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 mb-2.5">Coûts Logistiques</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Transport</span>
                      <span className="font-bold">{formatCurrency(selected.facture_transport)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Douane</span>
                      <span className="font-bold">{selected.frais_douane ? formatCurrency(selected.frais_douane) : '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 border-t border-[var(--border-default)]/50 bg-[var(--bg-secondary)]/40 backdrop-blur-md">
                <NeonButton
                  size="lg"
                  className={cn(
                    "w-full font-bold shadow-lg rounded-xl h-12 text-sm transition-all duration-300",
                    selected.etape_actuelle_detail?.est_finale
                      ? 'bg-muted text-muted-foreground hover:bg-muted shadow-none cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 hover:scale-[1.02]'
                  )}
                  onClick={() => validerPassage(selected)}
                  disabled={selected.etape_actuelle_detail?.est_finale || isUpdating}
                >
                  {isUpdating ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : selected.etape_actuelle_detail?.est_finale ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Terminé
                    </>
                  ) : (
                    <>
                      Valider l'étape
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </NeonButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
