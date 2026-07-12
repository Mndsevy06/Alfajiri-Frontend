'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  BookOpen,
  FileText,
  Download,
  ChevronRight,
  ArrowLeft,
  Search,
  Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ECRITURES, CLASSES_SYSCOHADA } from '@/lib/mock-data';
import { fetchWithAuth } from '@/lib/api';
import { useEffect } from 'react';
import type { CompteComptable } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

type View = 'balance' | 'grand-livre' | 'journaux';

export default function RestitutionsPage() {
  const [view, setView] = useState<View>('balance');
  const [periode, setPeriode] = useState('2025-07');
  const [drillCompte, setDrillCompte] = useState<CompteComptable | null>(null);
  const [planComptable, setPlanComptable] = useState<CompteComptable[]>([]);

  useEffect(() => {
    fetchWithAuth('/plan_comptable/comptes/')
      .then(setPlanComptable)
      .catch(() => toast.error('Erreur lors du chargement du plan comptable'));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Restitutions financieres</h1>
          <p className="text-muted-foreground mt-1">
            Balance - Grand Livre - Journaux de centralisation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success('Export PDF genere')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success('Export Excel genere')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Impression en cours...')}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="space-y-2">
              <Label>Type de restitution</Label>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                <button
                  onClick={() => { setView('balance'); setDrillCompte(null); }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                    view === 'balance' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  Balance
                </button>
                <button
                  onClick={() => { setView('grand-livre'); setDrillCompte(null); }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                    view === 'grand-livre' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  Grand Livre
                </button>
                <button
                  onClick={() => { setView('journaux'); setDrillCompte(null); }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                    view === 'journaux' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Journaux
                </button>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Periode</Label>
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-07">Juillet 2025</SelectItem>
                  <SelectItem value="2025-06">Juin 2025</SelectItem>
                  <SelectItem value="2025-Q2">2eme Trimestre 2025</SelectItem>
                  <SelectItem value="2025">Exercice 2025 (cumul)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Recherche rapide</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filtrer par compte..." className="pl-10" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {view === 'balance' && <BalanceView onDrillDown={setDrillCompte} planComptable={planComptable} />}
      {view === 'grand-livre' && <GrandLivreView drillCompte={drillCompte} onBack={() => setDrillCompte(null)} planComptable={planComptable} />}
      {view === 'journaux' && <JournauxView />}
    </div>
  );
}

function BalanceView({ onDrillDown, planComptable }: { onDrillDown: (c: CompteComptable) => void, planComptable: CompteComptable[] }) {
  const [filterClass, setFilterClass] = useState('all');

  const comptes = useMemo(() => {
    return planComptable.filter((c) => c.type === 'general' && (filterClass === 'all' || c.classe === filterClass));
  }, [filterClass]);

  const totalDebit = comptes.reduce((s, c) => s + c.soldeDebit, 0);
  const totalCredit = comptes.reduce((s, c) => s + c.soldeCredit, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Balance Generale a 6 colonnes</CardTitle>
            <CardDescription>Soldes d'ouverture - Mouvements - Soldes de cloture</CardDescription>
          </div>
          <Badge variant="outline" className={cn(totalDebit === totalCredit && 'text-success')}>
            {totalDebit === totalCredit ? 'Equilibree' : 'Desequilibree'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterClass('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              filterClass === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
            )}
          >
            Toutes classes
          </button>
          {CLASSES_SYSCOHADA.map((c) => (
            <button
              key={c.classe}
              onClick={() => setFilterClass(c.classe)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                filterClass === c.classe ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
              )}
            >
              Classe {c.classe}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">N Compte</th>
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Libelle</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Solde Debit</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Solde Credit</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Mvt Debit</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Mvt Credit</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Solde Final D</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Solde Final C</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {comptes.map((c) => {
                const mvtDebit = c.soldeDebit * 0.4;
                const mvtCredit = c.soldeCredit * 0.35;
                const finalD = c.soldeDebit - mvtCredit;
                const finalC = c.soldeCredit - mvtDebit;
                return (
                  <tr
                    key={c.numero}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => onDrillDown(c)}
                  >
                    <td className="py-2.5 px-2 font-mono font-medium">{c.numero}</td>
                    <td className="py-2.5 px-2">{c.libelle}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{c.soldeDebit ? formatCurrency(c.soldeDebit) : '-'}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{c.soldeCredit ? formatCurrency(c.soldeCredit) : '-'}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">{mvtDebit ? formatCurrency(mvtDebit) : '-'}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">{mvtCredit ? formatCurrency(mvtCredit) : '-'}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold">{finalD > 0 ? formatCurrency(finalD) : '-'}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold">{finalC > 0 ? formatCurrency(finalC) : '-'}</td>
                    <td className="py-2.5 px-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-bold">
                <td className="py-3 px-2" colSpan={2}>TOTAUX</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalDebit)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalCredit)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalDebit * 0.4)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalCredit * 0.35)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalDebit * 0.6)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalCredit * 0.65)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function GrandLivreView({ drillCompte, onBack, planComptable }: { drillCompte: CompteComptable | null; onBack: () => void; planComptable: CompteComptable[] }) {
  const [selectedCompte, setSelectedCompte] = useState<string>('');

  const compteActif = drillCompte || planComptable.find((c) => c.numero === selectedCompte);

  const ecritures = useMemo(() => {
    if (!compteActif) return [];
    return ECRITURES.filter((e) => e.lignes.some((l) => l.compte === compteActif.numero || l.auxiliaire === compteActif.numero));
  }, [compteActif]);

  const totalDebit = ecritures.reduce((s, e) => s + e.lignes.filter((l) => l.compte === compteActif?.numero || l.auxiliaire === compteActif?.numero).reduce((s2, l) => s2 + l.debit, 0), 0);
  const totalCredit = ecritures.reduce((s, e) => s + e.lignes.filter((l) => l.compte === compteActif?.numero || l.auxiliaire === compteActif?.numero).reduce((s2, l) => s2 + l.credit, 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {compteActif && (
              <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle>
                {compteActif ? `Grand Livre - ${compteActif.numero}` : 'Grand Livre general'}
              </CardTitle>
              <CardDescription>
                {compteActif ? compteActif.libelle : 'Selectionnez un compte pour voir le detail'}
              </CardDescription>
            </div>
          </div>
          {!compteActif && (
            <Select value={selectedCompte} onValueChange={setSelectedCompte}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choisir un compte..." />
              </SelectTrigger>
              <SelectContent>
                {planComptable.filter((c) => c.soldeDebit > 0 || c.soldeCredit > 0).map((c) => (
                  <SelectItem key={c.numero} value={c.numero}>
                    {c.numero} - {c.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!compteActif ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Cliquez sur un compte dans la Balance ou selectionnez-en un ci-dessus</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Journal</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">N Piece</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Libelle</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Debit</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Credit</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {ecritures.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucune ecriture pour ce compte sur la periode
                      </td>
                    </tr>
                  ) : (
                    ecritures.flatMap((e) =>
                      e.lignes
                        .filter((l) => l.compte === compteActif.numero || l.auxiliaire === compteActif.numero)
                        .map((l, i) => {
                          let runningSolde = 0;
                          return (
                            <tr key={`${e.id}-${i}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-2">{formatDate(l.date)}</td>
                              <td className="py-2.5 px-2">
                                <Badge variant="outline" className="text-xs font-mono">{e.journal}</Badge>
                              </td>
                              <td className="py-2.5 px-2 font-mono text-xs">{e.numero}</td>
                              <td className="py-2.5 px-2">{l.libelle}</td>
                              <td className="py-2.5 px-2 text-right font-mono">{l.debit ? formatCurrency(l.debit) : '-'}</td>
                              <td className="py-2.5 px-2 text-right font-mono">{l.credit ? formatCurrency(l.credit) : '-'}</td>
                              <td className="py-2.5 px-2 text-right font-mono font-semibold">
                                {formatCurrency((runningSolde += l.debit - l.credit))}
                              </td>
                            </tr>
                          );
                        })
                    )
                  )}
                </tbody>
                {ecritures.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border font-bold">
                      <td colSpan={4} className="py-3 px-2">SOLDE FINAL</td>
                      <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalDebit)}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalCredit)}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalDebit - totalCredit)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function JournauxView() {
  const ECRITUES_LIBELLES: Record<string, string> = {
    ACH: 'Journal des Achats',
    VTE: 'Journal des Ventes',
    CAI: 'Caisse Zambie',
    BQ: 'Banque Rawbank USD',
    OD: 'Operations Diverses',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {['ACH', 'VTE', 'CAI', 'BQ', 'OD'].map((code) => {
        const ecritures = ECRITURES.filter((e) => e.journal === code);
        const total = ecritures.reduce((s, e) => s + e.lignes.reduce((s2, l) => s2 + l.debit, 0), 0);
        const libelle = ECRITUES_LIBELLES[code] || code;
        return (
          <Card key={code} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => toast.info(`Centralisation ${code} - ${ecritures.length} ecritures`)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-base">{code}</Badge>
                <Badge variant="secondary">{ecritures.length} ecritures</Badge>
              </div>
              <CardTitle className="text-lg mt-2">{libelle}</CardTitle>
              <CardDescription>Periode: Juillet 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total mouvement</p>
                  <p className="text-xl font-bold font-mono">{formatCurrency(total)}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
