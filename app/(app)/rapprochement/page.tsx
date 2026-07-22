'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Landmark,
  Upload,
  Check,
  X,
  Link2,
  Sparkles,
  FileText,
  Download,
  ArrowRight,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard, Button as NeonButton } from '@/components/ui/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface LigneReleve {
  id: string;
  date: string;
  libelle: string;
  reference: string;
  montant: number;
  sens: 'debit' | 'credit';
  pointe: boolean;
}

interface LigneCompta {
  id: string;
  date: string;
  libelle: string;
  compte_numero: string;
  ecriture_numero: string;
  debit: number;
  credit: number;
  pointe: boolean;
}

export default function RapprochementPage() {
  const [releve, setReleve] = useState<LigneReleve[]>([]);
  const [compta, setCompta] = useState<LigneCompta[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReleveIds, setSelectedReleveIds] = useState<Set<string>>(new Set());
  const [selectedComptaIds, setSelectedComptaIds] = useState<Set<string>>(new Set());

  // OD Modal states
  const [odModalOpen, setOdModalOpen] = useState(false);
  const [odReleveId, setOdReleveId] = useState<string | null>(null);
  const [odCompte, setOdCompte] = useState("627");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [releveData, comptaData] = await Promise.all([
        fetchWithAuth('/rapprochement/releve/'),
        fetchWithAuth('/rapprochement/compta/?compte=521')
      ]);
      setReleve(releveData);
      setCompta(comptaData);
      setSelectedReleveIds(new Set());
      setSelectedComptaIds(new Set());
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Importation en cours...');
    try {
      const res = await fetchWithAuth('/rapprochement/import/', {
        method: 'POST',
        body: formData,
      });
      toast.success(res.message || 'Fichier importé avec succès', { id: toastId });
      loadData();
    } catch (error: any) {
      toast.error('Erreur lors de l\'import', { description: error.message, id: toastId });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSelectReleve = (id: string) => {
    const newSet = new Set(selectedReleveIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedReleveIds(newSet);
  };

  const toggleSelectCompta = (id: string) => {
    const newSet = new Set(selectedComptaIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedComptaIds(newSet);
  };

  const selectedReleveLines = releve.filter(r => selectedReleveIds.has(r.id));
  const selectedComptaLines = compta.filter(c => selectedComptaIds.has(c.id));

  // Totaux sélectionnés
  const totalReleveSel = selectedReleveLines.reduce((s, r) => s + (r.sens === 'credit' ? Number(r.montant) : -Number(r.montant)), 0);
  const totalComptaSel = selectedComptaLines.reduce((s, c) => s + (Number(c.debit) - Number(c.credit)), 0);
  
  const ecartSelection = Math.abs(totalReleveSel - totalComptaSel);
  const isSelectionBalanced = (selectedReleveIds.size > 0 || selectedComptaIds.size > 0) && ecartSelection < 0.01;

  const handleManualReconcile = async () => {
    if (!isSelectionBalanced) return;
    
    const toastId = toast.loading('Lettrage en cours...');
    try {
      await fetchWithAuth('/rapprochement/lettrer/', {
        method: 'POST',
        body: JSON.stringify({
          releve_ids: Array.from(selectedReleveIds),
          compta_ids: Array.from(selectedComptaIds)
        }),
      });
      toast.success('Lettrage validé avec succès', { id: toastId });
      loadData();
    } catch (error: any) {
      toast.error('Erreur lors du lettrage', { description: error.message, id: toastId });
    }
  };

  const handleAutoReconcile = async () => {
    const toastId = toast.loading('Lettrage automatique en cours...');
    try {
      const res = await fetchWithAuth('/rapprochement/lettrage-auto/', { method: 'POST' });
      toast.success(res.message || 'Lettrage auto terminé', { id: toastId });
      loadData();
    } catch (error: any) {
      toast.error('Erreur', { description: error.message, id: toastId });
    }
  };

  const handleGenerateODClick = (releveId: string) => {
    setOdReleveId(releveId);
    setOdModalOpen(true);
  };

  const confirmGenerateOD = async () => {
    if (!odReleveId || !odCompte) return;

    const toastId = toast.loading('Génération OD...');
    setOdModalOpen(false);
    try {
      const res = await fetchWithAuth('/rapprochement/generer-od/', {
        method: 'POST',
        body: JSON.stringify({
          releve_id: odReleveId,
          compte_od: odCompte,
          compte_banque: '521'
        }),
      });
      toast.success(`OD générée: ${res.ecriture_numero}`, { id: toastId });
      loadData();
    } catch (error: any) {
      toast.error('Erreur', { description: error.message, id: toastId });
    }
    setOdReleveId(null);
  };

  const totalReleveMvt = releve.reduce((s, r) => s + Number(r.montant), 0);
  const totalComptaMvt = compta.reduce((s, c) => s + (Number(c.debit) > 0 ? Number(c.debit) : Number(c.credit)), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Saisie-style Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <GlassCard className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow" glow={false}>
          <div className="p-3 sm:p-4 flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">Lignes Relevé</span>
              <span className="text-xl sm:text-2xl font-black font-mono mt-1 text-primary truncate">{releve.length}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 shadow-inner">
              <Landmark className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow" glow={false}>
          <div className="p-3 sm:p-4 flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">Lignes Compta</span>
              <span className="text-xl sm:text-2xl font-black font-mono mt-1 text-chart-4 truncate">{compta.length}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-chart-4/10 text-chart-4 shrink-0 shadow-inner">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow" glow={false}>
          <div className="p-3 sm:p-4 flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">Total Relevé</span>
              <span className="text-lg sm:text-xl font-bold font-mono mt-1 text-foreground truncate">{formatCurrency(totalReleveMvt)}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0 shadow-inner">
              <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow" glow={false}>
          <div className="p-3 sm:p-4 flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">Total Compta</span>
              <span className="text-lg sm:text-xl font-bold font-mono mt-1 text-foreground truncate">{formatCurrency(totalComptaMvt)}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0 shadow-inner">
              <ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Header Actions */}
      <div className="flex justify-end gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".csv"
          />
          <NeonButton variant="outline" className="h-10 px-4 rounded-xl shadow-sm transition-all flex items-center text-sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Upload className="h-4 w-4 mr-2 text-indigo-400" />
            Importer CSV
          </NeonButton>
          <NeonButton variant="outline" className="h-10 px-4 rounded-xl shadow-sm transition-all flex items-center text-sm" onClick={handleAutoReconcile} disabled={loading}>
            <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
            Lettrage auto
          </NeonButton>
          <NeonButton variant="outline" className="h-10 w-10 p-0 rounded-xl shadow-sm transition-all flex items-center justify-center" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
          </NeonButton>
        </div>
      </div>

      {/* Selected Totals Banner */}
      {(selectedReleveIds.size > 0 || selectedComptaIds.size > 0) && (
        <GlassCard className={cn(
          "p-5 flex flex-col sm:flex-row sm:items-center justify-between border-l-4 shadow-xl transition-all duration-300", 
          isSelectionBalanced ? "border-l-success bg-success/5 shadow-success/10" : "border-l-warning bg-warning/5 shadow-warning/10"
        )} glow={false}>
          <div className="flex gap-8 mb-4 sm:mb-0">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Relevé ({selectedReleveIds.size})</p>
              <p className="text-xl font-bold font-mono mt-1 text-foreground">{formatCurrency(totalReleveSel)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Compta ({selectedComptaIds.size})</p>
              <p className="text-xl font-bold font-mono mt-1 text-foreground">{formatCurrency(totalComptaSel)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Écart</p>
              <p className={cn('text-2xl font-black font-mono mt-0.5', ecartSelection < 0.01 ? 'text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]')}>
                {formatCurrency(ecartSelection)}
              </p>
            </div>
          </div>
          {isSelectionBalanced && (
            <NeonButton variant="primary" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 hover:from-emerald-600 hover:to-teal-700 h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20" onClick={handleManualReconcile}>
              <Check className="h-5 w-5 mr-2" />
              Valider le Rapprochement
            </NeonButton>
          )}
        </GlassCard>
      )}

      {/* Main Grid: Relevé vs Compta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relevé Bancaire */}
        <GlassCard glow={false} className="flex flex-col h-[600px] border-t border-t-white/5 shadow-xl hover:shadow-primary/5 transition-shadow">
          <div className="p-4 sm:p-5 border-b border-[var(--border-default)]/50 flex items-center justify-between bg-gradient-to-b from-primary/5 to-transparent rounded-t-2xl">
            <div>
              <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" />
                Relevé bancaire
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Opérations en banque non pointées</p>
            </div>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">
              {releve.length} lignes
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto scrollbar-thin">
            {loading ? (
               <div className="flex justify-center items-center h-full"><RefreshCw className="w-8 h-8 text-primary/50 animate-spin" /></div>
            ) : (
            <div className="space-y-2">
              {releve.length === 0 && <div className="text-center py-12 text-muted-foreground">Aucune ligne non lettrée</div>}
              {releve.map((r) => {
                const isSelected = selectedReleveIds.has(r.id);
                return (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer group',
                    isSelected 
                      ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                      : 'border-[var(--border-default)]/30 bg-[var(--bg-secondary)]/40 hover:bg-[var(--bg-secondary)] hover:border-[var(--border-default)]/50'
                  )}
                  onClick={() => toggleSelectReleve(r.id)}
                >
                  <button
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-colors',
                      isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 group-hover:border-primary/50'
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground/90">{r.libelle}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(r.date)} {r.reference ? `• Ref: ${r.reference}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-mono font-bold text-sm flex items-center justify-end gap-1', r.sens === 'debit' ? 'text-rose-400' : 'text-emerald-400')}>
                      {r.sens === 'debit' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      {formatCurrency(Number(r.montant))}
                    </p>
                  </div>
                </div>
              )})}
            </div>
            )}
          </div>
        </GlassCard>

        {/* Comptabilité */}
        <GlassCard glow={false} className="flex flex-col h-[600px] border-t border-t-white/5 shadow-xl hover:shadow-chart-4/5 transition-shadow">
          <div className="p-4 sm:p-5 border-b border-[var(--border-default)]/50 flex items-center justify-between bg-gradient-to-b from-chart-4/5 to-transparent rounded-t-2xl">
            <div>
              <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-chart-4" />
                Comptabilité (Trésorerie)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Écritures non pointées</p>
            </div>
            <span className="text-xs bg-chart-4/10 text-chart-4 border border-chart-4/20 px-2.5 py-1 rounded-full font-bold">
              {compta.length} lignes
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto scrollbar-thin">
             {loading ? (
               <div className="flex justify-center items-center h-full"><RefreshCw className="w-8 h-8 text-chart-4/50 animate-spin" /></div>
            ) : (
            <div className="space-y-2">
              {compta.length === 0 && <div className="text-center py-12 text-muted-foreground">Aucune ligne non lettrée</div>}
              {compta.map((c) => {
                const isSelected = selectedComptaIds.has(c.id);
                const isCredit = Number(c.credit) > 0;
                const amt = isCredit ? Number(c.credit) : Number(c.debit);
                
                return (
                <div
                  key={c.id}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer group',
                    isSelected 
                      ? 'border-chart-4/50 bg-chart-4/10 shadow-[0_0_15px_rgba(163,230,53,0.1)]' 
                      : 'border-[var(--border-default)]/30 bg-[var(--bg-secondary)]/40 hover:bg-[var(--bg-secondary)] hover:border-[var(--border-default)]/50'
                  )}
                  onClick={() => toggleSelectCompta(c.id)}
                >
                  <button
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-colors',
                      isSelected ? 'bg-chart-4 border-chart-4 text-chart-4-foreground' : 'border-muted-foreground/30 group-hover:border-chart-4/50'
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-black" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground/90">{c.libelle}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(c.date)} • Pièce {c.ecriture_numero}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-mono font-bold text-sm flex items-center justify-end gap-1', isCredit ? 'text-rose-400' : 'text-emerald-400')}>
                      {isCredit ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      {formatCurrency(amt)}
                    </p>
                  </div>
                </div>
              )})}
            </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* OD Generator Card */}
      <GlassCard glow={false} className="border-t border-t-white/5 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border-default)]/50 bg-gradient-to-r from-warning/10 via-background to-background">
          <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5 text-warning" />
            Opérations bancaires seules - Générer une OD
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Créer une opération diverse pour les frais bancaires, agios, ou autres mouvements non saisis...</p>
        </div>
        <div className="p-5">
          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
            {releve.length === 0 && <p className="text-sm text-muted-foreground py-4">Aucune ligne disponible pour une OD.</p>}
            {releve.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-warning/20 bg-warning/5 hover:bg-warning/10 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 text-warning shrink-0 shadow-inner">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-foreground/90">{r.libelle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(r.date)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3 shrink-0">
                  <p className="font-mono font-black text-lg text-foreground">{formatCurrency(Number(r.montant))}</p>
                  <NeonButton
                    variant="outline"
                    className="h-9 px-4 text-xs border-warning/50 hover:bg-warning hover:text-warning-foreground"
                    onClick={() => handleGenerateODClick(r.id)}
                  >
                    Générer OD
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </NeonButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Dialog for OD */}
      <Dialog open={odModalOpen} onOpenChange={setOdModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-warning/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <Link2 className="h-5 w-5" />
              Générer une OD
            </DialogTitle>
            <DialogDescription>
              Veuillez saisir le compte de charge ou de produit pour cette opération bancaire (ex: 627 pour frais bancaires).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="compte" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Compte de contrepartie</Label>
              <Input
                id="compte"
                value={odCompte}
                onChange={(e) => setOdCompte(e.target.value)}
                className="font-mono text-lg h-12 bg-[var(--bg-secondary)]/40"
                autoFocus
                placeholder="627..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOdModalOpen(false)}>Annuler</Button>
            <Button onClick={confirmGenerateOD} className="bg-warning text-warning-foreground hover:bg-warning/90">Générer l'OD</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
