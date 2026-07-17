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
  Layers,
  Smartphone,
  Camera
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type View = 'saisie' | 'valide';

export default function SaisiePage() {
  const [view, setView] = useState<View>('saisie');

  return (
    <div className="space-y-3 animate-fade-in pb-8">
      <div className="flex justify-end gap-2 mb-2">
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-border/50">
          <button
            onClick={() => setView('saisie')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
              view === 'saisie' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <PencilLine className="h-3.5 w-3.5" />
            Saisie
          </button>
          <button
            onClick={() => setView('valide')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
              view === 'valide' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
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
  const [TIERS, setTiers] = useState<any[]>([]);
  const [savedBrouillards, setSavedBrouillards] = useState<Ecriture[]>([]);
  const [editingBrouillonId, setEditingBrouillonId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jData, pData, eData, tData] = await Promise.all([
          fetchWithAuth('/plan_comptable/journaux/'),
          fetchWithAuth('/plan_comptable/comptes/'),
          fetchWithAuth('/saisie/ecritures/?statut=brouillard'),
          fetchWithAuth('/plan_comptable/tiers/')
        ]);
        const DEFAULT_JOURNAUX: Journal[] = [
          { code: 'ACH', libelle: 'Achats', type: 'achats', site: 'sabri', dernierNumero: 0 },
          { code: 'VTE', libelle: 'Ventes', type: 'ventes', site: 'sabri', dernierNumero: 0 },
          { code: 'BQ', libelle: 'Banque', type: 'banque', site: 'sabri', dernierNumero: 0 },
          { code: 'CAI', libelle: 'Caisse', type: 'caisse', site: 'sabri', dernierNumero: 0 },
          { code: 'OD', libelle: 'Opérations Diverses', type: 'od', site: 'sabri', dernierNumero: 0 },
          { code: 'FISC', libelle: 'Fiscalité', type: 'od', site: 'sabri', dernierNumero: 0 },
        ];
        
        setJournaux(jData.length > 0 ? jData : DEFAULT_JOURNAUX);
        setPlanComptable(pData);
        setSavedBrouillards(eData);
        setTiers(tData);
      } catch (e) {
        toast.error("Erreur de chargement");
      }
    };
    fetchData();


  }, []);

  const handleTerrainToJournal = async (op: any) => {
    // Determine account based on nature or type
    let compte = '';
    let libelleCompte = '';
    
    // Quick heuristic based on nature
    if (op.nature.toLowerCase().includes('carburant')) { compte = '611'; libelleCompte = 'Carburant'; }
    else if (op.nature.toLowerCase().includes('transport')) { compte = '612'; libelleCompte = 'Transport'; }
    else if (op.nature.toLowerCase().includes('douane')) { compte = '64'; libelleCompte = 'Frais de douane'; }
    else if (op.nature.toLowerCase().includes('mission')) { compte = '65'; libelleCompte = 'Frais de mission'; }
    
    try {
      // Mark as integrated in DB
      await fetchWithAuth(`/terrain/operations/${op.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ statut: 'integre' })
      });

      setLignes([
        {
          id: `l${Date.now()}`,
          date: op.date.split('T')[0],
          compte: compte,
          libelleCompte: libelleCompte,
          libelle: op.nature,
          debit: op.typeOp === 'depense' ? op.montant : 0,
          credit: op.typeOp === 'recette' ? op.montant : 0,
        },
        ...lignes
      ]);

      // Remove from list
      setTerrainOperations(terrainOperations.filter(t => t.id !== op.id));
      
      toast.success('Opération importée dans la saisie');
      setOpenTerrainDetails(false);
      setOpenTerrain(false);
    } catch (e) {
      toast.error("Erreur lors de l'intégration");
    }
  };



  // Configuration d'en-tête
  const [journal, setJournal] = useState<JournalCode>('ACH');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [libelle, setLibelle] = useState('');
  const [numeroEcriture, setNumeroEcriture] = useState('');
  const [numeroPiece, setNumeroPiece] = useState('');

  useEffect(() => {
    const journalInfo = JOURNAUX.find(j => j.code === journal);
    if (journalInfo) {
      const year = new Date(date || new Date()).getFullYear();
      const seq = String(journalInfo.dernierNumero + 1).padStart(5, '0');
      setNumeroEcriture(`${journal}-${year}-${seq}`);
      setNumeroPiece(`PC-${journal}-${year}-${seq}`);
    }
  }, [journal, date, JOURNAUX]);
  
  // Lignes d'écriture (étendue localement pour gérer le fichier)
  const [lignes, setLignes] = useState<(LigneEcriture & { fichier?: File | null })[]>([]);

  const [openConfig, setOpenConfig] = useState(false);
  const [openNewLine, setOpenNewLine] = useState(false);
  const [openBrouillons, setOpenBrouillons] = useState(false);
  const [openTerrain, setOpenTerrain] = useState(false);
  const [openTerrainDetails, setOpenTerrainDetails] = useState(false);
  const [selectedTerrainOp, setSelectedTerrainOp] = useState<any>(null);
  const [hasViewedTerrain, setHasViewedTerrain] = useState(false);
  
  // Terrain state
  const [terrainOperations, setTerrainOperations] = useState<any[]>([]);
  const [terrainSearchQuery, setTerrainSearchQuery] = useState('');
  const [terrainFilter, setTerrainFilter] = useState('all');
  const [terrainStatutFilter, setTerrainStatutFilter] = useState('en_attente');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  useEffect(() => {
    const fetchTerrain = async () => {
      try {
        const tData = await fetchWithAuth(`/terrain/operations/?statut=${terrainStatutFilter}`);
        const mapped = tData.map((op: any) => ({
          id: op.id,
          typeOp: op.type_op,
          montant: parseFloat(op.montant),
          nature: op.nature,
          date: op.date_creation,
          photo: op.has_photo,
          notes: op.notes,
          statut: op.statut
        }));
        setTerrainOperations(mapped);
      } catch (e) {
        console.error("Erreur chargement terrain", e);
      }
    };
    fetchTerrain();
  }, [terrainStatutFilter]);

  const filteredTerrain = terrainOperations.filter(op => {
    if (terrainFilter !== 'all' && op.typeOp !== terrainFilter) return false;
    if (terrainSearchQuery) {
      const q = terrainSearchQuery.toLowerCase();
      return op.nature.toLowerCase().includes(q) || op.montant.toString().includes(q);
    }
    return true;
  });

  // New ligne state
  const [nlCompte, setNlCompte] = useState('');
  const [nlLibelle, setNlLibelle] = useState('');
  const [nlDebit, setNlDebit] = useState('');
  const [nlCredit, setNlCredit] = useState('');
  const [nlCentreCout, setNlCentreCout] = useState('');
  const [nlTiersAuxiliaire, setNlTiersAuxiliaire] = useState('');
  const [nlFichier, setNlFichier] = useState<File | null>(null);
  const [openCompte, setOpenCompte] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompte, setFilterCompte] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalDebit = lignes.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lignes.reduce((s, l) => s + (Number(l.credit) || 0), 0);
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

  const handleAddLigne = () => {
    if (!nlCompte) {
      toast.error("Veuillez sélectionner un compte");
      return;
    }
    const d = parseFloat(nlDebit || '0');
    const c = parseFloat(nlCredit || '0');
    if (d === 0 && c === 0) {
      toast.error("Veuillez saisir un montant au débit ou au crédit");
      return;
    }
    
    const compteInfo = PLAN_COMPTABLE.find(c => c.numero === nlCompte);
    
    if (compteInfo?.analytique_obligatoire && !nlCentreCout) {
      toast.error("Le centre de coût est obligatoire pour ce compte");
      return;
    }

    if (compteInfo?.requiert_auxiliaire && !nlTiersAuxiliaire) {
      toast.error("Le tiers / auxiliaire est obligatoire pour ce compte");
      return;
    }

    const newLigne: any = {
      id: Math.random().toString(),
      date: new Date().toISOString().split('T')[0],
      compte: nlCompte,
      libelleCompte: compteInfo ? compteInfo.libelle : '',
      libelle: nlLibelle || (compteInfo ? compteInfo.libelle : ''),
      debit: d,
      credit: c,
      fichier: nlFichier,
      centre_cout: nlCentreCout || null,
      tiers_auxiliaire: nlTiersAuxiliaire || null
    };

    setLignes([...lignes, newLigne]);
    setNlCompte('');
    setNlLibelle('');
    setNlDebit('');
    setNlCredit('');
    setNlCentreCout('');
    setNlTiersAuxiliaire('');
    setNlFichier(null);
    if (fileRef.current) fileRef.current.value = '';
    setOpenNewLine(false);
    setCurrentPage(1);
  };

  const removeLigne = (id: string) => {
    setLignes(lignes.filter((l) => l.id !== id));
  };

  const handleEditBrouillon = (brouillon: Ecriture) => {
    setJournal(brouillon.journal as JournalCode);
    setDate(brouillon.date);
    setLibelle(brouillon.libelle);
    setNumeroEcriture(brouillon.numero);
    setNumeroPiece(brouillon.piece || `PC-${brouillon.numero}`);
    
    const loadedLignes = brouillon.lignes.map((l: any) => ({
      ...l,
      id: l.id || Math.random().toString()
    }));
    setLignes(loadedLignes);
    setEditingBrouillonId(brouillon.id);
    setOpenBrouillons(false);
  };

  const handleSave = async (valider: boolean) => {
    if (!hasLignes) {
      toast.error('Aucune ligne à enregistrer');
      return;
    }
    
    // Check if any line has an empty compte
    const hasEmptyCompte = lignes.some(l => !l.compte || l.compte.trim() === '');
    if (hasEmptyCompte) {
      toast.error('Veuillez sélectionner un compte pour chaque ligne de l\'écriture.');
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
        numero: numeroEcriture || num,
        piece: numeroPiece || `PC-${num}`,
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

      await fetchWithAuth(editingBrouillonId ? `/saisie/ecritures/${editingBrouillonId}/` : '/saisie/ecritures/', {
        method: editingBrouillonId ? 'PUT' : 'POST',
        body: JSON.stringify(ecritureData)
      });

      if (!valider) {
        // Refresh brouillards
        const eData = await fetchWithAuth('/saisie/ecritures/?statut=brouillard');
        setSavedBrouillards(eData);
      } else if (editingBrouillonId) {
        // Si on vient de valider un brouillon existant, on met à jour la liste
        setSavedBrouillards(savedBrouillards.filter(b => b.id !== editingBrouillonId));
      }

      toast.success(valider ? 'Écriture validée définitivement' : 'Brouillard enregistré', {
        description: `${num} - ${libelle}`,
      });
      setLignes([]);
      setLibelle('');
      setEditingBrouillonId(null);
      
      // Rafraîchir les journaux pour avoir le nouveau dernierNumero
      const jData = await fetchWithAuth('/plan_comptable/journaux/');
      if (jData && jData.length > 0) {
        setJournaux(jData);
      }
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
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Débits</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-primary truncate" title={formatCurrency(totalDebit)}>{formatCurrency(totalDebit)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Crédits</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-chart-5 truncate" title={formatCurrency(totalCredit)}>{formatCurrency(totalCredit)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-chart-5/10 text-chart-5 shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Équilibre</span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                <span className={cn("text-[10px] sm:text-base font-bold leading-none truncate", equilibre && hasLignes ? "text-emerald-500" : "text-rose-500")} title={formatCurrency(Math.abs(totalDebit - totalCredit))}>
                  {formatCurrency(Math.abs(totalDebit - totalCredit))}
                </span>
                <span className={cn("text-[7px] sm:text-[9px] font-medium truncate", equilibre && hasLignes ? "text-emerald-500/80" : "text-rose-500/80")}>
                  ({equilibre && hasLignes ? "Équilibré" : "Déséquilibré"})
                </span>
              </div>
            </div>
            <div className={cn("p-1 sm:p-1.5 rounded-md shrink-0", equilibre && hasLignes ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
              <Scale className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Brouillons</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-warning truncate" title={savedBrouillards.length.toString()}>{savedBrouillards.length}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-warning/10 text-warning shrink-0">
              <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'actions et Informations de l'en-tête (Sur la même ligne, sans fond) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-border/50 mb-1">
        {/* Informations de l'en-tête active (A gauche) */}
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          {libelle ? (
            <>
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
                Libellé: <strong className="text-foreground">{libelle}</strong>
              </span>
            </>
          ) : (
            <span className="italic opacity-70">Configuration d'en-tête non définie</span>
          )}
        </div>

        {/* Boutons et Icônes (A droite) */}
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
          
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
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={nlDebit} 
                      onChange={(e) => { setNlDebit(e.target.value); setNlCredit(''); }} 
                      disabled={(() => {
                        const compte = PLAN_COMPTABLE.find(c => c.numero === nlCompte);
                        return compte?.sens_normal === 'credit';
                      })()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Crédit</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={nlCredit} 
                      onChange={(e) => { setNlCredit(e.target.value); setNlDebit(''); }} 
                      disabled={(() => {
                        const compte = PLAN_COMPTABLE.find(c => c.numero === nlCompte);
                        return compte?.sens_normal === 'debit';
                      })()}
                    />
                  </div>
                </div>

                {(() => {
                  const compteInfo = PLAN_COMPTABLE.find(c => c.numero === nlCompte);
                  return (
                    <>
                      {compteInfo?.analytique_obligatoire && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Centre de Coût <span className="text-destructive">*</span>
                          </Label>
                          <Select value={nlCentreCout} onValueChange={setNlCentreCout}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un centre de coût" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="administration">Administration</SelectItem>
                              <SelectItem value="production">Production Agricole</SelectItem>
                              <SelectItem value="logistique">Logistique & Transport</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {compteInfo?.requiert_auxiliaire && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Tiers / Auxiliaire <span className="text-destructive">*</span>
                          </Label>
                          <Select value={nlTiersAuxiliaire} onValueChange={setNlTiersAuxiliaire}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un tiers" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIERS.map(t => (
                                <SelectItem key={t.code} value={t.code}>{t.nom}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {compteInfo?.soumis_tva && (
                        <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">
                          💡 Ce compte est assujetti à la TVA. Assurez-vous d'ajouter une ligne de TVA si nécessaire.
                        </div>
                      )}
                    </>
                  );
                })()}

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
                <Button onClick={handleAddLigne}>Ajouter la ligne</Button>
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
                      <SelectValue placeholder="Sélectionnez un journal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Achats / Ventes</SelectLabel>
                        {JOURNAUX.filter(j => j.type === 'achats' || j.type === 'ventes').map((j) => (
                          <SelectItem key={j.code} value={j.code}>{j.code} - {j.libelle}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Trésorerie</SelectLabel>
                        {JOURNAUX.filter(j => j.type === 'banque' || j.type === 'caisse').map((j) => (
                          <SelectItem key={j.code} value={j.code}>{j.code} - {j.libelle}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Opérations Diverses</SelectLabel>
                        {JOURNAUX.filter(j => j.type === 'od').map((j) => (
                          <SelectItem key={j.code} value={j.code}>{j.code} - {j.libelle}</SelectItem>
                        ))}
                      </SelectGroup>
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
                  <Label>Libellé de l'écriture</Label>
                  <Input placeholder="Ex: Facture d'achat..." value={libelle} onChange={(e) => setLibelle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>N° de l'écriture</Label>
                  <Input 
                    value={numeroEcriture} 
                    readOnly
                    disabled
                    className="font-mono bg-muted cursor-not-allowed opacity-100 text-muted-foreground" 
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setOpenConfig(false)}>Valider</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modale Operations Terrain */}
          <Dialog open={openTerrain} onOpenChange={(open) => {
            setOpenTerrain(open);
            if (open) setHasViewedTerrain(true);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent relative group" title="Opérations Terrain">
                <Smartphone className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {!hasViewedTerrain && terrainOperations.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                    {terrainOperations.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px] max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Opérations envoyées depuis le terrain</DialogTitle>
                <DialogDescription>
                  Consultez et intégrez les dépenses et recettes déclarées par les agents.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex items-center gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher par nature, montant..." 
                    value={terrainSearchQuery}
                    onChange={(e) => setTerrainSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={terrainFilter} onValueChange={setTerrainFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="depense">Dépenses</SelectItem>
                    <SelectItem value="recette">Recettes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={terrainStatutFilter} onValueChange={setTerrainStatutFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="integre">Déjà traité (Intégré)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 border rounded-md overflow-y-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Nature / Source</TableHead>
                      <TableHead className="text-right">Montant (USD)</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTerrain.map(op => (
                      <TableRow key={op.id}>
                        <TableCell className="text-xs">
                          {new Date(op.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={op.typeOp === 'recette' ? 'default' : 'secondary'} className={op.typeOp === 'recette' ? 'bg-success hover:bg-success/90' : ''}>
                            {op.typeOp === 'recette' ? 'Recette' : 'Dépense'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{op.nature}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(op.montant)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => {
                              setSelectedTerrainOp(op);
                              setOpenTerrainDetails(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTerrain.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          Aucune opération trouvée.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openTerrainDetails} onOpenChange={setOpenTerrainDetails}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Détails de l'opération</DialogTitle>
              </DialogHeader>
              {selectedTerrainOp && (
                <div className="space-y-4 py-2">
                  <div className="bg-muted/20 rounded-xl border border-border/60 p-5 relative overflow-hidden shadow-sm">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10" />
                    
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Montant Total</span>
                        <div className="font-bold text-3xl text-foreground mt-1 tracking-tight">
                          {formatCurrency(selectedTerrainOp.montant)}
                        </div>
                      </div>
                      <Badge variant={selectedTerrainOp.typeOp === 'recette' ? 'default' : 'secondary'} className={`text-[10px] h-5 px-2.5 font-semibold shadow-sm ${selectedTerrainOp.typeOp === 'recette' ? 'bg-success hover:bg-success/90' : 'bg-secondary'}`}>
                        {selectedTerrainOp.typeOp === 'recette' ? 'Recette' : 'Dépense'}
                      </Badge>
                    </div>

                    <div className="space-y-3.5 pt-4 border-t border-dashed border-border/80">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-background border shadow-sm flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Date & Heure</p>
                          <p className="text-xs font-medium">{new Date(selectedTerrainOp.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-background border shadow-sm flex items-center justify-center flex-shrink-0">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Nature / Source</p>
                          <p className="text-xs font-medium">{selectedTerrainOp.nature}</p>
                        </div>
                      </div>
                      {selectedTerrainOp.notes && (
                        <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-background border shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Notes additionnelles</p>
                            <p className="text-xs text-foreground/80 mt-1 leading-relaxed bg-background/60 p-2.5 rounded-lg border border-border/40 italic">"{selectedTerrainOp.notes}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedTerrainOp.photo && (
                    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm transition-all hover:border-primary/40 hover:shadow-md cursor-pointer" onClick={() => setShowReceiptPreview(true)}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]" />
                      <div className="w-full flex items-center p-3.5 gap-3.5">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <Camera className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Pièce justificative</p>
                          <p className="text-[11px] text-muted-foreground">Cliquez pour consulter le document numérisé</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Search className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="h-9 text-xs px-4 rounded-lg" onClick={() => setOpenTerrainDetails(false)}>Fermer</Button>
                    {selectedTerrainOp.statut !== 'integre' && (
                      <Button size="sm" className="h-9 text-xs px-4 rounded-lg shadow-sm" onClick={() => handleTerrainToJournal(selectedTerrainOp)}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        Importer dans la saisie
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Document Preview */}
          <Dialog open={showReceiptPreview} onOpenChange={setShowReceiptPreview}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-muted/20 border-border/50">
              <div className="flex items-center justify-between p-4 bg-background border-b border-border/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Pièce Justificative</h3>
                    <p className="text-[10px] text-muted-foreground">Document numérisé par l'agent</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowReceiptPreview(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 flex justify-center bg-muted/30">
                <div className="relative rounded-lg overflow-hidden border border-border shadow-sm max-h-[60vh] flex items-center justify-center bg-white w-full">
                  {/* Utilisation d'une image générique de facture comme démonstration du justificatif */}
                  <img 
                    src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80" 
                    alt="Justificatif" 
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-lg pointer-events-none"></div>
                </div>
              </div>
              <div className="p-3 bg-background border-t border-border/50 flex justify-end gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowReceiptPreview(false)}>Retour aux détails</Button>
                <Button size="sm" className="h-8 text-xs" variant="secondary">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Télécharger
                </Button>
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
                  const total = e.lignes.reduce((s, l) => s + Number(l.debit || 0), 0);
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleEditBrouillon(e)}>
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
                <TableHead className="text-center w-[15%]">N° Pièce</TableHead>
                <TableHead className="text-center w-[15%]">N° Compte</TableHead>
                <TableHead className="text-center w-[25%]">Libellé</TableHead>
                <TableHead className="text-center w-[10%]">Débit</TableHead>
                <TableHead className="text-center w-[10%]">Crédit</TableHead>
                <TableHead className="text-center w-[5%]">PJ</TableHead>
                <TableHead className="w-[5%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLignes.length > 0 ? (
                paginatedLignes.map((ligne) => (
                  <TableRow key={ligne.id} className="group transition-colors hover:bg-muted/20">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{ligne.date}</TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{numeroPiece}</TableCell>
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
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
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

  const baseLines = ECRITURES.flatMap(e => 
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

  let allLines = baseLines;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    allLines = allLines.filter(
      (l) => l.numero.toLowerCase().includes(q) || 
             l.libelle.toLowerCase().includes(q) || 
             l.compte.toLowerCase().includes(q) ||
             (l.piece && l.piece.toLowerCase().includes(q)) ||
             (l.libelleEcriture && l.libelleEcriture.toLowerCase().includes(q))
    );
  }

  if (filterSaisiPar !== 'all') {
    allLines = allLines.filter((l) => l.saisiePar === filterSaisiPar);
  }

  if (filterDate) {
    allLines = allLines.filter((l) => l.dateEcriture === filterDate);
  }

  // Stats
  const totalPieces = new Set(allLines.map(l => l.numero)).size;
  const totalDebit = allLines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredit = allLines.reduce((sum, l) => sum + Number(l.credit || 0), 0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(allLines.length / itemsPerPage);
  const paginatedLines = allLines.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    if (allLines.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }
    const data = allLines.map(ligne => ({
      "N° Écriture": ligne.numero,
      "N° Pièce": ligne.piece || '',
      "Date": formatDate(ligne.dateEcriture),
      "Compte": ligne.compte,
      "Libellé": ligne.libelle,
      "Débit": ligne.debit > 0 ? ligne.debit : '',
      "Crédit": ligne.credit > 0 ? ligne.credit : '',
      "Saisi par": ligne.saisiePar || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal");
    XLSX.writeFile(workbook, "Journal_Comptable.xlsx");
    toast.success("Export Excel réussi");
  };

  const handleExportPDF = () => {
    if (allLines.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }
    
    // Landscape mode for more breathing room
    const doc = new jsPDF('landscape');
    
    // En-tête
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Journal Comptable", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 28);

    const tableData = allLines.map(ligne => [
      ligne.numero,
      ligne.piece || '-',
      formatDate(ligne.dateEcriture),
      ligne.compte,
      ligne.libelle,
      ligne.debit > 0 ? formatCurrency(ligne.debit) : '-',
      ligne.credit > 0 ? formatCurrency(ligne.credit) : '-',
      (ligne.saisiePar || '?').substring(0, 2).toUpperCase()
    ]);

    // Ligne des totaux
    const totalD = allLines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const totalC = allLines.reduce((s, l) => s + Number(l.credit || 0), 0);
    tableData.push([
      '', '', '', '', 'TOTAUX', 
      formatCurrency(totalD), 
      formatCurrency(totalC), 
      ''
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['N° Écriture', 'N° Pièce', 'Date', 'Compte', 'Libellé', 'Débit', 'Crédit', 'Saisi par']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [15, 23, 42], // slate-900
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 4,
        font: 'helvetica'
      },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'center' }
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] // slate-50
      },
      willDrawCell: function(data: any) {
        // Mettre en gras la ligne des totaux (dernière ligne)
        if (data.row.index === tableData.length - 1) {
          doc.setFont("helvetica", "bold");
          data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        }
      },
      didDrawPage: function(data: any) {
        // Footer (Page x)
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        const str = `Page ${doc.getCurrentPageInfo().pageNumber}`;
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save("Journal_Comptable.pdf");
    toast.success("Export PDF réussi");
  };

  const handlePrint = () => {
    if (allLines.length === 0) {
      toast.error("Aucune donnée à imprimer");
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Veuillez autoriser les pop-ups pour imprimer");
      return;
    }
    
    let html = `
      <html>
        <head>
          <title>Impression Journal Comptable</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            h1 { font-size: 28px; margin: 0 0 8px 0; letter-spacing: -0.5px; }
            p.meta { color: #64748b; font-size: 13px; margin: 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 8px; text-align: left; }
            th { background-color: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            tr:last-child { font-weight: 700; background-color: #f1f5f9; }
            tr:last-child td { border-bottom: none; border-top: 2px solid #cbd5e1; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .badge { background: #e2e8f0; padding: 3px 6px; border-radius: 4px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Journal Comptable</h1>
            <p class="meta">Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>N° Écriture</th>
                <th>N° Pièce</th>
                <th>Date</th>
                <th>Compte</th>
                <th>Libellé</th>
                <th class="text-right">Débit</th>
                <th class="text-right">Crédit</th>
                <th class="text-center">Saisi par</th>
              </tr>
            </thead>
            <tbody>
    `;

    allLines.forEach(ligne => {
      html += `
        <tr>
          <td><span class="badge">${ligne.numero}</span></td>
          <td>${ligne.piece || '-'}</td>
          <td>${formatDate(ligne.dateEcriture)}</td>
          <td><span class="badge">${ligne.compte}</span></td>
          <td>${ligne.libelle}</td>
          <td class="text-right">${ligne.debit > 0 ? formatCurrency(ligne.debit) : '-'}</td>
          <td class="text-right">${ligne.credit > 0 ? formatCurrency(ligne.credit) : '-'}</td>
          <td class="text-center">${(ligne.saisiePar || '?').substring(0, 2).toUpperCase()}</td>
        </tr>
      `;
    });
    
    // Totaux
    const totalD = allLines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const totalC = allLines.reduce((s, l) => s + Number(l.credit || 0), 0);
    
    html += `
              <tr>
                <td colspan="5" class="text-right">TOTAUX</td>
                <td class="text-right">${formatCurrency(totalD)}</td>
                <td class="text-right">${formatCurrency(totalC)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  return (
    <div className="space-y-2">
      {/* Statistiques Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-y-0 border-r-0 border-l-4 border-l-primary bg-primary/5 shadow-sm rounded-xl">
          <div className="text-2xl font-black text-primary font-mono truncate" title={totalPieces.toString()}>{totalPieces}</div>
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Total Pièces</div>
        </Card>
        
        <Card className="p-4 border-y-0 border-r-0 border-l-4 border-l-chart-5 bg-chart-5/5 shadow-sm rounded-xl">
          <div className="text-2xl font-black text-chart-5 font-mono truncate" title={formatCurrency(totalDebit)}>{formatCurrency(totalDebit)}</div>
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Débits Validés</div>
        </Card>

        <Card className="p-4 border-y-0 border-r-0 border-l-4 border-l-destructive bg-destructive/5 shadow-sm rounded-xl">
          <div className="text-2xl font-black text-destructive font-mono truncate" title={formatCurrency(totalCredit)}>{formatCurrency(totalCredit)}</div>
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Crédits Validés</div>
        </Card>

        <Card className="p-4 border-y-0 border-r-0 border-l-4 border-l-success bg-success/5 shadow-sm rounded-xl">
          <div className="text-2xl font-black text-success font-mono truncate" title="Ce mois">Ce mois</div>
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Période</div>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 shadow-sm hover:bg-accent" title="Exporter">
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                Export Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                Export PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="h-8 w-8 shadow-sm hover:bg-accent" title="Imprimer" onClick={handlePrint}>
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
                  <div className="flex items-center justify-center gap-1.5" title={ligne.saisiePar || 'Inconnu'}>
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                      {ligne.saisiePar ? ligne.saisiePar.substring(0, 2).toUpperCase() : '?'}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {allLines.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
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
