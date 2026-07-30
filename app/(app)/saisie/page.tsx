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
import { TiersFormModal } from '@/components/tiers-form-modal';

type View = 'saisie' | 'valide';

// ---------------------------------------------------------------------------
// CompteSearchDropdown – searchable account picker used in NL entry lines
// ---------------------------------------------------------------------------
type CompteSearchDropdownProps = {
  planComptable: CompteType[];
  selectedCompte: string;
  onSelect: (num: string) => void;
  side: 'debit' | 'credit';
};

function CompteSearchDropdown({ planComptable, selectedCompte, onSelect, side }: CompteSearchDropdownProps) {
  const accentClass = side === 'debit'
    ? 'font-mono bg-blue-500/10 text-blue-600 px-1 rounded text-[10px]'
    : 'font-mono bg-emerald-500/10 text-emerald-600 px-1 rounded text-[10px]';

  return (
    <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
      <CommandInput placeholder="Rechercher un compte…" className="h-9 text-xs" />
      <CommandList>
        <CommandEmpty>Aucun compte trouvé.</CommandEmpty>
        <CommandGroup>
          {planComptable
            .filter((c) => c.mouvementable)
            .map((compte) => (
              <CommandItem
                key={compte.numero}
                value={`${compte.numero} ${compte.libelle}`}
                onSelect={() => onSelect(compte.numero)}
                className="flex items-center gap-2 text-xs cursor-pointer"
              >
                <Check
                  className={cn('h-3 w-3 shrink-0', selectedCompte === compte.numero ? 'opacity-100' : 'opacity-0')}
                />
                <span className={accentClass}>{compte.numero}</span>
                <span className="truncate">{compte.libelle}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}


export default function SaisiePage() {
  const [view, setView] = useState<View>('saisie');

  return (
    <div className="space-y-3 animate-fade-in pb-8">
      {view === 'saisie' ? <SaisieView setView={setView} view={view} /> : <ValideView setView={setView} view={view} />}
    </div>
  );
}

function SaisieView({ setView, view }: { setView: (v: View) => void; view: View }) {
  const [JOURNAUX, setJournaux] = useState<Journal[]>([]);
  const [PLAN_COMPTABLE, setPlanComptable] = useState<CompteType[]>([]);
  const [TIERS, setTiers] = useState<any[]>([]);
  const [savedBrouillards, setSavedBrouillards] = useState<Ecriture[]>([]);
  const [editingBrouillonId, setEditingBrouillonId] = useState<string | null>(null);
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);
  // Tracks which NlEntry line should receive the new tiers code after the modal closes
  const [tiersModalTarget, setTiersModalTarget] = useState<{ side: 'debit' | 'credit'; id: string } | null>(null);

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
    let compte = '';
    let libelleCompte = '';
    
    const opNature = op.nature.toLowerCase();
    const matchedCompte = PLAN_COMPTABLE.find(c => 
      c.libelle.toLowerCase() === opNature ||
      c.libelle.toLowerCase().includes(opNature) ||
      opNature.includes(c.libelle.toLowerCase())
    );
    
    if (matchedCompte) {
      compte = matchedCompte.numero;
      libelleCompte = matchedCompte.libelle;
    } else {
      if (opNature.includes('carburant')) { compte = '611'; libelleCompte = 'Carburant'; }
      else if (opNature.includes('transport')) { compte = '612'; libelleCompte = 'Transport'; }
      else if (opNature.includes('douane')) { compte = '64'; libelleCompte = 'Frais de douane'; }
      else if (opNature.includes('mission')) { compte = '65'; libelleCompte = 'Frais de mission'; }
    }
    
    try {
      // Fetch file if it exists
      let fileObj = null;
      if (op.fichier) {
        fileObj = op.fichier;
      }

      // Remove immediate marking as integrated here
      // We will do it in handleSave instead

      setLignes([
        {
          id: `l${Date.now()}`,
          date: op.date.split('T')[0],
          compte: compte,
          libelleCompte: libelleCompte,
          libelle: op.nature,
          debit: op.typeOp === 'depense' ? op.montant : 0,
          credit: op.typeOp === 'recette' ? op.montant : 0,
          fichier: fileObj,
          terrain_op_id: op.id
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
  
  // Lignes d'écriture (étendue localement pour gérer le fichier et le lien avec terrain)
  const [lignes, setLignes] = useState<(LigneEcriture & { fichier?: File | string | null, terrain_op_id?: any })[]>([]);

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
          fichier: op.fichier,
          saisieParNom: op.saisie_par_nom,
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

  // ── Multi-compte state ──────────────────────────────────────────────────
  type NlEntry = { id: string; compte: string; montant: string; centreCout: string; tiersAux: string; openPopover: boolean };
  const makeEntry = (): NlEntry => ({ id: Math.random().toString(36).slice(2), compte: '', montant: '', centreCout: '', tiersAux: '', openPopover: false });

  const [nlLibelle, setNlLibelle] = useState('');
  const [nlFichier, setNlFichier] = useState<File | string | null>(null);
  const [nlDebitLines, setNlDebitLines] = useState<NlEntry[]>([makeEntry()]);
  const [nlCreditLines, setNlCreditLines] = useState<NlEntry[]>([makeEntry()]);
  const [editingLigneId, setEditingLigneId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // helpers debit lines
  const updateDebitLine = (id: string, patch: Partial<NlEntry>) =>
    setNlDebitLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  const addDebitLine = () => setNlDebitLines(prev => [...prev, makeEntry()]);
  const removeDebitLine = (id: string) => setNlDebitLines(prev => prev.filter(l => l.id !== id));

  // helpers credit lines
  const updateCreditLine = (id: string, patch: Partial<NlEntry>) =>
    setNlCreditLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  const addCreditLine = () => setNlCreditLines(prev => [...prev, makeEntry()]);
  const removeCreditLine = (id: string) => setNlCreditLines(prev => prev.filter(l => l.id !== id));

  const resetNlForm = () => {
    setNlLibelle('');
    setNlFichier(null);
    setNlDebitLines([makeEntry()]);
    setNlCreditLines([makeEntry()]);
    setEditingLigneId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

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
    if (file) setNlFichier(file);
  };

  const handleAddLigne = () => {
    const validDebit = nlDebitLines.filter(l => l.compte && parseFloat(l.montant || '0') > 0);
    const validCredit = nlCreditLines.filter(l => l.compte && parseFloat(l.montant || '0') > 0);

    if (validDebit.length === 0 && validCredit.length === 0) {
      toast.error('Ajoutez au moins un compte avec un montant');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newLignes: any[] = [
      ...validDebit.map(l => {
        const info = PLAN_COMPTABLE.find(c => c.numero === l.compte);
        return { id: Math.random().toString(36).slice(2), date: today, compte: l.compte, libelleCompte: info?.libelle || '', libelle: nlLibelle || info?.libelle || '', debit: parseFloat(l.montant), credit: 0, fichier: nlFichier, centre_cout: l.centreCout || null, tiers_auxiliaire: l.tiersAux || null };
      }),
      ...validCredit.map(l => {
        const info = PLAN_COMPTABLE.find(c => c.numero === l.compte);
        return { id: Math.random().toString(36).slice(2), date: today, compte: l.compte, libelleCompte: info?.libelle || '', libelle: nlLibelle || info?.libelle || '', debit: 0, credit: parseFloat(l.montant), fichier: nlFichier, centre_cout: l.centreCout || null, tiers_auxiliaire: l.tiersAux || null };
      }),
    ];

    if (editingLigneId) {
      // En mode édition : remplace la ligne existante par la première entrée valide
      const replacement = newLignes[0];
      if (replacement) {
        replacement.id = editingLigneId;
        setLignes(prev => {
          const updated = prev.map(l => l.id === editingLigneId ? { ...replacement, terrain_op_id: l.terrain_op_id } : l);
          if (newLignes.length > 1) {
            return [...updated, ...newLignes.slice(1)];
          }
          return updated;
        });
      }
    } else {
      setLignes(prev => [...prev, ...newLignes]);
    }

    resetNlForm();
    setOpenNewLine(false);
    setCurrentPage(1);
    toast.success(`${newLignes.length} ligne${newLignes.length > 1 ? 's' : ''} ajoutée${newLignes.length > 1 ? 's' : ''}`);
  };

  const handleEditLigne = (ligne: any) => {
    resetNlForm();
    if (ligne.debit > 0) {
      setNlDebitLines([{ id: ligne.id, compte: ligne.compte, montant: ligne.debit.toString(), centreCout: ligne.centre_cout || '', tiersAux: ligne.tiers_auxiliaire || '', openPopover: false }]);
      setNlCreditLines([makeEntry()]);
    } else {
      setNlCreditLines([{ id: ligne.id, compte: ligne.compte, montant: ligne.credit.toString(), centreCout: ligne.centre_cout || '', tiersAux: ligne.tiers_auxiliaire || '', openPopover: false }]);
      setNlDebitLines([makeEntry()]);
    }
    setNlLibelle(ligne.libelle);
    setNlFichier(ligne.fichier || null);
    setEditingLigneId(ligne.id);
    setOpenNewLine(true);
  };

  const removeLigne = (id: string) => {
    setLignes(lignes.filter((l) => l.id !== id));
  };

  const handleEditBrouillon = async (brouillon: Ecriture) => {
    setJournal(brouillon.journal as JournalCode);
    setDate(brouillon.date);
    setLibelle(brouillon.libelle);
    setNumeroEcriture(brouillon.numero);
    setNumeroPiece(brouillon.piece || `PC-${brouillon.numero}`);
    
    // Load lines and fetch files
    const loadedLignes = brouillon.lignes.map((l: any) => {
      return {
        ...l,
        id: l.id || Math.random().toString(),
        fichier: l.fichier
      };
    });
    
    setLignes(loadedLignes);
    setEditingBrouillonId(brouillon.id);
    setOpenBrouillons(false);
  };

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

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
      const lignesData = await Promise.all(lignes.map(async (l) => {
        let fichier_base64 = null;
        let fichier_nom = null;
        let fichier_url = null;
        if (l.fichier) {
            if (l.fichier instanceof File) {
                try {
                    fichier_base64 = await toBase64(l.fichier);
                    fichier_nom = l.fichier.name;
                } catch (e) {
                    console.error("Erreur de conversion du fichier", e);
                }
            } else if (typeof l.fichier === 'string') {
                fichier_url = l.fichier;
            }
        }
        return {
          date: l.date,
          compte: l.compte,
          libelleCompte: l.libelleCompte,
          libelle: l.libelle,
          debit: l.debit,
          credit: l.credit,
          centre_cout: l.centre_cout || null,
          tiers_auxiliaire: l.tiers_auxiliaire || null,
          fichier_base64,
          fichier_nom,
          fichier_url
        };
      }));

      const ecritureData = {
        numero: numeroEcriture || num,
        piece: numeroPiece || `PC-${num}`,
        journal: journal,
        date: date,
        libelle: libelle,
        statut: valider ? 'valide' : 'brouillard',
        lignes: lignesData
      };

      await fetchWithAuth(editingBrouillonId ? `/saisie/ecritures/${editingBrouillonId}/` : '/saisie/ecritures/', {
        method: editingBrouillonId ? 'PUT' : 'POST',
        body: JSON.stringify(ecritureData)
      });

      // Mettre à jour le statut des opérations terrain si nécessaire
      const terrainIds = lignes.map(l => l.terrain_op_id).filter(Boolean);
      for (const tId of terrainIds) {
        try {
          await fetchWithAuth(`/terrain/operations/${tId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ statut: 'integre' })
          });
        } catch (e) {
          console.error("Erreur mise à jour terrain", e);
        }
      }

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
      
      {/* Statistiques Section + Toggle Saisie/Journal à droite */}
      <div className="flex items-start gap-2">
        <div className="grid grid-cols-4 gap-1 sm:gap-2 flex-1">
        <Card className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
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
        
        <Card className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
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

        <Card className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
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

        <Card className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
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
      </div>

      {/* Barre d'actions et Informations de l'en-tête (Sur la même ligne, sans fond) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-[var(--border-default)]/50 mb-1 relative">
        
        {/* Toggle Saisie / Journal (A gauche) */}
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-[var(--border-default)]/50 shrink-0">
          <button
            onClick={() => setView('saisie')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all',
              view === 'saisie' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <PencilLine className="h-3.5 w-3.5" />
            Saisie
          </button>
          <button
            onClick={() => setView('valide')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all',
              view === 'valide' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Journal
          </button>
        </div>

        {/* Informations de l'en-tête active (Centré) */}
        <div className="flex-1 flex items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground hidden lg:flex flex-wrap px-4 pointer-events-none">
          {libelle ? (
            <>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Tag className="h-3.5 w-3.5" /> 
                Journal: <strong className="text-foreground">{journal}</strong>
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Calendar className="h-3.5 w-3.5" /> 
                Date: <strong className="text-foreground">{date}</strong>
              </span>
              <span className="flex items-start sm:items-center gap-1 break-words whitespace-normal text-left sm:text-center">
                <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 sm:mt-0" /> 
                <span>Libellé: <strong className="text-foreground">{libelle}</strong></span>
              </span>
            </>
          ) : (
            <span className="italic opacity-70 text-center">Configuration d'en-tête non définie</span>
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

          {/* Bouton Nouvelle Ligne (Icône seule) */}
          <Dialog open={openNewLine} onOpenChange={(open) => {
            if (!open) { resetNlForm(); }
            setOpenNewLine(open);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Nouvelle Ligne" onClick={() => resetNlForm()}>
                <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {editingLigneId ? <PencilLine className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                  {editingLigneId ? "Modifier la ligne" : "Nouvelle écriture comptable"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Renseignez le libellé, puis ajoutez autant de comptes que nécessaire au débit et au crédit.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-2">

                {/* 1. Libellé + Pièce Justificative — EN HAUT */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate block" title="Libellé de l'écriture">Libellé de l'écriture</Label>
                    <Input
                      placeholder="Ex: Facture fournisseur ABC..."
                      value={nlLibelle}
                      onChange={(e) => setNlLibelle(e.target.value)}
                      className="h-10"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pièce Justificative</Label>
                    <div className="flex items-center gap-1.5">
                      <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                        className={cn(
                          "flex-1 h-10 border-dashed text-xs gap-1.5 truncate",
                          nlFichier && "border-primary/50 bg-primary/5 text-primary"
                        )}
                      >
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {nlFichier
                            ? (nlFichier instanceof File ? nlFichier.name : 'Justificatif existant')
                            : 'Joindre un fichier...'}
                        </span>
                      </Button>
                      {nlFichier && (
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { setNlFichier(null); if (fileRef.current) fileRef.current.value = ''; }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Débit / Crédit — deux colonnes avec règles métier */}
                <div className="grid grid-cols-2 gap-3">

                  {/* ── Colonne DÉBIT — comptes à sens débit ou neutre */}
                  <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/[0.03] p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="h-5 w-5 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
                        <TrendingDown className="h-3 w-3 text-blue-500" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Débit</span>
                      <span className="ml-auto text-[10px] font-mono font-semibold text-blue-500">
                        {nlDebitLines.reduce((s,l)=>s+parseFloat(l.montant||'0'),0).toLocaleString('fr-FR',{minimumFractionDigits:2})}
                      </span>
                    </div>

                    {nlDebitLines.map((entry) => {
                      const compteInfo = PLAN_COMPTABLE.find(c => c.numero === entry.compte);
                      return (
                        <div key={entry.id} className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Popover open={entry.openPopover} onOpenChange={(v) => updateDebitLine(entry.id, { openPopover: v })}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("flex-1 h-8 justify-between font-normal text-xs px-2 min-w-0 overflow-hidden", !entry.compte && "text-muted-foreground")}>
                                  <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                                    {entry.compte
                                      ? (() => { const s = PLAN_COMPTABLE.find(c => c.numero === entry.compte); return s
                                          ? <><span className="font-mono bg-blue-500/10 text-blue-600 px-1 rounded text-[10px] shrink-0">{s.numero}</span><span className="truncate text-xs">{s.libelle}</span></>
                                          : <span className="truncate">{entry.compte}</span>; })()
                                      : <><Search className="h-3 w-3 shrink-0"/>Choisir un compte</>}
                                  </span>
                                  <ChevronsUpDown className="h-3 w-3 opacity-40 shrink-0 ml-1" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[360px] p-0" align="start" side="bottom">
                                <CompteSearchDropdown
                                  planComptable={PLAN_COMPTABLE}
                                  selectedCompte={entry.compte}
                                  onSelect={(num) => updateDebitLine(entry.id, { compte: num, openPopover: false })}
                                  side="debit"
                                />
                              </PopoverContent>
                            </Popover>
                            {nlDebitLines.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeDebitLine(entry.id)}>
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <Input type="number" placeholder="0.00" value={entry.montant}
                            onChange={e => updateDebitLine(entry.id, { montant: e.target.value })}
                            className="h-8 text-sm font-bold text-right focus-visible:ring-blue-500/50" />
                          {/* Champs conditionnels par ligne débit */}
                          {compteInfo?.analytique_obligatoire && (
                            <Select value={entry.centreCout || ''} onValueChange={v => updateDebitLine(entry.id, { centreCout: v })}>
                              <SelectTrigger className="h-7 text-xs border-blue-500/30">
                                <SelectValue placeholder="Centre de coût *" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="administration">Administration</SelectItem>
                                <SelectItem value="production">Production Agricole</SelectItem>
                                <SelectItem value="logistique">Logistique & Transport</SelectItem>
                                <SelectItem value="commercial">Commercial</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {compteInfo?.requiert_auxiliaire && (
                            <div className="flex items-center gap-1">
                              <Select value={entry.tiersAux || ''} onValueChange={v => updateDebitLine(entry.id, { tiersAux: v })}>
                                <SelectTrigger className="h-7 text-xs flex-1 border-blue-500/30">
                                  <SelectValue placeholder="Tiers / Auxiliaire *" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIERS.map(t => <SelectItem key={t.code} value={t.code}>{t.nom}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <button type="button" onClick={() => { setTiersModalTarget({ side: 'debit', id: entry.id }); setIsTiersModalOpen(true); }}
                                className="text-[9px] text-primary hover:underline font-bold shrink-0">+ Nouveau</button>
                            </div>
                          )}
                          {compteInfo?.soumis_tva && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
                              <span>💡</span><span>Compte TVA — pensez à la ligne TVA déductible</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button type="button" onClick={addDebitLine}
                      className="w-full h-7 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 border border-dashed border-blue-500/30 rounded-md mt-1 flex items-center justify-center gap-1 transition-colors">
                      <Plus className="h-3 w-3" /> Ajouter un compte
                    </button>
                  </div>

                  {/* ── Colonne CRÉDIT — comptes à sens crédit ou neutre */}
                  <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/[0.03] p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Crédit</span>
                      <span className="ml-auto text-[10px] font-mono font-semibold text-emerald-500">
                        {nlCreditLines.reduce((s,l)=>s+parseFloat(l.montant||'0'),0).toLocaleString('fr-FR',{minimumFractionDigits:2})}
                      </span>
                    </div>

                    {nlCreditLines.map((entry) => {
                      const compteInfo = PLAN_COMPTABLE.find(c => c.numero === entry.compte);
                      return (
                        <div key={entry.id} className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Popover open={entry.openPopover} onOpenChange={(v) => updateCreditLine(entry.id, { openPopover: v })}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("flex-1 h-8 justify-between font-normal text-xs px-2 min-w-0 overflow-hidden", !entry.compte && "text-muted-foreground")}>
                                  <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                                    {entry.compte
                                      ? (() => { const s = PLAN_COMPTABLE.find(c => c.numero === entry.compte); return s
                                          ? <><span className="font-mono bg-emerald-500/10 text-emerald-600 px-1 rounded text-[10px] shrink-0">{s.numero}</span><span className="truncate text-xs">{s.libelle}</span></>
                                          : <span className="truncate">{entry.compte}</span>; })()
                                      : <><Search className="h-3 w-3 shrink-0"/>Choisir un compte</>}
                                  </span>
                                  <ChevronsUpDown className="h-3 w-3 opacity-40 shrink-0 ml-1" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[360px] p-0" align="start" side="bottom">
                                <CompteSearchDropdown
                                  planComptable={PLAN_COMPTABLE}
                                  selectedCompte={entry.compte}
                                  onSelect={(num) => updateCreditLine(entry.id, { compte: num, openPopover: false })}
                                  side="credit"
                                />
                              </PopoverContent>
                            </Popover>
                            {nlCreditLines.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeCreditLine(entry.id)}>
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <Input type="number" placeholder="0.00" value={entry.montant}
                            onChange={e => updateCreditLine(entry.id, { montant: e.target.value })}
                            className="h-8 text-sm font-bold text-right focus-visible:ring-emerald-500/50" />
                          {/* Champs conditionnels par ligne crédit */}
                          {compteInfo?.analytique_obligatoire && (
                            <Select value={entry.centreCout || ''} onValueChange={v => updateCreditLine(entry.id, { centreCout: v })}>
                              <SelectTrigger className="h-7 text-xs border-emerald-500/30">
                                <SelectValue placeholder="Centre de coût *" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="administration">Administration</SelectItem>
                                <SelectItem value="production">Production Agricole</SelectItem>
                                <SelectItem value="logistique">Logistique & Transport</SelectItem>
                                <SelectItem value="commercial">Commercial</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {compteInfo?.requiert_auxiliaire && (
                            <div className="flex items-center gap-1">
                              <Select value={entry.tiersAux || ''} onValueChange={v => updateCreditLine(entry.id, { tiersAux: v })}>
                                <SelectTrigger className="h-7 text-xs flex-1 border-emerald-500/30">
                                  <SelectValue placeholder="Tiers / Auxiliaire *" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIERS.map(t => <SelectItem key={t.code} value={t.code}>{t.nom}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <button type="button" onClick={() => { setTiersModalTarget({ side: 'credit', id: entry.id }); setIsTiersModalOpen(true); }}
                                className="text-[9px] text-primary hover:underline font-bold shrink-0">+ Nouveau</button>
                            </div>
                          )}
                          {compteInfo?.soumis_tva && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
                              <span>💡</span><span>Compte TVA — pensez à la ligne TVA collectée</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button type="button" onClick={addCreditLine}
                      className="w-full h-7 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 border border-dashed border-emerald-500/30 rounded-md mt-1 flex items-center justify-center gap-1 transition-colors">
                      <Plus className="h-3 w-3" /> Ajouter un compte
                    </button>
                  </div>
                </div>

                {/* 3. Indicateur d'équilibre en temps réel */}
                {(() => {
                  const dTotal = nlDebitLines.reduce((s,l)=>s+parseFloat(l.montant||'0'),0);
                  const cTotal = nlCreditLines.reduce((s,l)=>s+parseFloat(l.montant||'0'),0);
                  const ecart = Math.abs(dTotal - cTotal);
                  const ok = ecart < 0.01 && dTotal > 0;
                  if (dTotal === 0 && cTotal === 0) return null;
                  return (
                    <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                      ok ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20")}>
                      <div className="flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5" />
                        <span>{ok ? "Écriture équilibrée ✓" : `Écart de ${ecart.toLocaleString('fr-FR',{minimumFractionDigits:2})}`}</span>
                      </div>
                      <span className="font-mono text-[11px]">
                        D: {dTotal.toLocaleString('fr-FR',{minimumFractionDigits:2})} · C: {cTotal.toLocaleString('fr-FR',{minimumFractionDigits:2})}
                      </span>
                    </div>
                  );
                })()}


              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" onClick={() => { resetNlForm(); setOpenNewLine(false); }}>Annuler</Button>
                <Button onClick={handleAddLigne} className="gap-1.5">
                  {editingLigneId ? <><PencilLine className="h-3.5 w-3.5" />Enregistrer</> : <><Plus className="h-3.5 w-3.5" />Ajouter les lignes</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>


          {/* Bouton d'enregistrement vert avec dropdown (déplacé dans la barre d'action) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg transition-all"
                disabled={!hasLignes}
                title="Enregistrer"
              >
                <Save className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-sm py-2.5"
                onClick={() => handleSave(false)}
              >
                <Archive className="h-4 w-4 text-warning" />
                Enregistrer en brouillon
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-sm py-2.5"
                onClick={() => handleSave(true)}
                disabled={!equilibre || totalDebit === 0}
              >
                <Lock className="h-4 w-4 text-emerald-600" />
                Enregistrer définitivement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                  <Label>N° de l'écriture (optionnel)</Label>
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
                      <TableHead>Saisi par</TableHead>
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
                        <TableCell className="text-xs">
                          {op.saisieParNom || 'Agent'}
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
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-muted/20 border-[var(--border-default)]/50">
              <div className="flex items-center justify-between p-4 bg-background border-b border-[var(--border-default)]/50 shadow-sm">
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
                  {selectedTerrainOp?.fichier ? (
                    <img 
                      src={(() => {
                        let url = selectedTerrainOp.fichier;
                        if (url.startsWith('/')) {
                          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
                          url = baseUrl + url;
                        }
                        return url;
                      })()}
                      alt="Justificatif" 
                      className="max-w-full max-h-[60vh] object-contain"
                    />
                  ) : (
                    <img 
                      src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80" 
                      alt="Justificatif (Démo)" 
                      className="max-w-full max-h-[60vh] object-contain opacity-50 grayscale"
                    />
                  )}
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-lg pointer-events-none"></div>
                </div>
              </div>
              <div className="p-3 bg-background border-t border-[var(--border-default)]/50 flex justify-end gap-2">
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
      <Card className="border-[var(--border-default)]/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-center w-[15%]">Date</TableHead>
                <TableHead className="text-center w-[15%]">N° Écriture</TableHead>
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
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {numeroEcriture || <span className="italic opacity-50">Non défini</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono bg-background shadow-sm border-[var(--border-default)]/50">{ligne.compte}</Badge>
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
                            title={ligne.fichier instanceof File ? `Voir: ${ligne.fichier.name}` : "Voir le justificatif"}
                            onClick={() => {
                              let url = "";
                              if (ligne.fichier instanceof File) {
                                url = URL.createObjectURL(ligne.fichier);
                              } else if (typeof ligne.fichier === 'string') {
                                url = ligne.fichier;
                                if (url.startsWith('/')) {
                                  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
                                  url = baseUrl + url;
                                }
                              }
                              if (url) window.open(url, '_blank');
                            }}
                          >
                            <FileIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          onClick={() => handleEditLigne(ligne)}
                          title="Modifier"
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeLigne(ligne.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
            <div className="flex items-center justify-between border-t border-[var(--border-default)]/50 p-4 bg-muted/10">
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

      <TiersFormModal 
        open={isTiersModalOpen} 
        onOpenChange={setIsTiersModalOpen}
        onSuccess={async (newTiers) => {
          if (newTiers && newTiers.code && tiersModalTarget) {
            if (tiersModalTarget.side === 'debit') {
              updateDebitLine(tiersModalTarget.id, { tiersAux: newTiers.code });
            } else {
              updateCreditLine(tiersModalTarget.id, { tiersAux: newTiers.code });
            }
            setTiersModalTarget(null);
          }
          try {
            const data = await fetchWithAuth('/plan_comptable/tiers/');
            setTiers(data);
          } catch (e) {
            console.error(e);
          }
        }}
      />
    </div>
  );
}

function ValideView({ setView, view }: { setView: (v: View) => void; view: View }) {
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
             (l.numero_ligne && l.numero_ligne.toLowerCase().includes(q)) ||
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
      ligne.saisiePar || 'Inconnu'
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
          <td class="text-center">${ligne.saisiePar || 'Inconnu'}</td>
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
      {/* Statistiques Section + Toggle Saisie/Journal à droite */}
      <div className="flex items-start gap-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
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

      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5 border-b border-[var(--border-default)]/50 mb-2">
        
        {/* Toggle Saisie / Journal (A gauche) */}
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-[var(--border-default)]/50 shrink-0">
          <button
            onClick={() => setView('saisie')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all',
              view === 'saisie' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <PencilLine className="h-3.5 w-3.5" />
            Saisie
          </button>
          <button
            onClick={() => setView('valide')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all',
              view === 'valide' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Journal
          </button>
        </div>

        {/* Autres Boutons (A droite) */}
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

      <Card className="border-[var(--border-default)]/50 shadow-sm overflow-hidden">
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
                <TableCell className="text-center text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={ligne.numero_ligne || ligne.piece}>
                  {ligne.numero_ligne || ligne.piece || '-'}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">{formatDate(ligne.dateEcriture)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <Badge variant="secondary" className="font-mono bg-background shadow-sm border-[var(--border-default)]/50">{ligne.compte}</Badge>
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
                <TableCell className="text-left text-xs text-muted-foreground">
                  <div className="flex items-center justify-start gap-2" title={ligne.saisiePar || 'Inconnu'}>
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                      {ligne.saisiePar ? ligne.saisiePar.substring(0, 2).toUpperCase() : '?'}
                    </div>
                    <span className="truncate">{ligne.saisiePar || 'Inconnu'}</span>
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
          <div className="flex items-center justify-between border-t border-[var(--border-default)]/50 p-3 bg-muted/10">
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
