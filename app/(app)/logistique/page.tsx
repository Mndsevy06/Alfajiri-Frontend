'use client';

import { useState } from 'react';
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
import { CAMIONS } from '@/lib/mock-data';
import type { Camion } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUTS = [
  { value: 'chargement', label: 'En chargement', color: 'bg-muted text-muted-foreground' },
  { value: 'transit_zambie', label: 'Transit Zambie', color: 'bg-primary/10 text-primary' },
  { value: 'douane_zambie', label: 'Douane Zambie', color: 'bg-warning/10 text-warning' },
  { value: 'douane_rdc', label: 'Douane RDC', color: 'bg-warning/10 text-warning' },
  { value: 'transit_rdc', label: 'Transit RDC', color: 'bg-chart-4/10 text-chart-4' },
  { value: 'arrive_sabri', label: 'Arrive Sabri', color: 'bg-success/10 text-success' },
  { value: 'decharge', label: 'Decharge', color: 'bg-success/10 text-success' },
];

const ETAPE_LABELS = ['Chargement', 'Transit Zambie', 'Douane Zambie', 'Douane RDC', 'Transit RDC', 'Arrive Sabri'];

export default function LogistiquePage() {
  const [camions, setCamions] = useState<Camion[]>(CAMIONS);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [selected, setSelected] = useState<Camion | null>(camions[0] || null);

  const filtered = camions.filter((c) => {
    const matchSearch =
      c.immat.toLowerCase().includes(search.toLowerCase()) ||
      c.chauffeur.toLowerCase().includes(search.toLowerCase()) ||
      c.bl.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const counts = STATUTS.map((s) => ({
    ...s,
    count: camions.filter((c) => c.statut === s.value).length,
  }));

  const validerPassage = (cam: Camion) => {
    const nextStatut: Record<string, string> = {
      chargement: 'transit_zambie',
      transit_zambie: 'douane_zambie',
      douane_zambie: 'douane_rdc',
      douane_rdc: 'transit_rdc',
      transit_rdc: 'arrive_sabri',
      arrive_sabri: 'decharge',
    };
    const newStatut = nextStatut[cam.statut];
    if (!newStatut) return;
    const updated = camions.map((c) =>
      c.id === cam.id ? { ...c, statut: newStatut as Camion['statut'], progression: cam.progression + 15 } : c
    );
    setCamions(updated);
    setSelected(updated.find((c) => c.id === cam.id) || null);
    toast.success('Passage valide', { description: `${cam.immat} -> ${STATUTS.find((s) => s.value === newStatut)?.label}` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Suivi Logistique</h1>
        <p className="text-muted-foreground mt-1">
          Chaine transfrontaliere Zambie vers RDC - Anti-fraude logistique/comptable
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {counts.map((s) => (
          <Card key={s.value} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterStatut(filterStatut === s.value ? 'all' : s.value)}>
            <CardContent className="pt-5 pb-4">
              <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg mb-2', s.color)}>
                <Truck className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs text-muted-foreground truncate">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par immat, chauffeur, BL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-full sm:w-56">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((cam) => {
            const statut = STATUTS.find((s) => s.value === cam.statut)!;
            return (
              <Card
                key={cam.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selected?.id === cam.id && 'ring-2 ring-primary'
                )}
                onClick={() => setSelected(cam)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl shrink-0', statut.color)}>
                      <Truck className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-lg">{cam.immat}</p>
                          <p className="text-sm text-muted-foreground">{cam.chauffeur} - {cam.transporteur}</p>
                        </div>
                        <Badge className={cn('shrink-0', statut.color)}>{statut.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">BL</p>
                          <p className="font-mono font-medium">{cam.bl}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Chargement</p>
                          <p className="font-medium">{cam.chargement} t</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Transport</p>
                          <p className="font-medium">{formatCurrency(cam.factureTransport)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Douane</p>
                          <p className="font-medium">{cam.douaneMontant ? formatCurrency(cam.douaneMontant) : '-'}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cam.position}
                          </span>
                          <span className="font-medium">{cam.progression}%</span>
                        </div>
                        <Progress value={cam.progression} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun camion trouve</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:sticky lg:top-20 h-fit">
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  {selected.immat}
                </CardTitle>
                <CardDescription>{selected.chauffeur}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {ETAPE_LABELS.map((etape, i) => {
                    const statutIndex = STATUTS.findIndex((s) => s.value === selected.statut);
                    const done = i <= statutIndex;
                    const current = i === statutIndex;
                    return (
                      <div key={etape} className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full shrink-0 border-2 transition-colors',
                          done ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground',
                          current && 'ring-4 ring-primary/20'
                        )}>
                          {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className={cn('text-sm font-medium', !done && 'text-muted-foreground')}>{etape}</p>
                          {current && <p className="text-xs text-primary">En cours</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Depart</span>
                    <span className="font-medium">{formatDateTime(selected.dateDepart)}</span>
                  </div>
                  {selected.dateArrivee && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Arrivee</span>
                      <span className="font-medium">{formatDateTime(selected.dateArrivee)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Position</span>
                    <span className="font-medium text-right">{selected.position}</span>
                  </div>
                </div>

                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg',
                  selected.statut === 'arrive_sabri' || selected.statut === 'decharge'
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                )}>
                  {selected.statut === 'arrive_sabri' || selected.statut === 'decharge' ? (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      <p className="text-sm font-medium">Passage valide - Paiement autorise</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5" />
                      <p className="text-sm font-medium">Paiement bloque - Passage non valide</p>
                    </>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => validerPassage(selected)}
                  disabled={selected.statut === 'decharge'}
                >
                  {selected.statut === 'decharge' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Voyage termine
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Valider le passage
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Selectionnez un camion</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
