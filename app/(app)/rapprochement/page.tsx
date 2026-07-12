'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { RELEVE_BANCAIRE, COMPTA_BANQUE } from '@/lib/mock-data';
import type { LigneReleve, LigneCompta } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function RapprochementPage() {
  const [releve, setReleve] = useState<LigneReleve[]>(RELEVE_BANCAIRE);
  const [compta, setCompta] = useState<LigneCompta[]>(COMPTA_BANQUE);

  const togglePointeReleve = (id: string) => {
    setReleve(releve.map((r) => (r.id === id ? { ...r, pointe: !r.pointe } : r)));
  };
  const togglePointeCompta = (id: string) => {
    setCompta(compta.map((c) => (c.id === id ? { ...c, pointe: !c.pointe } : c)));
  };

  const relevePointe = releve.filter((r) => r.pointe);
  const totalReleve = releve.reduce((s, r) => s + (r.sens === 'debit' ? -r.montant : r.montant), 0);
  const totalCompta = compta.reduce((s, c) => s + (c.sens === 'debit' ? c.montant : -c.montant), 0);
  const ecart = Math.abs(totalReleve - totalCompta);
  const progress = Math.round((relevePointe.length / releve.length) * 100);

  const autoReconcile = () => {
    const matched = new Set<string>();
    const newReleve = releve.map((r) => {
      const match = compta.find((c) => !matched.has(c.id) && Math.abs(c.montant - r.montant) < 0.01);
      if (match) {
        matched.add(match.id);
        return { ...r, pointe: true };
      }
      return r;
    });
    const newCompta = compta.map((c) => (matched.has(c.id) ? { ...c, pointe: true } : c));
    setReleve(newReleve);
    setCompta(newCompta);
    toast.success('Lettrage automatique termine', {
      description: `${matched.size} correspondances trouvees`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Rapprochement Bancaire</h1>
          <p className="text-muted-foreground mt-1">
            Lettrage releve bancaire vs comptabilite - Banque Rawbank USD
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info('Import CSV/MT940 en cours...')}>
            <Upload className="h-4 w-4 mr-2" />
            Importer releve
          </Button>
          <Button variant="outline" size="sm" onClick={autoReconcile}>
            <Sparkles className="h-4 w-4 mr-2" />
            Lettrage auto
          </Button>
          <Button size="sm" onClick={() => toast.success('Etat de rapprochement genere')}>
            <Download className="h-4 w-4 mr-2" />
            Generer l'etat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Progression du lettrage</p>
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {relevePointe.length} / {releve.length} lignes pointees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Solde releve bancaire</p>
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalReleve)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Ecart de rapprochement</p>
            <p className={cn('text-2xl font-bold font-mono', ecart < 0.01 ? 'text-success' : 'text-destructive')}>
              {formatCurrency(ecart)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-primary" />
                  Releve bancaire
                </CardTitle>
                <CardDescription>Rawbank - Juillet 2025</CardDescription>
              </div>
              <Badge variant="secondary">{releve.length} lignes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
              {releve.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                    r.pointe ? 'border-success/30 bg-success/5' : 'border-border hover:bg-muted/50'
                  )}
                  onClick={() => togglePointeReleve(r.id)}
                >
                  <button
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-md border-2 shrink-0 transition-colors',
                      r.pointe ? 'bg-success border-success text-success-foreground' : 'border-border'
                    )}
                  >
                    {r.pointe && <Check className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.libelle}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-mono font-semibold', r.sens === 'debit' ? 'text-destructive' : 'text-success')}>
                      {r.sens === 'debit' ? '-' : '+'} {formatCurrency(r.montant)}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.sens === 'debit' ? 'Debit' : 'Credit'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-chart-4" />
                  Comptabilite (compte 521)
                </CardTitle>
                <CardDescription>Banque Rawbank USD - Juillet 2025</CardDescription>
              </div>
              <Badge variant="secondary">{compta.length} lignes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
              {compta.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                    c.pointe ? 'border-success/30 bg-success/5' : 'border-border hover:bg-muted/50'
                  )}
                  onClick={() => togglePointeCompta(c.id)}
                >
                  <button
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-md border-2 shrink-0 transition-colors',
                      c.pointe ? 'bg-success border-success text-success-foreground' : 'border-border'
                    )}
                  >
                    {c.pointe && <Check className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.libelle}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.date)} - {c.compte}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-mono font-semibold', c.sens === 'credit' ? 'text-destructive' : 'text-success')}>
                      {c.sens === 'credit' ? '-' : '+'} {formatCurrency(c.montant)}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.sens === 'credit' ? 'Credit' : 'Debit'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Lignes non rapprochees - Generer une OD
          </CardTitle>
          <CardDescription>Creer une operation diverse pour les ecarts (frais bancaires, agios...)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {releve.filter((r) => !r.pointe).map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning shrink-0">
                  <X className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.libelle}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                </div>
                <p className="font-mono font-semibold">{formatCurrency(r.montant)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success('OD generee', { description: `${r.libelle} - ${formatCurrency(r.montant)}` })}
                >
                  Generer OD
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ))}
            {releve.filter((r) => !r.pointe).length === 0 && (
              <p className="text-center py-6 text-muted-foreground text-sm">
                Toutes les lignes sont rapprochees
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
