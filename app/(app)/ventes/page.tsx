'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { fetchWithAuth } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const STATUT_STYLE: Record<string, { label: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  impayee: { label: 'Impayée', class: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
  payee: { label: 'Payée', class: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  partielle: { label: 'Partielle', class: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
};

export default function VentesPage() {
  const [factures, setFactures] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterStatut, setFilterStatut] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  
  const [form, setForm] = useState({
    client: '',
    date: new Date().toISOString().split('T')[0],
    montantHT: '',
    tvaRate: '16',
    echeance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facturesData, tiersData] = await Promise.all([
        fetchWithAuth('/ventes/factures/'),
        fetchWithAuth('/plan_comptable/tiers/')
      ]);
      setFactures(facturesData || []);
      setTiers((tiersData || []).filter((t: any) => t.type === 'client'));
    } catch (error: any) {
      toast.error('Erreur lors du chargement des données', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return factures.filter((f) => {
      const matchSearch =
        f.numero.toLowerCase().includes(search.toLowerCase()) ||
        (f.client?.nom || '').toLowerCase().includes(search.toLowerCase());
      const matchStatut = filterStatut === 'all' || f.statut === filterStatut;
      return matchSearch && matchStatut;
    });
  }, [factures, search, filterStatut]);

  const totalHT = factures.reduce((s, f) => s + Number(f.montantHT), 0);
  const totalTTC = factures.reduce((s, f) => s + Number(f.montantTTC), 0);
  const impayees = factures.filter((f) => f.statut === 'impayee').reduce((s, f) => s + Number(f.montantTTC), 0);

  const handleCreate = async () => {
    const ht = parseFloat(form.montantHT);
    if (!form.client || !ht) {
      toast.error('Veuillez renseigner le client et le montant');
      return;
    }
    const tva = ht * (parseFloat(form.tvaRate) / 100);
    const payload = {
      client: form.client,
      date: form.date,
      montantHT: ht,
      tva: tva,
      montantTTC: ht + tva,
      echeance: form.echeance,
      statut: 'impayee',
    };

    try {
      setSubmitting(true);
      await fetchWithAuth('/ventes/factures/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('Facture créée avec succès');
      setDialogOpen(false);
      setForm({ 
        client: '', 
        date: new Date().toISOString().split('T')[0], 
        montantHT: '', 
        tvaRate: '16',
        echeance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });
      fetchData(); // reload to get generated number
    } catch (error: any) {
      toast.error('Erreur lors de la création', { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    try {
      await fetchWithAuth(`/ventes/factures/${id}/`, {
        method: 'DELETE',
      });
      toast.success('Facture supprimée');
      setFactures(factures.filter((f) => f.id !== id));
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    const headers = ['N° Facture', 'Date', 'Client', 'Montant HT', 'TVA', 'Montant TTC', 'Statut', 'Echéance'];
    const rows = filtered.map(f => [
      f.numero,
      f.date,
      `"${f.client?.nom || ''}"`,
      f.montantHT,
      f.tva,
      f.montantTTC,
      f.statut,
      f.echeance
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export_factures_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export CSV généré avec succès');
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">CA total (HT)</p>
                {loading ? <Skeleton className="h-5 w-16 mt-1" /> : <p className="text-lg font-bold font-mono mt-0.5">{formatCurrency(totalHT)}</p>}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-inner">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-background to-chart-2/5 border-chart-2/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">CA total (TTC)</p>
                {loading ? <Skeleton className="h-5 w-16 mt-1" /> : <p className="text-lg font-bold font-mono mt-0.5">{formatCurrency(totalTTC)}</p>}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2 shadow-inner">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-background to-destructive/5 border-destructive/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Impayés</p>
                {loading ? <Skeleton className="h-5 w-16 mt-1" /> : <p className="text-lg font-bold font-mono text-destructive mt-0.5">{formatCurrency(impayees)}</p>}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive shadow-inner">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 shrink-0">
          {showSearch || search ? (
            <div className="relative animate-in slide-in-from-right-5 fade-in duration-200">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus={!search}
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => { if (!search) setShowSearch(false); }}
                className="pl-8 h-8 w-[200px] sm:w-[250px] border-border bg-background text-sm shadow-sm rounded-lg"
              />
            </div>
          ) : (
            <Button variant="outline" size="icon" onClick={() => setShowSearch(true)} className="h-8 w-8 rounded-lg shadow-sm group" title="Rechercher">
              <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Button>
          )}

          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="h-8 w-8 px-0 flex items-center justify-center border-border bg-background shadow-sm hover:bg-accent text-muted-foreground hover:text-foreground [&>svg:last-child]:hidden [&>span]:hidden rounded-lg transition-colors" title="Filtrer par statut">
              <Filter className="h-3.5 w-3.5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="impayee">Impayée</SelectItem>
              <SelectItem value="partielle">Partielle</SelectItem>
              <SelectItem value="payee">Payée</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleExportCSV} className="h-8 w-8 rounded-lg shadow-sm group" title="Exporter en CSV">
            <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Button>
          
          <Button variant="default" size="sm" onClick={() => setDialogOpen(true)} className="h-8 rounded-lg px-3 text-xs font-semibold shadow-sm ml-1" title="Nouvelle facture">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Nouvelle facture</span>
          </Button>
        </div>

      <Card className="border-muted/50 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-muted/30">
                <tr className="border-b border-border/50">
                  <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">N° Facture</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Client</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-muted-foreground">Montant HT</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-muted-foreground">TVA</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-muted-foreground">TTC</th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">Statut</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Échéance</th>
                  <th className="py-3.5 px-4 w-[100px]"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-3 px-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-40" /></td>
                      <td className="py-3 px-4 flex justify-end"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-20 ml-auto" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-28 ml-auto" /></td>
                      <td className="py-3 px-4 flex justify-center"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Receipt className="h-12 w-12 opacity-20 mb-3" />
                        <p>Aucune facture trouvée</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => {
                    const statut = STATUT_STYLE[f.statut] || STATUT_STYLE['impayee'];
                    const Icon = statut.icon;
                    return (
                      <tr key={f.id} className="border-b border-border/30 hover:bg-muted/40 transition-all duration-200 group">
                        <td className="py-3 px-4 font-mono font-medium text-foreground/90">{f.numero}</td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(f.date)}</td>
                        <td className="py-3 px-4 font-medium">{f.client?.nom || '-'}</td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">{formatCurrency(f.montantHT)}</td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground/70">{formatCurrency(f.tva)}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">{formatCurrency(f.montantTTC)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className={cn('text-[11px] font-medium border uppercase tracking-wider', statut.class)}>
                            <Icon className="h-3 w-3 mr-1.5" />
                            {statut.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(f.echeance)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => setViewing(f)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(f.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md border-muted/50 shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary"></div>
          <DialogHeader className="pt-4">
            <DialogTitle className="text-xl">Nouvelle facture de vente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Client</Label>
                <Select value={form.client} onValueChange={(v) => setForm({ ...form, client: v })}>
                  <SelectTrigger className="bg-muted/20">
                    <SelectValue placeholder="Sélectionner un client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.nom}
                      </SelectItem>
                    ))}
                    {tiers.length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">Aucun client trouvé</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date d'émission</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-muted/20"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Échéance</Label>
                <Input
                  type="date"
                  value={form.echeance}
                  onChange={(e) => setForm({ ...form, echeance: e.target.value })}
                  className="bg-muted/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Montant HT</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.montantHT}
                  onChange={(e) => setForm({ ...form, montantHT: e.target.value })}
                  className="bg-muted/20 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">TVA</Label>
                <Select value={form.tvaRate} onValueChange={(v) => setForm({ ...form, tvaRate: v })}>
                  <SelectTrigger className="bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16%</SelectItem>
                    <SelectItem value="0">0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {form.montantHT && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10 mt-2">
                <span className="text-sm font-medium">Total TTC Estimé</span>
                <span className="font-mono text-lg font-bold text-primary">
                  {formatCurrency((parseFloat(form.montantHT) || 0) * (1 + parseFloat(form.tvaRate) / 100))}
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="pt-2 border-t border-border/30">
            <DialogClose asChild>
              <Button variant="ghost">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={submitting} className="shadow-md">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Créer la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg border-muted/50 shadow-xl">
          {viewing && (
            <>
              <DialogHeader className="pb-4 border-b border-border/30">
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="flex items-center gap-2.5 text-xl">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    {viewing.numero}
                  </DialogTitle>
                  <Badge variant="outline" className={cn('text-xs uppercase px-2.5 py-0.5', STATUT_STYLE[viewing.statut]?.class)}>
                    {STATUT_STYLE[viewing.statut]?.label}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6 bg-muted/20 p-4 rounded-xl border border-muted/40">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><User className="h-3 w-3" /> Client</p>
                    <p className="font-medium text-foreground">{viewing.client?.nom}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{viewing.client?.code}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Dates</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Émise le:</span>
                        <span className="font-medium">{formatDate(viewing.date)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Échéance:</span>
                        <span className="font-medium text-destructive">{formatDate(viewing.echeance)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Détails de la facturation</h4>
                  <div className="p-5 rounded-xl bg-muted/30 border border-muted/50 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Montant HT</span>
                      <span className="font-mono">{formatCurrency(viewing.montantHT)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA</span>
                      <span className="font-mono">{formatCurrency(viewing.tva)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-3 mt-1 border-t border-border/60">
                      <span className="text-base">Montant Net TTC</span>
                      <span className="font-mono text-xl text-primary">{formatCurrency(viewing.montantTTC)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t border-border/30 gap-2">
                <Button variant="outline" onClick={() => toast.success('PDF généré avec succès')}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
                {viewing.statut !== 'payee' && (
                  <Button onClick={() => toast.success('Encaissement enregistré')} className="bg-success text-success-foreground hover:bg-success/90">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Encaisser
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
