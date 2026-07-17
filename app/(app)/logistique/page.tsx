'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent } from '@/components/ui/card';
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

  // Render Loading State
  if (isLoading && expeditions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Initialisation du tableau de bord...</p>
      </div>
    );
  }

  // Render No Circuit State
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
          <Button size="lg" className="mt-4 rounded-full px-8">
            <Settings className="mr-2 h-4 w-4" />
            Créer un Circuit
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* 1. TOP HEADER & FILTERS */}
      <div className="shrink-0 space-y-2 pb-2">
        {/* Actions & Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Select value={selectedCircuitId} onValueChange={(val) => { setSelectedCircuitId(val); setFilterEtape('all'); }}>
              <SelectTrigger className="w-[180px] bg-background/50 h-8 text-xs border-border shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {circuits.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-[200px] text-xs bg-background/50 shadow-none border-border"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/logistique/configuration">
              <Button variant="outline" size="sm" className="h-8 text-xs px-3 shadow-none">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Configurer
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="h-8 text-xs px-3 shadow-none group">
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5 group-hover:rotate-180 transition-transform duration-500", isLoading && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* KPI Compact Cards */}
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x hide-scrollbar items-center">
          {counts.map((s, idx) => (
            <motion.div
              key={s.id}
              className="min-w-[140px] snap-start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                onClick={() => setFilterEtape(filterEtape === s.id ? 'all' : s.id)}
                className={cn(
                  "cursor-pointer transition-shadow hover:shadow-md",
                  filterEtape === s.id ? "bg-primary/5 border-primary/40" : "bg-background/40 backdrop-blur-sm border-white/10 shadow-sm"
                )}
              >
                <CardContent className="p-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate" title={s.nom}>{s.nom}</span>
                    <span className="text-base font-bold leading-none mt-1">{s.count}</span>
                  </div>
                  <div className={cn("p-1.5 rounded-md flex-shrink-0", s.couleur_badge)}>
                    <Truck className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 2. KANBAN BOARD (Horizontal Scroll) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 hide-scrollbar">
        <div className="flex gap-4 h-full min-w-max items-start">
          {currentEtapes.map((etape) => {
            const expeditionsInEtape = filteredExpeditions.filter(exp => exp.etape_actuelle === etape.id);
            const isFiltered = filterEtape !== 'all' && filterEtape !== etape.id;
            
            if (isFiltered) return null;

            return (
              <div key={etape.id} className="w-[320px] flex flex-col h-full bg-muted/30 rounded-3xl p-3 border border-border/40">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", etape.couleur_badge.split(' ')[0])} />
                    <h3 className="font-bold text-sm">{etape.nom}</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full font-mono text-xs bg-background/50">{expeditionsInEtape.length}</Badge>
                </div>
                
                {/* Column Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
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
                          "bg-card rounded-2xl p-4 cursor-pointer shadow-sm border border-border/50 hover:shadow-md transition-all",
                          selected?.id === exp.id && "ring-2 ring-primary border-primary"
                        )}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <p className="font-bold text-sm truncate pr-2">{exp.identifiant}</p>
                          {etape.est_finale && (
                            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                          )}
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            <span className="truncate">{exp.responsable}</span>
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Truck className="h-3 w-3 opacity-60" />
                            <span className="truncate">{exp.transporteur}</span>
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/40">
                          <span className="text-[10px] font-semibold bg-muted px-2 py-1 rounded-md text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exp.position || 'N/A'}
                          </span>
                          <span className="text-xs font-bold text-primary">{exp.progression}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {expeditionsInEtape.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground/60 border-2 border-dashed border-border/50 rounded-2xl">
                      Aucune expédition
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MASTER-DETAIL SLIDING PANEL (Glassmorphism Overlay) */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40"
            />
            
            {/* Sliding Drawer */}
            <motion.div
              layoutId={`card-${selected.id}`}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card/95 backdrop-blur-2xl border-l shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div>
                  <h2 className="text-2xl font-extrabold flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    {selected.identifiant}
                  </h2>
                  <Badge variant="outline" className={cn("mt-2 rounded-full", selected.etape_actuelle_detail?.couleur_badge)}>
                    {selected.etape_actuelle_detail?.nom || 'Étape Inconnue'}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 hover:bg-muted" onClick={() => setSelected(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* Info Bento Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 p-4 rounded-2xl border border-border/30">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Responsable</p>
                    <p className="font-semibold text-sm">{selected.responsable}</p>
                  </div>
                  <div className="bg-muted/40 p-4 rounded-2xl border border-border/30">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Transporteur</p>
                    <p className="font-semibold text-sm">{selected.transporteur}</p>
                  </div>
                  <div className="bg-muted/40 p-4 rounded-2xl border border-border/30">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Charge</p>
                    <p className="font-semibold text-sm">{selected.chargement}</p>
                  </div>
                  <div className="bg-muted/40 p-4 rounded-2xl border border-border/30">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Document Réf.</p>
                    <p className="font-semibold text-sm font-mono">{selected.document_reference || '-'}</p>
                  </div>
                </div>

                {/* Timeline Visual (Vertical) */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 pl-1">Parcours</h3>
                  <div className="relative pl-6 space-y-6">
                    <div className="absolute left-8 top-2 bottom-2 w-0.5 bg-border/50 rounded-full" />
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
                        <div key={etape.id} className="relative flex items-center gap-4 group">
                          {/* Circle Node */}
                          <div className={cn(
                            'relative z-10 flex h-5 w-5 items-center justify-center rounded-full shrink-0 border-2 transition-all duration-300 bg-card',
                            done ? 'border-primary' : 
                            current ? 'border-primary ring-4 ring-primary/20 scale-125' :
                            'border-border/60'
                          )}>
                            {done ? <div className="h-2 w-2 rounded-full bg-primary" /> : 
                             current ? <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" /> : null}
                          </div>
                          
                          <div className="flex-1 bg-muted/20 p-3 rounded-xl border border-border/30 group-hover:bg-muted/40 transition-colors">
                            <p className={cn(
                              'text-sm font-bold', 
                              done ? 'text-foreground' : current ? 'text-primary' : 'text-muted-foreground'
                            )}>{etape.nom}</p>
                            {current && (
                              <p className="text-xs text-primary/80 font-medium mt-1">En cours...</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financials Bento */}
                <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 mb-3">Coûts Logistiques</h3>
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
              <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-md">
                <Button
                  size="lg"
                  className={cn(
                    "w-full font-bold shadow-lg rounded-xl h-14 text-base transition-all duration-300",
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
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
