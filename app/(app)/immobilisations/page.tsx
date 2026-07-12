'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Download,
  Calculator,
  Trash2,
  Pencil,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { IMMOBILISATIONS, SITES } from '@/lib/mock-data';
import type { Immobilisation } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function ImmobilisationsPage() {
  const [immos, setImmos] = useState<Immobilisation[]>(IMMOBILISATIONS);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [simulating, setSimulating] = useState<Immobilisation | null>(null);
  const [form, setForm] = useState({
    code: '',
    libelle: '',
    categorie: 'Materiel de transport',
    valeurAcquisition: '',
    duree: '5',
    methode: 'lineaire' as 'lineaire' | 'degressive',
    site: 'lubumbashi' as string,
    dateAcquisition: new Date().toISOString().split('T')[0],
  });

  const filtered = useMemo(() => {
    return immos.filter(
      (i) =>
        i.libelle.toLowerCase().includes(search.toLowerCase()) ||
        i.code.toLowerCase().includes(search.toLowerCase()) ||
        i.categorie.toLowerCase().includes(search.toLowerCase())
    );
  }, [immos, search]);

  const totalAcquisition = immos.reduce((s, i) => s + i.valeurAcquisition, 0);
  const totalAmortissement = immos.reduce((s, i) => s + i.cumulAmortissement, 0);
  const totalVNC = immos.reduce((s, i) => s + i.vnc, 0);
  const totalDotation = immos.reduce((s, i) => s + i.dotationAnnuelle, 0);

  const handleCreate = () => {
    const valeur = parseFloat(form.valeurAcquisition);
    const duree = parseInt(form.duree);
    if (!form.libelle || !valeur || !duree) {
      toast.error('Veuillez renseigner tous les champs obligatoires');
      return;
    }
    const newImmo: Immobilisation = {
      id: `i${Date.now()}`,
      code: form.code || `IM-${String(immos.length + 1).padStart(3, '0')}`,
      libelle: form.libelle,
      categorie: form.categorie,
      dateAcquisition: form.dateAcquisition,
      valeurAcquisition: valeur,
      duree,
      methode: form.methode,
      cumulAmortissement: 0,
      vnc: valeur,
      dotationAnnuelle: valeur / duree,
      site: form.site as Immobilisation['site'],
    };
    setImmos([newImmo, ...immos]);
    toast.success('Immobilisation creee', { description: newImmo.libelle });
    setDialogOpen(false);
    setForm({ code: '', libelle: '', categorie: 'Materiel de transport', valeurAcquisition: '', duree: '5', methode: 'lineaire', site: 'lubumbashi', dateAcquisition: new Date().toISOString().split('T')[0] });
  };

  const generateDotations = () => {
    toast.success('Dotations injectees', {
      description: `${formatCurrency(totalDotation)} dans le journal OD`,
    });
  };

  const getAmortissementPlan = (immo: Immobilisation) => {
    const annuite = immo.valeurAcquisition / immo.duree;
    const plan = [];
    let cumul = 0;
    let vnc = immo.valeurAcquisition;
    for (let an = 1; an <= immo.duree; an++) {
      cumul += annuite;
      vnc -= annuite;
      plan.push({ an, annuite, cumul, vnc: Math.max(0, vnc) });
    }
    return plan;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Immobilisations</h1>
          <p className="text-muted-foreground mt-1">
            Registre des actifs - Plans d'amortissement - Generation de dotations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success('Registre exporte')}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={generateDotations}>
            <Calculator className="h-4 w-4 mr-2" />
            Generer dotations
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle immo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur d'acquisition</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(totalAcquisition)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cumul amortissements</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(totalAmortissement)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VNC totale</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(totalVNC)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                <Calculator className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dotation annuelle</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(totalDotation)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code, libelle ou categorie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Code</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Libelle</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Categorie</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Site</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Acquisition</th>
                  <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Valeur</th>
                  <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Cumul Amort.</th>
                  <th className="text-right py-3 px-2 font-semibold text-muted-foreground">VNC</th>
                  <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Amorti a</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const amortPct = (i.cumulAmortissement / i.valeurAcquisition) * 100;
                  const site = SITES.find((s) => s.id === i.site);
                  return (
                    <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-2 font-mono font-medium">{i.code}</td>
                      <td className="py-3 px-2">{i.libelle}</td>
                      <td className="py-3 px-2 text-muted-foreground">{i.categorie}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">
                          {site?.short}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{formatDate(i.dateAcquisition)}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatCurrency(i.valeurAcquisition)}</td>
                      <td className="py-3 px-2 text-right font-mono text-muted-foreground">{formatCurrency(i.cumulAmortissement)}</td>
                      <td className="py-3 px-2 text-right font-mono font-semibold">{formatCurrency(i.vnc)}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Progress value={amortPct} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground">{Math.round(amortPct)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSimulating(i)}>
                            <Calculator className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info('Edition...')}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => {
                              setImmos(immos.filter((x) => x.id !== i.id));
                              toast.success('Immobilisation supprimee');
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle immobilisation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Libelle</Label>
              <Input
                placeholder="ex: Camion Mercedes Actros"
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Materiel de transport">Materiel de transport</SelectItem>
                    <SelectItem value="Batiments">Batiments</SelectItem>
                    <SelectItem value="Logiciels">Logiciels</SelectItem>
                    <SelectItem value="Mobilier">Mobilier</SelectItem>
                    <SelectItem value="Installations techniques">Installations techniques</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Site</Label>
                <Select value={form.site} onValueChange={(v) => setForm({ ...form, site: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SITES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valeur d'acquisition (USD)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.valeurAcquisition}
                  onChange={(e) => setForm({ ...form, valeurAcquisition: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duree (annees)</Label>
                <Input
                  type="number"
                  value={form.duree}
                  onChange={(e) => setForm({ ...form, duree: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date d'acquisition</Label>
                <Input
                  type="date"
                  value={form.dateAcquisition}
                  onChange={(e) => setForm({ ...form, dateAcquisition: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Methode</Label>
                <Select value={form.methode} onValueChange={(v) => setForm({ ...form, methode: v as 'lineaire' | 'degressive' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lineaire">Lineaire</SelectItem>
                    <SelectItem value="degressif">Degressif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.valeurAcquisition && form.duree && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dotation annuelle</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(parseFloat(form.valeurAcquisition) / parseInt(form.duree))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreate}>Creer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!simulating} onOpenChange={(o) => !o && setSimulating(null)}>
        <DialogContent className="sm:max-w-lg">
          {simulating && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Plan d'amortissement - {simulating.code}
                </DialogTitle>
                <CardDescription>{simulating.libelle} - Methode {simulating.methode}</CardDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Valeur</p>
                    <p className="font-mono font-semibold">{formatCurrency(simulating.valeurAcquisition)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Duree</p>
                    <p className="font-mono font-semibold">{simulating.duree} ans</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Dotation/an</p>
                    <p className="font-mono font-semibold">{formatCurrency(simulating.dotationAnnuelle)}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Annee</th>
                        <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Dotation</th>
                        <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Cumul</th>
                        <th className="text-right py-2 px-2 font-semibold text-muted-foreground">VNC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAmortissementPlan(simulating).map((row) => (
                        <tr key={row.an} className="border-b border-border/50">
                          <td className="py-2 px-2 font-medium">An {row.an}</td>
                          <td className="py-2 px-2 text-right font-mono">{formatCurrency(row.annuite)}</td>
                          <td className="py-2 px-2 text-right font-mono text-muted-foreground">{formatCurrency(row.cumul)}</td>
                          <td className="py-2 px-2 text-right font-mono font-semibold">{formatCurrency(row.vnc)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
