'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  BookOpen,
  FileText,
  Download,
  ChevronRight,
  ArrowLeft,
  Search,
  Printer,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  CheckCircle2,
  PencilLine,
  ChevronLeft,
  Filter,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard, Button as NeonButton } from '@/components/ui/Layout';
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
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { ECRITURES, CLASSES_SYSCOHADA } from '@/lib/mock-data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fetchWithAuth } from '@/lib/api';
import type { CompteComptable } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

type View = 'balance' | 'grand-livre' | 'journaux';

export default function RestitutionsPage() {
  const [view, setView] = useState<View>('balance');
  const [periode, setPeriode] = useState('2025-07');
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

  function ViewToggle() {
    return (
      <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-[var(--border-default)]/50">
        <button
          onClick={() => { setView('balance'); setDrillCompte(null); }}
          className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all', view === 'balance' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground')}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Balance
        </button>
        <button
          onClick={() => { setView('grand-livre'); setDrillCompte(null); }}
          className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all', view === 'grand-livre' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground')}
        >
          <BookOpen className="h-3.5 w-3.5" /> Grand Livre
        </button>
        <button
          onClick={() => { setView('journaux'); setDrillCompte(null); }}
          className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all', view === 'journaux' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground')}
        >
          <FileText className="h-3.5 w-3.5" /> Journaux
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in pb-8 -mt-3">
      <div className="animate-fade-in-up space-y-2">
        {view === 'balance' && <BalanceView onDrillDown={(c) => { setDrillCompte(c); setView('grand-livre'); }} balance={balance} loading={loading} periode={periode} setPeriode={setPeriode} viewToggle={<ViewToggle />} />}
        {view === 'grand-livre' && <GrandLivreView drillCompte={drillCompte} onBack={() => { setDrillCompte(null); setView('balance'); }} grandLivre={grandLivre} balance={balance} planComptable={planComptable} loading={loading} periode={periode} setPeriode={setPeriode} viewToggle={<ViewToggle />} />}
        {view === 'journaux' && <JournauxView loading={loading} periode={periode} setPeriode={setPeriode} viewToggle={<ViewToggle />} grandLivre={grandLivre} />}
      </div>
    </div>
  );
}

const ActionsBlock = (
  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <NeonButton variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Exporter">
          <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </NeonButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => toast.success('Export PDF généré')} className="cursor-pointer">
          <Download className="h-4 w-4 mr-2 text-rose-400" />
          Export PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.success('Export Excel généré')} className="cursor-pointer">
          <Download className="h-4 w-4 mr-2 text-emerald-400" />
          Export Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <NeonButton variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Imprimer" onClick={() => toast.info('Impression en cours...')}>
      <Printer className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </NeonButton>
  </div>
);

function PeriodeSelect({ periode, setPeriode }: { periode: string, setPeriode: (val: string) => void }) {
  return (
    <Select value={periode} onValueChange={setPeriode}>
      <SelectTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-lg shadow-sm border border-input bg-background hover:bg-accent group [&>svg]:hidden" title="Sélectionner une période">
        <div className="flex items-center justify-center w-full h-full">
          <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          <SelectLabel>Périodes Prédéfinies</SelectLabel>
          <SelectItem value="current_month">Mois en cours</SelectItem>
          <SelectItem value="last_month">Mois dernier</SelectItem>
          <SelectItem value="q1">1er Trimestre</SelectItem>
          <SelectItem value="q2">2ème Trimestre</SelectItem>
          <SelectItem value="q3">3ème Trimestre</SelectItem>
          <SelectItem value="q4">4ème Trimestre</SelectItem>
          <SelectItem value="ytd">Année en cours (YTD)</SelectItem>
          <SelectItem value="last_year">Année précédente</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function BalanceView({ onDrillDown, balance, loading, periode, setPeriode, viewToggle }: { onDrillDown: (c: any) => void, balance: any[], loading: boolean, periode: string, setPeriode: (val: string) => void, viewToggle?: React.ReactNode }) {
  const [filterClass, setFilterClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Pas de pagination

  return (
    <div className="space-y-2">
      {/* Statistiques Section */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Mvt Débit</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-primary truncate" title={formatCurrency(totalMvtDebit)}>{formatCurrency(totalMvtDebit)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
        
        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Mvt Crédit</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-chart-5 truncate" title={formatCurrency(totalMvtCredit)}>{formatCurrency(totalMvtCredit)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-chart-5/10 text-chart-5 shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Solde Débiteur</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-blue-400 truncate" title={formatCurrency(totalDebit)}>{formatCurrency(totalDebit)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-blue-500/10 text-blue-400 shrink-0">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Solde Créditeur</span>
              <span className={cn("text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 truncate", isBalanced ? "text-success" : "text-warning")} title={formatCurrency(totalCredit)}>{formatCurrency(totalCredit)}</span>
            </div>
            <div className={cn("p-1 sm:p-1.5 rounded-md shrink-0", isBalanced ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
              <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Barre d'actions et Informations de l'en-tête */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center w-full py-1 border-b border-[var(--border-default)]/50 mb-1 gap-2">
        <div className="flex items-center justify-start order-2 sm:order-1">
          {viewToggle}
        </div>
        
        <div className="flex items-center justify-center gap-3 text-xs font-medium text-muted-foreground order-1 sm:order-2 shrink-0">
          <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] uppercase font-bold", isBalanced ? "text-success border-success/30 bg-success/5" : "text-warning border-warning/30 bg-warning/5")}>
            {isBalanced ? 'Équilibrée' : 'Déséquilibrée'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full order-3 sm:order-3">
          <PeriodeSelect periode={periode} setPeriode={setPeriode} />
          {ActionsBlock}
          <div className="hidden sm:block w-px h-6 bg-border mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <NeonButton variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg shadow-sm hover:bg-accent group", searchQuery && "bg-accent")} title="Rechercher">
                <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher (compte, libellé)..." 
                  className="pl-8 h-9 text-xs" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <NeonButton variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg shadow-sm hover:bg-accent group", filterClass !== 'all' && "bg-accent")} title="Filtrer">
                <Filter className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm leading-none">Filtrer par classe</h4>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={filterClass === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilterClass('all')}>
                    Toutes
                  </Badge>
                  {CLASSES_SYSCOHADA.map((c) => (
                    <Badge key={c.classe} variant={filterClass === c.classe ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilterClass(c.classe)}>
                      Cl. {c.classe}
                    </Badge>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[400px]">
        <CardContent className="p-0 overflow-auto flex-1">
          <Table className="text-xs sm:text-sm">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-left whitespace-nowrap px-2 py-2 font-semibold">N° Compte</TableHead>
                <TableHead className="text-left whitespace-nowrap px-2 py-2 font-semibold">Libellé</TableHead>
                <TableHead className="text-right whitespace-nowrap px-2 py-2 font-semibold">S. Ouv. Débit</TableHead>
                <TableHead className="text-right whitespace-nowrap px-2 py-2 font-semibold">S. Ouv. Crédit</TableHead>
                <TableHead className="text-right whitespace-nowrap px-2 py-2 font-semibold">Mvt Débit</TableHead>
                <TableHead className="text-right whitespace-nowrap px-2 py-2 font-semibold">Mvt Crédit</TableHead>
                <TableHead className="text-right whitespace-nowrap px-2 py-2 font-semibold">S. Fin. Débit</TableHead>
                <TableHead className="text-right whitespace-nowrap px-2 py-2 font-semibold">S. Fin. Crédit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && comptes.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : comptes.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Aucun compte trouvé.</TableCell></TableRow>
              ) : comptes.map((c) => {
                const debit = parseFloat(c.debit);
                const credit = parseFloat(c.credit);
                const soldeD = parseFloat(c.solde_debit);
                const soldeC = parseFloat(c.solde_credit);
                
                return (
                  <TableRow 
                    key={c.compte} 
                    className="group transition-colors hover:bg-muted/20 cursor-pointer"
                    onClick={() => onDrillDown(c)}
                  >
                    <TableCell className="text-left font-mono whitespace-nowrap px-2 py-1.5">
                      <Badge variant="secondary" className="font-mono bg-background shadow-sm border-[var(--border-default)]/50 text-[10px] sm:text-xs px-1.5">{c.compte}</Badge>
                    </TableCell>
                    <TableCell className="text-left font-medium truncate max-w-[150px] sm:max-w-[250px] px-2 py-1.5" title={c.libelle}>{c.libelle}</TableCell>
                    <TableCell className="text-right font-mono font-medium text-muted-foreground/80 whitespace-nowrap px-2 py-1.5">{parseFloat(c.solde_ouv_debit) > 0 ? formatCurrency(parseFloat(c.solde_ouv_debit)) : '-'}</TableCell>
                    <TableCell className="text-right font-mono font-medium text-muted-foreground/80 whitespace-nowrap px-2 py-1.5">{parseFloat(c.solde_ouv_credit) > 0 ? formatCurrency(parseFloat(c.solde_ouv_credit)) : '-'}</TableCell>
                    <TableCell className="text-right font-mono font-medium text-foreground/90 whitespace-nowrap px-2 py-1.5">{debit > 0 ? formatCurrency(debit) : '-'}</TableCell>
                    <TableCell className="text-right font-mono font-medium text-foreground/90 whitespace-nowrap px-2 py-1.5">{credit > 0 ? formatCurrency(credit) : '-'}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-indigo-400 whitespace-nowrap px-2 py-1.5">{soldeD > 0 ? formatCurrency(soldeD) : '-'}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-indigo-400 whitespace-nowrap px-2 py-1.5">{soldeC > 0 ? formatCurrency(soldeC) : '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

        </CardContent>
      </GlassCard>
    </div>
  );
}

function GrandLivreView({ drillCompte, onBack, grandLivre, balance, planComptable, loading, periode, setPeriode, viewToggle }: { drillCompte: any | null; onBack: () => void; grandLivre: any[]; balance: any[]; planComptable: CompteComptable[]; loading: boolean; periode: string; setPeriode: (val: string) => void; viewToggle?: React.ReactNode }) {
  const [selectedCompte, setSelectedCompte] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const compteId = drillCompte ? drillCompte.compte : selectedCompte;
  const compteData = grandLivre.find(c => c.compte === compteId);

  const ecritures = compteData ? compteData.ecritures : [];
  const totalDebit = compteData ? parseFloat(compteData.total_debit) : 0;
  const totalCredit = compteData ? parseFloat(compteData.total_credit) : 0;
  const solde = totalDebit - totalCredit;

  // Pas de pagination
  
  let filteredEcritures = ecritures;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredEcritures = filteredEcritures.filter((e: any) => 
      e.journal.toLowerCase().includes(q) ||
      e.piece.toLowerCase().includes(q) ||
      e.libelle.toLowerCase().includes(q)
    );
  }

  // Obtenir uniquement les comptes qui ont un solde ou un mouvement dans la balance
  const comptesActifs = useMemo(() => {
    return grandLivre.filter(gl_compte => balance.some(b => b.compte === gl_compte.compte));
  }, [grandLivre, balance]);

  return (
    <div className="space-y-2">
      {/* Statistiques Section */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Débit</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-primary truncate" title={formatCurrency(totalDebit)}>{formatCurrency(totalDebit)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
        
        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Crédit</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-chart-5 truncate" title={formatCurrency(totalCredit)}>{formatCurrency(totalCredit)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-chart-5/10 text-chart-5 shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Solde</span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                <span className={cn("text-[10px] sm:text-base font-bold leading-none truncate", solde >= 0 ? "text-success" : "text-warning")} title={formatCurrency(Math.abs(solde))}>
                  {formatCurrency(Math.abs(solde))}
                </span>
                <span className={cn("text-[7px] sm:text-[9px] font-medium truncate", solde >= 0 ? "text-success/80" : "text-warning/80")}>
                  {solde >= 0 ? '(Débiteur)' : '(Créditeur)'}
                </span>
              </div>
            </div>
            <div className={cn("p-1 sm:p-1.5 rounded-md shrink-0", solde >= 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Barre d'actions et Informations de l'en-tête */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center w-full py-1 border-b border-[var(--border-default)]/50 mb-1 gap-2">
        <div className="flex items-center justify-start order-2 sm:order-1">
          {viewToggle}
        </div>
        
        <div className="flex items-center justify-center gap-3 text-xs font-medium text-muted-foreground order-1 sm:order-2 shrink-0">
          {drillCompte && (
            <NeonButton variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent -ml-2" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </NeonButton>
          )}
          

          {compteData && (
            <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-md border border-[var(--border-default)]/50">
              <span className="font-mono font-bold text-foreground">{compteData.compte}</span>
              <span className="truncate max-w-[150px] sm:max-w-[200px] xl:max-w-[300px] text-muted-foreground">- {compteData.libelle}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full order-3 sm:order-3">
          <PeriodeSelect periode={periode} setPeriode={setPeriode} />
          {ActionsBlock}
          <div className="hidden sm:block w-px h-6 bg-border mx-1" />
          
          {!drillCompte && (
            <div className="w-[200px] sm:w-[250px]">
              <Select value={selectedCompte} onValueChange={setSelectedCompte}>
                <SelectTrigger className="h-8 text-xs font-medium w-full bg-background border-[var(--border-default)]/50 shadow-sm">
                  <SelectValue placeholder="Sélectionner un compte..." />
                </SelectTrigger>
                <SelectContent>
                  {comptesActifs.map((c) => (
                    <SelectItem key={c.compte} value={c.compte}>
                      <span className="font-mono font-bold mr-2">{c.compte}</span>
                      <span className="text-muted-foreground truncate max-w-[150px] inline-block align-bottom">{c.libelle}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <NeonButton variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg shadow-sm hover:bg-accent group", searchQuery && "bg-accent")} title="Rechercher">
                <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher (journal, pièce, libellé)..." 
                  className="pl-8 h-9 text-xs" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[400px]">
        <CardContent className="p-0 overflow-y-auto flex-1">
          {!compteData ? (
            <div className="flex-1 flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-sm">Aucun compte sélectionné</p>
              <p className="text-xs mt-1">Utilisez le sélecteur ci-dessus ou cliquez sur un compte dans la Balance</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-center w-[15%]">Date</TableHead>
                    <TableHead className="text-center w-[10%]">Journal</TableHead>
                    <TableHead className="text-center w-[15%]">N° Pièce</TableHead>
                    <TableHead className="text-center w-[40%]">Libellé</TableHead>
                    <TableHead className="text-center w-[10%]">Débit</TableHead>
                    <TableHead className="text-center w-[10%]">Crédit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Chargement...</TableCell></TableRow>
                  ) : filteredEcritures.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Aucune écriture pour ce compte.</TableCell></TableRow>
                  ) : (
                    filteredEcritures.map((l: any, i: number) => {
                      const debit = parseFloat(l.debit);
                      const credit = parseFloat(l.credit);
                      return (
                        <TableRow key={`${compteId}-${i}`} className="group transition-colors hover:bg-muted/20">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">{formatDate(l.date)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono text-[10px] tracking-wider bg-background">{l.journal}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono font-medium text-xs text-foreground/80">{l.piece}</TableCell>
                          <TableCell className="text-center font-medium text-sm text-foreground/90">{l.libelle}</TableCell>
                          <TableCell className="text-center font-mono font-medium text-sm text-foreground/90">{debit > 0 ? formatCurrency(debit) : '-'}</TableCell>
                          <TableCell className="text-center font-mono font-medium text-sm text-foreground/90">{credit > 0 ? formatCurrency(credit) : '-'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              
            </>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
}

function JournauxView({ loading, periode, setPeriode, viewToggle, grandLivre }: { loading: boolean; periode: string; setPeriode: (val: string) => void; viewToggle?: React.ReactNode; grandLivre: any[] }) {
  const [journaux, setJournaux] = useState<any[]>([]);
  const [loadingJournaux, setLoadingJournaux] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJournal, setSelectedJournal] = useState<any>(null);

  const selectedJournalLines = useMemo(() => {
    if (!selectedJournal) return [];
    let lines: any[] = [];
    grandLivre.forEach((c: any) => {
      c.ecritures.forEach((e: any) => {
        if (e.journal === selectedJournal.ecriture__journal__code) {
          lines.push({
            ...e,
            compte_numero: c.compte,
            compte_libelle: c.libelle,
          });
        }
      });
    });
    return lines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedJournal, grandLivre]);

  useEffect(() => {
    setLoadingJournaux(true);
    fetchWithAuth('/etats_financiers/journaux/')
      .then(data => setJournaux(data))
      .catch(() => toast.error('Erreur lors du chargement des journaux'))
      .finally(() => setLoadingJournaux(false));
  }, [periode]);

  const filteredJournaux = journaux.filter(j => 
    !searchQuery || 
    j.ecriture__journal__code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.ecriture__journal__libelle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalJournaux = filteredJournaux.length;
  const totalMouvements = filteredJournaux.reduce((s, j) => s + parseFloat(j.total_mouvement || 0), 0);
  const totalEcritures = filteredJournaux.reduce((s, j) => s + (j.nombre_ecritures || 0), 0);
  const journalPlusActif = filteredJournaux.reduce((prev, current) => ((prev?.nombre_ecritures || 0) > (current?.nombre_ecritures || 0)) ? prev : current, filteredJournaux[0]);

  return (
    <div className="space-y-2">
      {/* Statistiques Section */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Journaux</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-foreground truncate">{totalJournaux}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-blue-500/10 text-blue-500 shrink-0">
              <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Mouvements</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-emerald-500 truncate" title={formatCurrency(totalMouvements)}>{formatCurrency(totalMouvements)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Écritures</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-indigo-500 truncate">{totalEcritures}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-indigo-500/10 text-indigo-500 shrink-0">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Plus Actif</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-orange-500 truncate">{journalPlusActif ? journalPlusActif.ecriture__journal__code : '-'}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-orange-500/10 text-orange-500 shrink-0">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Barre d'actions et Informations de l'en-tête */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center w-full py-1 border-b border-[var(--border-default)]/50 mb-1 gap-2">
        <div className="flex items-center justify-start order-2 sm:order-1">
          {viewToggle}
        </div>
        
        <div className="flex items-center justify-center gap-3 text-xs font-medium text-muted-foreground order-1 sm:order-2 shrink-0">
          <span className="text-[10px] uppercase font-bold text-muted-foreground/50">Journaux</span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full order-3 sm:order-3">
          <PeriodeSelect periode={periode} setPeriode={setPeriode} />
          {ActionsBlock}
          <div className="hidden sm:block w-px h-6 bg-border mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <NeonButton variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg shadow-sm hover:bg-accent group", searchQuery && "bg-accent")} title="Rechercher">
                <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </NeonButton>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher un journal..." 
                  className="pl-8 h-9 text-xs" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loadingJournaux ? (
        <div className="text-center p-12 text-muted-foreground flex flex-col items-center">
          <Layers className="w-8 h-8 animate-pulse mb-4" />
          <p className="text-sm">Chargement des journaux...</p>
        </div>
      ) : filteredJournaux.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-[var(--border-default)]/50 rounded-xl bg-muted/5">
          <p className="text-muted-foreground text-sm">Aucun journal trouvé pour cette période.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {filteredJournaux.map((j) => {
            const code = j.ecriture__journal__code;
            const libelle = j.ecriture__journal__libelle;
            const total = parseFloat(j.total_mouvement);
            const count = j.nombre_ecritures;
            
            return (
              <GlassCard 
                key={code} 
                className="hover:shadow-md transition-all duration-300 cursor-pointer group border-l-2 border-l-indigo-500/50" 
                glow={false}
                onClick={() => setSelectedJournal(j)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <Badge variant="outline" className="font-mono text-[10px] font-bold tracking-widest border-[var(--border-default)]/50 bg-[var(--bg-secondary)]/40">
                          {code}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-indigo-400 transition-colors truncate">{libelle}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{count} écritures validées</p>
                  </div>
                  <div className="flex items-end justify-between pt-2 border-t border-[var(--border-default)]/50">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground mb-0.5">Mouvement</p>
                      <p className="font-mono font-bold text-foreground text-sm">{formatCurrency(total)}</p>
                    </div>
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Drill-down Dialog */}
      <Dialog open={!!selectedJournal} onOpenChange={(open) => !open && setSelectedJournal(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-[var(--border-default)]">
          <DialogHeader className="p-4 sm:p-6 border-b border-[var(--border-default)]/50 bg-muted/10 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-500/10 text-indigo-500">
                <FileText className="w-4 h-4" />
              </div>
              Détail du Journal {selectedJournal?.ecriture__journal__code}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              {selectedJournal?.ecriture__journal__libelle} - Période {periode}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-muted/5">
            <div className="rounded-xl border border-[var(--border-default)]/50 bg-background overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px] text-center font-semibold">Date</TableHead>
                    <TableHead className="w-[150px] text-center font-semibold">Pièce</TableHead>
                    <TableHead className="w-[100px] text-center font-semibold">Compte</TableHead>
                    <TableHead className="min-w-[200px] font-semibold">Libellé de l'écriture</TableHead>
                    <TableHead className="w-[120px] text-right font-semibold">Débit</TableHead>
                    <TableHead className="w-[120px] text-right font-semibold">Crédit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedJournalLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Aucune écriture trouvée pour ce journal.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedJournalLines.map((l: any, i: number) => {
                      const debit = parseFloat(l.debit);
                      const credit = parseFloat(l.credit);
                      return (
                        <TableRow key={i} className="group transition-colors hover:bg-muted/20">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {formatDate(l.date)}
                          </TableCell>
                          <TableCell className="text-center font-mono font-medium text-xs text-foreground/80">
                            {l.piece}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono text-[10px] tracking-wider bg-background" title={l.compte_libelle}>
                              {l.compte_numero}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm text-foreground/90">
                            {l.libelle}
                            <span className="block text-[10px] text-muted-foreground font-normal truncate mt-0.5" title={l.compte_libelle}>{l.compte_libelle}</span>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-sm text-foreground/90">
                            {debit > 0 ? formatCurrency(debit) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-sm text-foreground/90">
                            {credit > 0 ? formatCurrency(credit) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Total Footer inside Dialog */}
            <div className="mt-4 flex justify-end gap-6 p-4 rounded-xl border border-[var(--border-default)]/50 bg-background shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Total Débit</span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(selectedJournalLines.reduce((acc, l) => acc + parseFloat(l.debit || 0), 0))}
                </span>
              </div>
              <div className="w-px bg-border h-full" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Total Crédit</span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(selectedJournalLines.reduce((acc, l) => acc + parseFloat(l.credit || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
