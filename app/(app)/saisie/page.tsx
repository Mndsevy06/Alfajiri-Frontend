'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Save,
  Lock,
  Calendar,
  Tag,
  FileText,
  X,
  PencilLine,
  Settings2,
  Archive,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  Paperclip,
  ChevronsUpDown,
  CheckCircle2,
  Eye,
  FileIcon,
  Search,
  Filter,
  Download,
  Printer,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api';
import type { LigneEcriture, JournalCode, Journal, CompteComptable as CompteType, Ecriture } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

type View = 'saisie' | 'valide';

export default function SaisiePage() {
  const [view, setView] = useState<View>('saisie');

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground/90">
            {view === 'saisie' ? 'Saisie Comptable' : 'Journal Comptable'}
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium">
            {view === 'saisie' 
              ? 'Journalisation des opérations - Brouillard & Validation' 
              : 'Historique des écritures validées et intégrées'}
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-border/50">
          <button
            onClick={() => setView('saisie')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
              view === 'saisie' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <PencilLine className="h-3.5 w-3.5" />
            Saisie
          </button>
          <button
            onClick={() => setView('valide')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
              view === 'valide' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Journal
          </button>
        </div>
      </div>

      {view === 'saisie' ? <SaisieView /> : <ValideView />}
    </div>
  );
}

function SaisieView() {
  const [JOURNAUX, setJournaux] = useState<Journal[]>([]);
  const [PLAN_COMPTABLE, setPlanComptable] = useState<CompteType[]>([]);
  const [savedBrouillards, setSavedBrouillards] = useState<Ecriture[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jData, pData, eData] = await Promise.all([
          fetchWithAuth('/plan_comptable/journaux/'),
          fetchWithAuth('/plan_comptable/comptes/'),
          fetchWithAuth('/saisie/ecritures/?statut=brouillard')
        ]);
        setJournaux(jData);
        setPlanComptable(pData);
        setSavedBrouillards(eData);
      } catch (e) {
        toast.error("Erreur de chargement");
      }
    };
    fetchData();
  }, []);

  // Configuration d'en-tête
  const [journal, setJournal] = useState<JournalCode>('ACH');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [libelle, setLibelle] = useState('');
  
  // Lignes d'écriture (étendue localement pour gérer le fichier)
  const [lignes, setLignes] = useState<(LigneEcriture & { fichier?: File | null })[]>([]);

  // Modals state
  const [openConfig, setOpenConfig] = useState(false);
  const [openNewLine, setOpenNewLine] = useState(false);
  const [openBrouillons, setOpenBrouillons] = useState(false);

  // New ligne state
  const [nlCompte, setNlCompte] = useState('');
  const [nlLibelle, setNlLibelle] = useState('');
  const [nlDebit, setNlDebit] = useState('');
  const [nlCredit, setNlCredit] = useState('');
  const [nlFichier, setNlFichier] = useState<File | null>(null);
  const [openCompte, setOpenCompte] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompte, setFilterCompte] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalDebit = lignes.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lignes.reduce((s, l) => s + (l.credit || 0), 0);
  const equilibre = Math.abs(totalDebit - totalCredit) < 0.01;
  const hasLignes = lignes.some((l) => l.compte && (l.debit > 0 || l.credit > 0));

  let filteredLignes = lignes;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredLignes = filteredLignes.filter(
      (l) => l.compte.toLowerCase().includes(q) || 
             l.libelle.toLowerCase().includes(q) || 
             l.libelleCompte.toLowerCase().includes(q)
    );
  }
  if (filterCompte !== 'all') {
    filteredLignes = filteredLignes.filter((l) => l.compte === filterCompte);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNlFichier(file);
    }
  };

  const addLigne = () => {
    if (!nlCompte) {
      toast.error('Veuillez sélectionner un compte');
      return;
    }
    const debitVal = parseFloat(nlDebit) || 0;
    const creditVal = parseFloat(nlCredit) || 0;
    if (debitVal === 0 && creditVal === 0) {
      toast.error('Veuillez saisir un débit ou un crédit');
      return;
    }
    
    const compteInfo = PLAN_COMPTABLE.find(c => c.numero === nlCompte);
    
    setLignes([
      { 
        id: `l${Date.now()}`, 
        date, 
        compte: nlCompte, 
        libelleCompte: compteInfo?.libelle || '', 
        libelle: nlLibelle || libelle, 
        debit: debitVal, 
        credit: creditVal,
        fichier: nlFichier
      },
      ...lignes
    ]);
    
    toast.success('Ligne ajoutée');
    setNlCompte('');
    setNlLibelle('');
    setNlDebit('');
    setNlCredit('');
    setNlFichier(null);
    if (fileRef.current) fileRef.current.value = '';
    setOpenNewLine(false);
    setCurrentPage(1);
  };

  const removeLigne = (id: string) => {
    setLignes(lignes.filter((l) => l.id !== id));
  };

  const handleSave = async (valider: boolean) => {
    if (!hasLignes) {
      toast.error('Aucune ligne à enregistrer');
      return;
    }
    if (valider && !equilibre) {
      toast.error('Validation impossible', {
        description: `Écart: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`,
      });
      return;
    }
    if (!libelle) {
      toast.error("Veuillez configurer l'en-tête (Libellé manquant)");
      return;
    }
    const journalInfo = JOURNAUX.find((j) => j.code === journal);
    if (!journalInfo) return;
    const num = `${journal}-${new Date().getFullYear()}-${String(journalInfo.dernierNumero + 1).padStart(5, '0')}`;
    
    try {
      const ecritureData = {
        numero: num,
        journal: journal,
        date: date,
        libelle: libelle,
        statut: valider ? 'valide' : 'brouillard',
        lignes: lignes.map(l => ({
          date: l.date,
          compte: l.compte,
          libelleCompte: l.libelleCompte,
          libelle: l.libelle,
          debit: l.debit,
          credit: l.credit
        }))
      };

      await fetchWithAuth('/saisie/ecritures/', {
        method: 'POST',
        body: JSON.stringify(ecritureData)
      });

      if (!valider) {
        // Refresh brouillards
        const eData = await fetchWithAuth('/saisie/ecritures/?statut=brouillard');
        setSavedBrouillards(eData);
      }

      toast.success(valider ? 'Écriture validée définitivement' : 'Brouillard enregistré', {
        description: `${num} - ${libelle}`,
      });
      setLignes([]);
      setLibelle('');
    } catch (e: any) {
      toast.error("Erreur lors de l'enregistrement", { description: e.message });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredLignes.length / itemsPerPage);
  const paginatedLignes = filteredLignes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-2">
      
      {/* Statistiques Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Débits</p>
              <p className="text-base font-semibold tracking-tight">{formatCurrency(totalDebit)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-chart-5/10 text-chart-5 flex items-center justify-center shrink-0">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Crédits</p>
              <p className="text-base font-semibold tracking-tight">{formatCurrency(totalCredit)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-2.5 flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
              equilibre && hasLignes ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Équilibre</p>
              <p className={cn(
                "text-base font-semibold tracking-tight",
                equilibre && hasLignes ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(Math.abs(totalDebit - totalCredit))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Archive className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Brouillons en attente</p>
              <p className="text-base font-semibold tracking-tight">{savedBrouillards.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'actions et Informations de l'en-tête (Sur la même ligne, sans fond) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5 border-b border-border/50 mb-2">
        {/* Informations de l'en-tête active (A gauche) */}
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" /> 
            Journal: <strong className="text-foreground">{journal}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> 
            Date: <strong className="text-foreground">{date}</strong>
          </span>
          <span className="flex items-center gap-1 truncate max-w-[200px] xl:max-w-[300px]">
            <FileText className="h-3.5 w-3.5" /> 
            Libellé: <strong className="text-foreground">{libelle || 'Non défini'}</strong>
          </span>
        </div>

        {/* Boutons et Icônes (A droite) */}
        <div className="flex items-center gap-2 shrink-0">
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg shadow-sm hover:bg-accent group", searchQuery && "bg-accent")} title="Rechercher">
                <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher (compte, libellé)..." 
                  className="pl-8 h-9 text-xs" 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  autoFocus
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg shadow-sm hover:bg-accent group", filterCompte !== 'all' && "bg-accent")} title="Filtrer">
                <Filter className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm leading-none">Filtrer les lignes</h4>
                <div className="space-y-1.5">
                  <Label className="text-xs">Compte comptable</Label>
                  <Select value={filterCompte} onValueChange={(val) => { setFilterCompte(val); setCurrentPage(1); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {Array.from(new Set(lignes.map(l => l.compte))).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {filterCompte !== 'all' && (
                  <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setFilterCompte('all')}>
                    Réinitialiser le filtre
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Bouton Nouvelle Ligne */}
          <Dialog open={openNewLine} onOpenChange={setOpenNewLine}>
            <DialogTrigger asChild>
              <Button className="h-8 rounded-lg px-3 text-xs font-semibold shadow-sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Nouvelle Ligne</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ajouter une ligne au journal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2 flex flex-col">
                  <Label>Compte Comptable</Label>
                  <Popover open={openCompte} onOpenChange={setOpenCompte}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCompte}
                        className="justify-between w-full font-normal"
                      >
                        {nlCompte
                          ? (() => {
                              const selected = PLAN_COMPTABLE.find((c) => c.numero === nlCompte);
                              return selected ? `${selected.numero} - ${selected.libelle}` : "Sélectionner un compte";
                            })()
                          : "Sélectionner un compte (recherche...)"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher par numéro ou libellé..." />
                        <CommandList>
                          <CommandEmpty>Aucun compte trouvé.</CommandEmpty>
                          <CommandGroup>
                            {PLAN_COMPTABLE.map((c) => (
                              <CommandItem
                                key={c.numero}
                                value={`${c.numero} ${c.libelle}`}
                                onSelect={() => {
                                  setNlCompte(c.numero);
                                  setOpenCompte(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    nlCompte === c.numero ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="font-mono text-muted-foreground mr-2">{c.numero}</span>
                                {c.libelle}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Libellé de la ligne</Label>
                  <Input placeholder="Libellé spécifique (optionnel)" value={nlLibelle} onChange={(e) => setNlLibelle(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Débit</Label>
                    <Input type="number" placeholder="0.00" value={nlDebit} onChange={(e) => { setNlDebit(e.target.value); setNlCredit(''); }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Crédit</Label>
                    <Input type="number" placeholder="0.00" value={nlCredit} onChange={(e) => { setNlCredit(e.target.value); setNlDebit(''); }} />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Label>Pièce Jointe (Optionnel)</Label>
                  <div className="flex items-center gap-3">
                    <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />
                    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="flex-1 border-dashed">
                      <Paperclip className="h-4 w-4 mr-2" />
                      {nlFichier ? 'Modifier le fichier' : 'Joindre un fichier justificatif'}
                    </Button>
                    {nlFichier && (
                      <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { setNlFichier(null); if (fileRef.current) fileRef.current.value = ''; }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {nlFichier && <p className="text-xs text-muted-foreground truncate">{nlFichier.name}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenNewLine(false)}>Annuler</Button>
                <Button onClick={addLigne}>Ajouter la ligne</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modale Configuration En-tête */}
          <Dialog open={openConfig} onOpenChange={setOpenConfig}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Configuration de l'écriture</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Journal</Label>
                  <Select value={journal} onValueChange={(v) => setJournal(v as JournalCode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOURNAUX.map((j) => (
                        <SelectItem key={j.code} value={j.code}>
                          {j.code} - {j.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>N° Pièce (Auto-généré)</Label>
                  <Input 
                    value={`${journal}-${new Date(date || new Date()).getFullYear()}-${String((JOURNAUX.find(j => j.code === journal)?.dernierNumero || 0) + 1).padStart(5, '0')}`} 
                    disabled 
                    className="bg-muted/50 font-mono text-muted-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Libellé de l'écriture</Label>
                  <Input placeholder="Ex: Facture d'achat..." value={libelle} onChange={(e) => setLibelle(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setOpenConfig(false)}>Valider</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modale Brouillons en attente */}
          <Dialog open={openBrouillons} onOpenChange={setOpenBrouillons}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent relative group">
                <Archive className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {savedBrouillards.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {savedBrouillards.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Brouillons en attente de validation</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto pr-2 mt-4 space-y-3 flex-1">
                {savedBrouillards.map((e) => {
                  const total = e.lignes.reduce((s, l) => s + l.debit, 0);
                  return (
                    <div key={e.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge variant="outline" className="font-mono bg-background">{e.numero}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{e.libelle}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(e.date)} • {e.lignes.length} lignes • {e.saisiePar}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-muted/50 px-2 py-1 rounded-md">{formatCurrency(total)}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            try {
                              await fetchWithAuth(`/saisie/ecritures/${e.id}/`, { method: 'DELETE' });
                              setSavedBrouillards(savedBrouillards.filter((b) => b.id !== e.id));
                              toast.success('Brouillard supprimé');
                            } catch(err) {
                              toast.error("Erreur de suppression");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {savedBrouillards.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">Aucun brouillard en attente.</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tableau du Journal */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-center w-[15%]">Date</TableHead>
                <TableHead className="text-center w-[15%]">N° Compte</TableHead>
                <TableHead className="text-center w-[30%]">Libellé</TableHead>
                <TableHead className="text-center w-[15%]">Débit</TableHead>
                <TableHead className="text-center w-[15%]">Crédit</TableHead>
                <TableHead className="text-center w-[5%]">PJ</TableHead>
                <TableHead className="w-[5%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLignes.length > 0 ? (
                paginatedLignes.map((ligne) => (
                  <TableRow key={ligne.id} className="group transition-colors hover:bg-muted/20">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{ligne.date}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono bg-background shadow-sm border-border/50">{ligne.compte}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-sm">{ligne.libelle}</span>
                        <span className="text-xs text-muted-foreground">{ligne.libelleCompte}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-medium text-sm text-foreground/90">
                      {ligne.debit > 0 ? formatCurrency(ligne.debit) : '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono font-medium text-sm text-foreground/90">
                      {ligne.credit > 0 ? formatCurrency(ligne.credit) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {ligne.fichier && (
                        <div className="flex justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10" 
                            title={`Voir: ${ligne.fichier.name}`}
                            onClick={() => {
                              const url = URL.createObjectURL(ligne.fichier!);
                              window.open(url, '_blank');
                            }}
                          >
                            <FileIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => removeLigne(ligne.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Aucune ligne dans ce journal. Cliquez sur "Nouvelle Ligne" pour commencer.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 p-4 bg-muted/10">
              <p className="text-xs text-muted-foreground">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredLignes.length)} sur {filteredLignes.length} lignes
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
                </Button>
                <div className="text-xs font-semibold px-2">
                  {currentPage} / {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  Suivant <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boutons d'Action Globaux */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          className="flex-1 shadow-sm h-11"
          onClick={() => handleSave(false)}
          disabled={!hasLignes}
        >
          <Save className="h-4 w-4 mr-2" />
          Enregistrer en brouillard
        </Button>
        <Button
          className="flex-1 shadow-sm h-11 bg-primary hover:bg-primary/90"
          onClick={() => handleSave(true)}
          disabled={!equilibre || !hasLignes || totalDebit === 0}
        >
          <Lock className="h-4 w-4 mr-2" />
          Valider définitivement
        </Button>
      </div>
    </div>
  );
}

function ValideView() {
  const [ECRITURES, setEcritures] = useState<Ecriture[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eData = await fetchWithAuth('/saisie/ecritures/?statut=valide');
        setEcritures(eData);
      } catch (e) {
        toast.error("Erreur de chargement des journaux");
      }
    };
    fetchData();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSaisiPar, setFilterSaisiPar] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  let filteredEcritures = ECRITURES;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredEcritures = filteredEcritures.filter(
      (e) => e.numero.toLowerCase().includes(q) || e.libelle.toLowerCase().includes(q)
    );
  }

  if (filterSaisiPar !== 'all') {
    filteredEcritures = filteredEcritures.filter((e) => e.saisiePar === filterSaisiPar);
  }

  if (filterDate) {
    filteredEcritures = filteredEcritures.filter((e) => e.date === filterDate);
  }
  
  // Stats
  const totalPieces = filteredEcritures.length;
  const totalDebit = filteredEcritures.reduce((sum, e) => sum + e.lignes.reduce((s, l) => s + l.debit, 0), 0);
  const totalCredit = filteredEcritures.reduce((sum, e) => sum + e.lignes.reduce((s, l) => s + l.credit, 0), 0);
  
  const allLines = filteredEcritures.flatMap(e => 
    e.lignes.map((l, index) => ({
      ...l,
      uniqueId: `${e.id}-${index}`,
      numero: e.numero,
      piece: e.piece,
      dateEcriture: e.date,
      libelleEcriture: e.libelle,
      saisiePar: e.saisiePar
    }))
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(allLines.length / itemsPerPage);
  const paginatedLines = allLines.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-2">
      {/* Statistiques Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Pièces</p>
              <p className="text-base font-semibold tracking-tight">{totalPieces}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-chart-5/10 text-chart-5 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Débits Validés</p>
              <p className="text-base font-semibold tracking-tight">{formatCurrency(totalDebit)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Crédits Validés</p>
              <p className="text-base font-semibold tracking-tight">{formatCurrency(totalCredit)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Période</p>
              <p className="text-base font-semibold tracking-tight">Ce mois</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 py-1.5 border-b border-border/50 mb-2">
        <div className="flex items-center gap-2 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn("h-8 w-8 shadow-sm hover:bg-accent", searchQuery && "bg-accent")} title="Rechercher">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher (N°, libellé)..." 
                  className="pl-8 h-9 text-xs" 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  autoFocus
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn("h-8 w-8 shadow-sm hover:bg-accent", (filterSaisiPar !== 'all' || filterDate) && "bg-accent")} title="Filtrer">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm leading-none">Filtrer les écritures</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date</Label>
                    <Input type="date" className="h-8 text-xs" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Saisi par</Label>
                    <Select value={filterSaisiPar} onValueChange={(val) => { setFilterSaisiPar(val); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {Array.from(new Set(ECRITURES.map(e => e.saisiePar))).map(user => (
                          <SelectItem key={user} value={user}>{user}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(filterSaisiPar !== 'all' || filterDate) && (
                  <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setFilterSaisiPar('all'); setFilterDate(''); }}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" className="h-8 w-8 shadow-sm hover:bg-accent" title="Exporter">
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 shadow-sm hover:bg-accent" title="Imprimer">
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-center w-[12%]">N° Écriture</TableHead>
              <TableHead className="text-center w-[12%]">N° Pièce</TableHead>
              <TableHead className="text-center w-[10%]">Date</TableHead>
              <TableHead className="text-center w-[10%]">Compte</TableHead>
              <TableHead className="text-center w-[20%]">Libellé</TableHead>
              <TableHead className="text-center w-[13%]">Débit</TableHead>
              <TableHead className="text-center w-[13%]">Crédit</TableHead>
              <TableHead className="text-center w-[10%]">Saisi par</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLines.map((ligne) => (
              <TableRow key={ligne.uniqueId} className="hover:bg-muted/20">
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono bg-background shadow-sm">{ligne.numero}</Badge>
                </TableCell>
                <TableCell className="text-center text-xs font-mono text-muted-foreground truncate max-w-[100px]" title={ligne.piece}>
                  {ligne.piece || '-'}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">{formatDate(ligne.dateEcriture)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <Badge variant="secondary" className="font-mono bg-background shadow-sm border-border/50">{ligne.compte}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-sm">{ligne.libelle}</span>
                    <span className="text-xs text-muted-foreground">{ligne.libelleCompte}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono font-medium text-sm text-foreground/90">
                  {ligne.debit > 0 ? formatCurrency(ligne.debit) : '-'}
                </TableCell>
                <TableCell className="text-center font-mono font-medium text-sm text-foreground/90">
                  {ligne.credit > 0 ? formatCurrency(ligne.credit) : '-'}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-1.5" title={ligne.saisiePar}>
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                      {ligne.saisiePar.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {allLines.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Aucune ligne d'écriture trouvée selon ces critères.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 p-3 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, allLines.length)} sur {allLines.length} lignes
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1} className="h-7 text-xs px-2"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Précédent
              </Button>
              <div className="text-xs font-semibold px-2">{currentPage} / {totalPages}</div>
              <Button 
                variant="outline" size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages} className="h-7 text-xs px-2"
              >
                Suivant <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
