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
  const [searchQuery, setSearchQuery] = useState('');
  const [drillCompte, setDrillCompte] = useState<any | null>(null);
  const [planComptable, setPlanComptable] = useState<CompteComptable[]>([]);
  const [balance, setBalance] = useState<any[]>([]);
  const [grandLivre, setGrandLivre] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWithAuth('/plan_comptable/comptes/')
      .then(setPlanComptable)
      .catch(() => toast.error('Erreur lors du chargement du plan comptable'));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchWithAuth('/etats_financiers/balance/'),
      fetchWithAuth('/etats_financiers/grand-livre/')
    ])
      .then(([balanceData, grandLivreData]) => {
        setBalance(balanceData);
        setGrandLivre(grandLivreData);
      })
      .catch(() => toast.error('Erreur lors du chargement des données'))
      .finally(() => setLoading(false));
  }, [periode]);

  return (
    <div className="space-y-6 animate-fade-in">
    <div className="space-y-3 animate-fade-in -mt-2 lg:-mt-4">
      <div className="flex justify-end gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs px-3 shadow-none" onClick={() => toast.success('Export PDF genere')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs px-3 shadow-none" onClick={() => toast.success('Export Excel genere')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs px-3 shadow-none" onClick={() => toast.info('Impression en cours...')}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Imprimer
          </Button>
        </div>
      </div>

      <Card className="border-white/10 shadow-sm bg-background/50 backdrop-blur-xl">
        <CardContent className="p-2">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-border/50">
              <button
                onClick={() => { setView('balance'); setDrillCompte(null); }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
                  view === 'balance' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Balance
              </button>
              <button
                onClick={() => { setView('grand-livre'); setDrillCompte(null); }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
                  view === 'grand-livre' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Grand Livre
              </button>
              <button
                onClick={() => { setView('journaux'); setDrillCompte(null); }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
                  view === 'journaux' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Journaux
              </button>
            </div>
            
            <div className="flex-1 lg:max-w-xs ml-auto flex items-center gap-2">
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger className="h-8 text-xs bg-background/50 shadow-none border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-07">Juillet 2025</SelectItem>
                  <SelectItem value="2025-06">Juin 2025</SelectItem>
                  <SelectItem value="2025-Q2">2eme Trimestre 2025</SelectItem>
                  <SelectItem value="2025">Exercice 2025</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-8 h-8 text-xs bg-background/50 shadow-none border-border" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {view === 'balance' && <BalanceView onDrillDown={(c) => { setDrillCompte(c); setView('grand-livre'); }} balance={balance} searchQuery={searchQuery} />}
      {view === 'grand-livre' && <GrandLivreView drillCompte={drillCompte} onBack={() => { setDrillCompte(null); setView('balance'); }} grandLivre={grandLivre} planComptable={planComptable} searchQuery={searchQuery} />}
      {view === 'journaux' && <JournauxView searchQuery={searchQuery} />}
    </div>
    </div>
  );
}

function BalanceView({ onDrillDown, balance, searchQuery }: { onDrillDown: (c: any) => void, balance: any[], searchQuery: string }) {
  const [filterClass, setFilterClass] = useState('all');

  const comptes = useMemo(() => {
    return balance.filter((c) => {
      const matchClass = filterClass === 'all' || c.compte.startsWith(filterClass);
      const matchSearch = !searchQuery || 
        c.compte.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.libelle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [filterClass, balance, searchQuery]);

  const totalDebit = comptes.reduce((s, c) => s + parseFloat(c.solde_debit), 0);
  const totalCredit = comptes.reduce((s, c) => s + parseFloat(c.solde_credit), 0);
  const totalMvtDebit = comptes.reduce((s, c) => s + parseFloat(c.debit), 0);
  const totalMvtCredit = comptes.reduce((s, c) => s + parseFloat(c.credit), 0);

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
                const debit = parseFloat(c.debit);
                const credit = parseFloat(c.credit);
                const soldeD = parseFloat(c.solde_debit);
                const soldeC = parseFloat(c.solde_credit);
                
                return (
                  <tr
                    key={c.compte}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => onDrillDown(c)}
                  >
                    <td className="py-2.5 px-2 font-mono font-medium">{c.compte}</td>
                    <td className="py-2.5 px-2">{c.libelle}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">-</td>
                    <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">-</td>
                    <td className="py-2.5 px-2 text-right font-mono">{debit > 0 ? formatCurrency(debit) : '-'}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{credit > 0 ? formatCurrency(credit) : '-'}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold">{soldeD > 0 ? formatCurrency(soldeD) : '-'}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold">{soldeC > 0 ? formatCurrency(soldeC) : '-'}</td>
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
                <td className="py-3 px-2 text-right font-mono">-</td>
                <td className="py-3 px-2 text-right font-mono">-</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalMvtDebit)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalMvtCredit)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalDebit)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(totalCredit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function GrandLivreView({ drillCompte, onBack, grandLivre, planComptable, searchQuery }: { drillCompte: any | null; onBack: () => void; grandLivre: any[]; planComptable: CompteComptable[]; searchQuery: string }) {
  const [selectedCompte, setSelectedCompte] = useState<string>('');

  const compteId = drillCompte ? drillCompte.compte : selectedCompte;
  const compteData = grandLivre.find(c => c.compte === compteId);

  const ecritures = compteData ? compteData.ecritures : [];
  const totalDebit = compteData ? parseFloat(compteData.total_debit) : 0;
  const totalCredit = compteData ? parseFloat(compteData.total_credit) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {compteData && (
              <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle>
                {compteData ? `Grand Livre - ${compteData.compte}` : 'Grand Livre general'}
              </CardTitle>
              <CardDescription>
                {compteData ? compteData.libelle : 'Selectionnez un compte pour voir le detail'}
              </CardDescription>
            </div>
          </div>
          {!compteData && (
            <Select value={selectedCompte} onValueChange={setSelectedCompte}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choisir un compte..." />
              </SelectTrigger>
              <SelectContent>
                {grandLivre.filter(c => !searchQuery || c.compte.toLowerCase().includes(searchQuery.toLowerCase()) || c.libelle.toLowerCase().includes(searchQuery.toLowerCase())).map((c) => (
                  <SelectItem key={c.compte} value={c.compte}>
                    {c.compte} - {c.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!compteData ? (
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
                    ecritures.map((l: any, i: number) => {
                      const debit = parseFloat(l.debit);
                      const credit = parseFloat(l.credit);
                      return (
                        <tr key={`${compteId}-${i}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-2">{formatDate(l.date)}</td>
                          <td className="py-2.5 px-2">
                            <Badge variant="outline" className="text-xs font-mono">{l.journal}</Badge>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-xs">{l.piece}</td>
                          <td className="py-2.5 px-2">{l.libelle}</td>
                          <td className="py-2.5 px-2 text-right font-mono">{debit > 0 ? formatCurrency(debit) : '-'}</td>
                          <td className="py-2.5 px-2 text-right font-mono">{credit > 0 ? formatCurrency(credit) : '-'}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-semibold">
                            -
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {ecritures.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border font-bold">
                      <td colSpan={4} className="py-3 px-2">TOTAL</td>
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

function JournauxView({ searchQuery }: { searchQuery: string }) {
  const [journaux, setJournaux] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchWithAuth('/etats_financiers/journaux/')
      .then(data => setJournaux(data))
      .catch(() => toast.error('Erreur lors du chargement des journaux'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center p-8 text-muted-foreground">Chargement des journaux...</div>;
  }

  if (journaux.length === 0) {
    return (
      <div className="text-center p-12 border rounded-xl border-dashed">
        <p className="text-muted-foreground">Aucune écriture validée trouvée pour la période.</p>
      </div>
    );
  }

  const filteredJournaux = journaux.filter(j => 
    !searchQuery || 
    j.ecriture__journal__code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.ecriture__journal__libelle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredJournaux.map((j) => {
        const code = j.ecriture__journal__code;
        const libelle = j.ecriture__journal__libelle;
        const total = parseFloat(j.total_mouvement);
        const count = j.nombre_ecritures;
        
        return (
          <Card key={code} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => toast.info(`Centralisation ${code} - ${count} ecritures`)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-base">{code}</Badge>
                <Badge variant="secondary">{count} écritures</Badge>
              </div>
              <CardTitle className="text-lg mt-2">{libelle}</CardTitle>
              <CardDescription>Période en cours</CardDescription>
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
