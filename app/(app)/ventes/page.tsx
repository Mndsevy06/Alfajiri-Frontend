'use client';

import { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Eye,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { FACTURES, TIERS } from '@/lib/mock-data';
import type { Facture } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUT_STYLE: Record<string, { label: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  impayee: { label: 'Impayee', class: 'bg-destructive/10 text-destructive', icon: AlertCircle },
  payee: { label: 'Payee', class: 'bg-success/10 text-success', icon: CheckCircle2 },
  partielle: { label: 'Partielle', class: 'bg-warning/10 text-warning', icon: Clock },
};

export default function VentesPage() {
  const [factures, setFactures] = useState<Facture[]>(FACTURES);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Facture | null>(null);
  const [form, setForm] = useState({
    client: '',
    date: new Date().toISOString().split('T')[0],
    montantHT: '',
    tvaRate: '16',
  });

  const filtered = useMemo(() => {
    return factures.filter((f) => {
      const matchSearch =
        f.numero.toLowerCase().includes(search.toLowerCase()) ||
        f.client.toLowerCase().includes(search.toLowerCase());
      const matchStatut = filterStatut === 'all' || f.statut === filterStatut;
      return matchSearch && matchStatut;
    });
  }, [factures, search, filterStatut]);

  const totalHT = factures.reduce((s, f) => s + f.montantHT, 0);
  const totalTTC = factures.reduce((s, f) => s + f.montantTTC, 0);
  const impayees = factures.filter((f) => f.statut === 'impayee').reduce((s, f) => s + f.montantTTC, 0);

  const handleCreate = () => {
    const ht = parseFloat(form.montantHT);
    if (!form.client || !ht) {
      toast.error('Veuillez renseigner le client et le montant');
      return;
    }
    const tva = ht * (parseFloat(form.tvaRate) / 100);
    const newFacture: Facture = {
      id: `f${Date.now()}`,
      numero: `FAC-VTE-2025-${String(99 + factures.length).padStart(4, '0')}`,
      date: form.date,
      client: form.client,
      montantHT: ht,
      tva,
      montantTTC: ht + tva,
      statut: 'impayee',
      echeance: new Date(new Date(form.date).getTime() + 30 * 86400000).toISOString().split('T')[0],
    };
    setFactures([newFacture, ...factures]);
    toast.success('Facture creee', { description: newFacture.numero });
    setDialogOpen(false);
    setForm({ client: '', date: new Date().toISOString().split('T')[0], montantHT: '', tvaRate: '16' });
  };

  const handleDelete = (id: string) => {
    setFactures(factures.filter((f) => f.id !== id));
    toast.success('Facture supprimee');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Ventes & Facturation</h1>
          <p className="text-muted-foreground mt-1">
            Facturation conforme RDC - Suivi des encaissements - Lettrage client
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success('Export CSV genere')}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA total (HT)</p>
                <p className="text-2xl font-bold font-mono">{formatCurrency(totalHT)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA total (TTC)</p>
                <p className="text-2xl font-bold font-mono">{formatCurrency(totalTTC)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impayes</p>
                <p className="text-2xl font-bold font-mono text-destructive">{formatCurrency(impayees)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numero ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="impayee">Impayee</SelectItem>
                <SelectItem value="partielle">Partielle</SelectItem>
                <SelectItem value="payee">Payee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">N Facture</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Client</th>
                  <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Montant HT</th>
                  <th className="text-right py-3 px-2 font-semibold text-muted-foreground">TVA</th>
                  <th className="text-right py-3 px-2 font-semibold text-muted-foreground">TTC</th>
                  <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Statut</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Echeance</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const statut = STATUT_STYLE[f.statut];
                  const Icon = statut.icon;
                  return (
                    <tr key={f.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-2 font-mono font-medium">{f.numero}</td>
                      <td className="py-3 px-2">{formatDate(f.date)}</td>
                      <td className="py-3 px-2">{f.client}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatCurrency(f.montantHT)}</td>
                      <td className="py-3 px-2 text-right font-mono text-muted-foreground">{formatCurrency(f.tva)}</td>
                      <td className="py-3 px-2 text-right font-mono font-semibold">{formatCurrency(f.montantTTC)}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge className={cn('text-xs', statut.class)}>
                          <Icon className="h-3 w-3 mr-1" />
                          {statut.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{formatDate(f.echeance)}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewing(f)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info('Edition de la facture...')}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(f.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">Aucune facture trouvee</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle facture de vente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={form.client} onValueChange={(v) => setForm({ ...form, client: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un client..." />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.filter((t) => t.type === 'client').map((t) => (
                    <SelectItem key={t.code} value={t.nom}>
                      {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Montant HT (USD)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.montantHT}
                  onChange={(e) => setForm({ ...form, montantHT: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Taux TVA (%)</Label>
                <Select value={form.tvaRate} onValueChange={(v) => setForm({ ...form, tvaRate: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16% (RDC standard)</SelectItem>
                    <SelectItem value="0">0% (Export)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.montantHT && (
              <div className="p-3 rounded-lg bg-muted space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant HT</span>
                  <span className="font-mono">{formatCurrency(parseFloat(form.montantHT) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA ({form.tvaRate}%)</span>
                  <span className="font-mono">{formatCurrency((parseFloat(form.montantHT) || 0) * (parseFloat(form.tvaRate) / 100))}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-border">
                  <span>Total TTC</span>
                  <span className="font-mono">{formatCurrency((parseFloat(form.montantHT) || 0) * (1 + parseFloat(form.tvaRate) / 100))}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreate}>Creer la facture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {viewing.numero}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Client</p>
                    <p className="font-medium">{viewing.client}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</p>
                    <p className="font-medium">{formatDate(viewing.date)}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Montant HT</span>
                    <span className="font-mono">{formatCurrency(viewing.montantHT)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA (16%)</span>
                    <span className="font-mono">{formatCurrency(viewing.tva)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Total TTC</span>
                    <span className="font-mono text-lg">{formatCurrency(viewing.montantTTC)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Echeance</p>
                    <p className="font-medium">{formatDate(viewing.echeance)}</p>
                  </div>
                  <Badge className={STATUT_STYLE[viewing.statut].class}>
                    {STATUT_STYLE[viewing.statut].label}
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => toast.success('PDF genere')}>
                  <Download className="h-4 w-4 mr-2" />
                  Telecharger PDF
                </Button>
                <Button onClick={() => toast.success('Encaissement enregistre')}>
                  Encaisser
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
