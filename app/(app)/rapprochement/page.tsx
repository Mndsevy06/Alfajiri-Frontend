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
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  return (
    <div className="space-y-3 animate-fade-in -mt-2 lg:-mt-4">
      <div className="flex justify-end gap-2 mb-2">
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".csv"
          />
          <Button variant="outline" size="sm" className="h-8 text-xs px-3 shadow-none" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Importer CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs px-3 shadow-none" onClick={handleAutoReconcile} disabled={loading}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Lettrage auto
          </Button>
          <Button variant="secondary" size="sm" className="h-8 w-8 p-0 shadow-none" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {(selectedReleveIds.size > 0 || selectedComptaIds.size > 0) && (
        <Card className={cn("border-2 transition-colors", isSelectionBalanced ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5")}>
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Sélection Relevé ({selectedReleveIds.size})</p>
                <p className="text-lg font-bold font-mono">{formatCurrency(totalReleveSel)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sélection Compta ({selectedComptaIds.size})</p>
                <p className="text-lg font-bold font-mono">{formatCurrency(totalComptaSel)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Écart</p>
                <p className={cn('text-lg font-bold font-mono', ecartSelection < 0.01 ? 'text-success' : 'text-destructive')}>
                  {formatCurrency(ecartSelection)}
                </p>
              </div>
            </div>
            {isSelectionBalanced && (
              <Button onClick={handleManualReconcile}>
                <Check className="h-4 w-4 mr-2" />
                Valider le Rapprochement
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-primary" />
                  Relevé bancaire
                </CardTitle>
                <CardDescription>Opérations en banque non pointées</CardDescription>
              </div>
              <Badge variant="secondary">{releve.length} lignes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
               <p className="text-center py-10 text-muted-foreground">Chargement...</p>
            ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
              {releve.length === 0 && <p className="text-center text-sm py-4">Aucune ligne non lettrée</p>}
              {releve.map((r) => {
                const isSelected = selectedReleveIds.has(r.id);
                return (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}
                  onClick={() => toggleSelectReleve(r.id)}
                >
                  <button
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-sm border shrink-0 transition-colors',
                      isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.libelle}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.date)} {r.reference ? `- Ref: ${r.reference}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-mono font-semibold', r.sens === 'debit' ? 'text-destructive' : 'text-success')}>
                      {r.sens === 'debit' ? '-' : '+'} {formatCurrency(Number(r.montant))}
                    </p>
                  </div>
                </div>
              )})}
            </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-chart-4" />
                  Comptabilité (Trésorerie)
                </CardTitle>
                <CardDescription>Écritures non pointées</CardDescription>
              </div>
              <Badge variant="secondary">{compta.length} lignes</Badge>
            </div>
          </CardHeader>
          <CardContent>
             {loading ? (
               <p className="text-center py-10 text-muted-foreground">Chargement...</p>
            ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
              {compta.length === 0 && <p className="text-center text-sm py-4">Aucune ligne non lettrée</p>}
              {compta.map((c) => {
                const isSelected = selectedComptaIds.has(c.id);
                const isCredit = Number(c.credit) > 0;
                const amt = isCredit ? Number(c.credit) : Number(c.debit);
                
                return (
                <div
                  key={c.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}
                  onClick={() => toggleSelectCompta(c.id)}
                >
                  <button
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-sm border shrink-0 transition-colors',
                      isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.libelle}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.date)} - Pièce {c.ecriture_numero}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-mono font-semibold', isCredit ? 'text-destructive' : 'text-success')}>
                      {isCredit ? '-' : '+'} {formatCurrency(amt)}
                    </p>
                  </div>
                </div>
              )})}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Opérations bancaires seules - Générer une OD
          </CardTitle>
          <CardDescription>Créer une opération diverse pour les frais bancaires, agios...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {releve.length === 0 && <p className="text-sm text-muted-foreground">Aucune ligne disponible.</p>}
            {releve.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning shrink-0">
                  <X className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.libelle}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                </div>
                <p className="font-mono font-semibold">{formatCurrency(Number(r.montant))}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateODClick(r.id)}
                >
                  Générer OD
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={odModalOpen} onOpenChange={setOdModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer une Opération Diverse (OD)</DialogTitle>
            <DialogDescription>
              Veuillez saisir le compte de charge ou de produit pour cette opération bancaire.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="compte">Compte de contrepartie (ex: 627, 661)</Label>
              <Input
                id="compte"
                value={odCompte}
                onChange={(e) => setOdCompte(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOdModalOpen(false)}>Annuler</Button>
            <Button onClick={confirmGenerateOD}>Générer l'OD</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
