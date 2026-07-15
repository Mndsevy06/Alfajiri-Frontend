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
  AlertTriangle,
  Navigation,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        // By default, select the first circuit if 'all' isn't explicitly wanted by user logic.
        // Actually, let's stick to the first circuit if any exists.
        setSelectedCircuitId(circuitsData[0].id);
      }

      if (expeditionsData.length > 0 && !selected) {
        setSelected(expeditionsData[0]);
      } else if (selected) {
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

  // Derived state based on selected circuit
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

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isLoading && expeditions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Chargement du suivi logistique dynamique...</p>
      </div>
    );
  }

  if (circuits.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-center">
        <div className="bg-muted p-6 rounded-full">
          <Settings className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Aucun circuit logistique configuré</h2>
        <p className="text-muted-foreground max-w-md">
          Pour commencer à suivre des expéditions, vous devez d'abord paramétrer au moins un circuit (ex: Import Asie, Livraison Locale).
        </p>
        <Link href="/logistique/configuration">
          <Button size="lg" className="mt-4">
            <Settings className="mr-2 h-4 w-4" />
            Aller à la Configuration
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Suivi Logistique
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Suivi des expéditions selon vos circuits paramétrés.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/logistique/configuration">
            <Button variant="outline" className="shrink-0">
              <Settings className="h-4 w-4 mr-2" />
              Configurer
            </Button>
          </Link>
          <Button variant="outline" onClick={fetchData} disabled={isLoading} className="shrink-0 group">
            <RefreshCw className={cn("h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500", isLoading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Circuit Selector & Filters */}
      <Card className="shadow-sm border-muted/60 overflow-hidden">
        <div className="bg-muted/20 absolute inset-0 pointer-events-none" />
        <CardContent className="p-4 relative">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full md:w-auto">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Circuit Logistique</label>
              <Select value={selectedCircuitId} onValueChange={(val) => { setSelectedCircuitId(val); setFilterEtape('all'); }}>
                <SelectTrigger className="w-full bg-background shadow-sm border-primary/20 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {circuits.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 w-full md:w-auto">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ID, Responsable, Réf..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background shadow-sm transition-all focus:ring-2"
                />
              </div>
            </div>

            <div className="flex-1 w-full md:w-auto">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Filtrer par Étape</label>
              <Select value={filterEtape} onValueChange={setFilterEtape}>
                <SelectTrigger className="w-full bg-background shadow-sm">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les étapes</SelectItem>
                  {currentEtapes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards (Dynamic based on selected circuit's steps) */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {counts.map((s, idx) => (
          <motion.div
            key={s.id}
            className="min-w-[140px] snap-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card 
              className={cn(
                "hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden relative h-full",
                filterEtape === s.id && "ring-2 ring-primary border-primary"
              )} 
              onClick={() => setFilterEtape(filterEtape === s.id ? 'all' : s.id)}
            >
              <div className={cn("absolute inset-x-0 top-0 h-1", s.couleur_badge.split(' ')[0])} />
              <CardContent className="pt-5 pb-4">
                <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg mb-2', s.couleur_badge)}>
                  <Truck className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{s.count}</p>
                <p className="text-xs text-muted-foreground font-medium line-clamp-2">{s.nom}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* List of Expeditions */}
        <motion.div 
          className="xl:col-span-2 space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {filteredExpeditions.map((exp) => {
              const etape = exp.etape_actuelle_detail;
              const isSelected = selected?.id === exp.id;
              
              return (
                <motion.div
                  key={exp.id}
                  layout
                  variants={itemVariants}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 hover:shadow-md border-l-4 overflow-hidden',
                      isSelected ? 'shadow-md border-l-primary bg-primary/5' : 'border-l-transparent hover:border-l-primary/50'
                    )}
                    onClick={() => setSelected(exp)}
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 shadow-sm', etape?.couleur_badge || 'bg-muted text-muted-foreground', isSelected && "ring-4 ring-primary/20")}>
                          <Truck className="h-7 w-7" />
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-lg text-foreground">{exp.identifiant}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="font-medium text-foreground/80">{exp.responsable}</span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                                {exp.transporteur}
                              </p>
                            </div>
                            <Badge variant="outline" className={cn('shrink-0 px-3 py-1 font-medium', etape?.couleur_badge, "border-current/20")}>
                              {etape ? etape.nom : 'Non démarré'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-3 bg-muted/30 rounded-xl text-sm border border-muted/50">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Document Réf.</p>
                              <p className="font-mono font-medium truncate">{exp.document_reference || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Charge</p>
                              <p className="font-medium">{exp.chargement}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Transport</p>
                              <p className="font-medium">{formatCurrency(exp.facture_transport)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Douane</p>
                              <p className="font-medium">{exp.frais_douane ? formatCurrency(exp.frais_douane) : '-'}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-muted-foreground flex items-center gap-1.5 font-medium bg-muted/50 px-2 py-1 rounded-md">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {exp.position || 'Position inconnue'}
                              </span>
                              <span className="font-bold text-primary">{exp.progression}%</span>
                            </div>
                            <Progress value={exp.progression} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredExpeditions.length === 0 && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-10">
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-10 w-10 opacity-40" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Aucune expédition trouvée</h3>
                  <p className="mt-1">Essayez de modifier vos filtres ou sélectionnez un autre circuit.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Selected Expedition Detail Panel */}
        <div className="xl:sticky xl:top-24 h-fit">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-xl border-primary/10 overflow-hidden relative">
                  <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                  <CardHeader className="pb-4 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                          <Navigation className="h-6 w-6 text-primary fill-primary/20" />
                          {selected.identifiant}
                        </CardTitle>
                        <CardDescription className="mt-1.5 text-base font-medium flex items-center gap-2">
                          {selected.responsable}
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{selected.transporteur}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* TIMELINE DYNAMIQUE */}
                    <div className="py-4 px-2 relative">
                      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-muted rounded-full" />
                      
                      <div className="space-y-0">
                        {currentEtapes.map((etape, i) => {
                          // Find index of current step
                          const currentEtapeId = selected.etape_actuelle;
                          const currentEtapeIndex = currentEtapes.findIndex(e => e.id === currentEtapeId);
                          
                          // If currentEtapeIndex is -1, it means not started (done=false, current=false)
                          // if i < currentEtapeIndex -> done
                          // if i === currentEtapeIndex -> current
                          let done = false;
                          let current = false;

                          if (currentEtapeIndex !== -1) {
                            if (i < currentEtapeIndex) done = true;
                            if (i === currentEtapeIndex) current = true;
                            // If current step is final, we might want to mark it as done too
                            if (current && etape.est_finale) {
                              done = true;
                              current = false; // it's completely finished
                            }
                          }

                          const isLast = i === currentEtapes.length - 1;
                          
                          return (
                            <div key={etape.id} className="relative flex items-center gap-4 py-3 group">
                              {/* Connector line for active state */}
                              {done && !isLast && (
                                <div className="absolute left-4 top-10 w-0.5 h-6 bg-primary z-0" />
                              )}
                              
                              {/* Step Node */}
                              <div className={cn(
                                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full shrink-0 border-2 transition-all duration-300',
                                done ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' : 
                                current ? 'bg-background border-primary text-primary ring-4 ring-primary/20 shadow-sm' :
                                'bg-background border-muted-foreground/30 text-muted-foreground'
                              )}>
                                {done ? <CheckCircle2 className="h-4 w-4" /> : 
                                 current ? <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" /> :
                                 <Clock className="h-3.5 w-3.5 opacity-50" />}
                              </div>
                              
                              {/* Step Content */}
                              <div className={cn(
                                "flex-1 transition-all duration-300",
                                current ? "translate-x-1" : ""
                              )}>
                                <p className={cn(
                                  'text-sm font-semibold', 
                                  done ? 'text-foreground' : current ? 'text-primary' : 'text-muted-foreground'
                                )}>{etape.nom}</p>
                                {current && (
                                  <motion.p 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"
                                  >
                                    En cours de traitement <span className="flex space-x-1"><span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span></span>
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl space-y-3 border border-muted/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Départ
                        </span>
                        <span className="font-semibold">{selected.date_depart ? formatDateTime(selected.date_depart) : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Position Actuelle
                        </span>
                        <span className="font-semibold text-right">{selected.position || 'N/A'}</span>
                      </div>
                      {selected.date_arrivee && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-muted">
                          <span className="text-success flex items-center gap-2 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Arrivée
                          </span>
                          <span className="font-bold text-success">{formatDateTime(selected.date_arrivee)}</span>
                        </div>
                      )}
                    </div>

                    {selected.etape_actuelle_detail?.est_finale && (
                      <div className="flex items-center gap-3 p-4 rounded-xl border transition-colors bg-success/10 border-success/20 text-success-foreground">
                        <div className="bg-success/20 p-2 rounded-full">
                          <ShieldCheck className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-success">Circuit Terminé</p>
                          <p className="text-xs text-success/80 mt-0.5">Toutes les étapes ont été validées.</p>
                        </div>
                      </div>
                    )}

                    <Button
                      size="lg"
                      className={cn(
                        "w-full font-bold shadow-lg transition-all duration-300",
                        selected.etape_actuelle_detail?.est_finale
                          ? 'bg-muted text-muted-foreground hover:bg-muted shadow-none cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/90 hover:shadow-primary/25 hover:-translate-y-0.5'
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
                          Valider l'étape courante
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-dashed border-2 h-full min-h-[400px] flex items-center justify-center bg-transparent">
                  <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                      <MapPin className="h-10 w-10 opacity-30" />
                    </div>
                    <p className="text-lg font-medium">Sélectionnez une expédition</p>
                    <p className="text-sm mt-1 max-w-[200px]">Pour voir les détails et suivre la progression</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
