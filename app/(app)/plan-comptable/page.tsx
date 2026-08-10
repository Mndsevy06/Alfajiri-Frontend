'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Users,
  Pencil,
  Trash2,
  X,
  List,
  FolderTree,
  Folder,
  FolderOpen,
  FileText,
  LayoutGrid,
  Network,
  Filter,
  PieChart,
  Activity,
  DollarSign,
  TrendingUp,
  Settings,
  AlignJustify,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { CLASSES_SYSCOHADA } from '@/lib/mock-data';
import type { CompteComptable } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/api';
import { useEffect } from 'react';

type CompteNode = CompteComptable & { children?: CompteNode[]; expanded?: boolean };

export default function PlanComptablePage() {
  const [search, setSearch] = useState('');
  const [comptes, setComptes] = useState<CompteNode[]>([]);
  const [rawComptes, setRawComptes] = useState<CompteComptable[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list_modern' | 'list_excel' | 'list_compact'>('list_modern');
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 400, y: 50 });
  const [preferences, setPreferences] = useState<any>({});

  const loadPreferences = async () => {
    try {
      const data = await fetchWithAuth('/users/me/');
      const prefs = data.preferences || {};
      setPreferences(prefs);
      if (prefs.planComptableViewMode) {
        setViewMode(prefs.planComptableViewMode);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences utilisateur', error);
    }
  };

  const handleToggleHideParents = async (checked: boolean) => {
    try {
      const updatedPrefs = { ...preferences, hideParents: checked };
      setPreferences(updatedPrefs);
      
      await fetchWithAuth('/users/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updatedPrefs }),
      });
      
      toast.success(checked ? 'Parents masqués' : 'Parents affichés');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde de la préférence');
    }
  };

  const handleTogglePreference = async (key: string, value: any, showToast = true) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);
      
      await fetchWithAuth('/users/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updatedPrefs }),
      });
      
      if (showToast) {
        toast.success('Préférence mise à jour');
      }
    } catch (error) {
      if (showToast) {
        toast.error('Erreur lors de la sauvegarde de la préférence');
      }
    }
  };

  const handleViewModeChange = (mode: 'list_modern' | 'list_excel' | 'list_compact') => {
    setViewMode(mode);
    localStorage.setItem('planComptableViewMode', mode);
    handleTogglePreference('planComptableViewMode', mode, false);
  };

  const loadData = async () => {
    try {
      const data = await fetchWithAuth('/plan_comptable/comptes/');
      // On s'assure que les comptes sont toujours triés par numéro, même sur le frontend
      const sortedData = [...data].sort((a: any, b: any) => String(a.numero).localeCompare(String(b.numero)));
      setRawComptes(sortedData);
      setComptes(buildTree(sortedData));
    } catch (error) {
      toast.error('Erreur lors du chargement du plan comptable');
    }
  };

  useEffect(() => {
    const savedView = localStorage.getItem('planComptableViewMode');
    if (savedView) {
      setViewMode(savedView as any);
    }
    
    const init = async () => {
      setLoading(true);
      await Promise.all([loadData(), loadPreferences()]);
      setLoading(false);
    };
    init();
  }, []);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);

  const stats = useMemo(() => {
    const total = rawComptes.length;
    const generalCount = rawComptes.filter(c => c.type === 'general').length;
    const auxCount = rawComptes.filter(c => c.type === 'auxiliaire').length;
    const totalDebit = rawComptes.reduce((sum, c) => sum + (c.soldeDebit || 0), 0);
    const totalCredit = rawComptes.reduce((sum, c) => sum + (c.soldeCredit || 0), 0);
    
    const classBreakdown = Array.from({length: 8}, (_, i) => i + 1).map(c => ({
      classe: c.toString(),
      count: rawComptes.filter(acc => acc.classe === c.toString()).length,
      libelle: CLASSES_SYSCOHADA.find(cl => cl.classe === c.toString())?.libelle || `Classe ${c}`,
      couleur: CLASSES_SYSCOHADA.find(cl => cl.classe === c.toString())?.couleur || '#ccc'
    })).filter(cb => cb.count > 0);

    return { total, generalCount, auxCount, totalDebit, totalCredit, classBreakdown };
  }, [rawComptes]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [compteToDelete, setCompteToDelete] = useState<CompteComptable | null>(null);
  const [editingCompte, setEditingCompte] = useState<CompteComptable | null>(null);
  const [form, setForm] = useState({
    numero: '',
    libelle: '',
    parent: '',
    lettrable: false,
    type: 'auxiliaire' as 'general' | 'auxiliaire',
    code_poste_etats_financiers: '',
  });

  function buildTree(items: CompteComptable[]): CompteNode[] {
    const map = new Map<string, CompteNode>();
    const roots: CompteNode[] = [];
    items.forEach((item) => map.set(item.numero, { ...item, children: [], expanded: true }));
    items.forEach((item) => {
      const node = map.get(item.numero)!;
      if (item.parent && map.has(item.parent)) {
        map.get(item.parent)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  const toggleExpand = (numero: string, nodes: CompteNode[] = comptes): CompteNode[] => {
    return nodes.map((node) => {
      if (node.numero === numero) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: toggleExpand(numero, node.children) };
      }
      return node;
    });
  };

  const handleToggle = (numero: string) => {
    setComptes(toggleExpand(numero));
  };

  const displayTree = useMemo(() => {
    if (preferences.hideParents) {
      const leafAccounts = rawComptes.filter(c => c.numero.length >= 6);
      return buildTree(leafAccounts);
    }
    return comptes;
  }, [comptes, rawComptes, preferences.hideParents]);

  const filteredTree = useMemo(() => {
    if (!search && filterClass === 'all') return displayTree;
    const term = search.toLowerCase();
    const filterNode = (nodes: CompteNode[]): CompteNode[] => {
      return nodes
        .map((node) => {
          const matches =
            (node.numero?.toLowerCase() || '').includes(term) ||
            (node.libelle?.toLowerCase() || '').includes(term) ||
            (node.tiers?.nom?.toLowerCase() || '').includes(term);
          const childMatches = node.children ? filterNode(node.children) : [];
          if (matches || childMatches.length > 0) {
            return { ...node, children: childMatches, expanded: true };
          }
          return null;
        })
        .filter(Boolean) as CompteNode[];
    };
    let result = filterNode(displayTree);
    if (filterClass !== 'all') {
      result = result.filter((n) => n.classe === filterClass);
    }
    return result;
  }, [displayTree, search, filterClass]);

  const openCreate = () => {
    setEditingCompte(null);
    setForm({ numero: '', libelle: '', parent: '', lettrable: false, type: 'auxiliaire', code_poste_etats_financiers: '' });
    setDialogOpen(true);
  };

  const openEdit = (compte: CompteComptable) => {
    setEditingCompte(compte);
    setForm({
      numero: compte.numero,
      libelle: compte.libelle,
      parent: compte.parent || '',
      lettrable: compte.lettrable,
      type: compte.type,
      code_poste_etats_financiers: compte.code_poste_etats_financiers || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.numero || !form.libelle || !form.parent) {
      toast.error('Veuillez renseigner le numero, le libelle et le compte parent');
      return;
    }

    const classe = form.numero.charAt(0);
    const bodyData = { ...form, classe };

    try {
      if (editingCompte) {
        await fetchWithAuth(`/plan_comptable/comptes/${editingCompte.numero}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });
        toast.success('Compte modifie', { description: `${form.numero} - ${form.libelle}` });
      } else {
        await fetchWithAuth('/plan_comptable/comptes/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });
        toast.success('Compte cree', { description: `${form.numero} - ${form.libelle}` });
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du compte');
    }
  };

  const confirmDelete = (compte: CompteComptable) => {
    setCompteToDelete(compte);
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!compteToDelete) return;
    try {
      await fetchWithAuth(`/plan_comptable/comptes/${compteToDelete.numero}/`, {
        method: 'DELETE',
      });
      toast.success('Compte supprimé', { description: compteToDelete.numero });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression du compte');
    } finally {
      setDeleteDialogOpen(false);
      setCompteToDelete(null);
    }
  };

  const getExportData = () => {
    const flattenTree = (nodes: CompteNode[], depth = 0): (CompteComptable & { depth: number })[] => {
      let result: (CompteComptable & { depth: number })[] = [];
      for (const node of nodes) {
        const { children, expanded, ...rest } = node;
        result.push({ ...rest, depth });
        if (expanded && children && children.length > 0) {
          result = result.concat(flattenTree(children, depth + 1));
        }
      }
      return result;
    };
    return flattenTree(filteredTree);
  };

  const exportToExcel = () => {
    try {
      const activeCols = [
        { id: 'compte', header: 'NUMERO DE COMPTE', visible: preferences.showCompte !== false, getVal: (c: any) => c.numero, width: 20 },
        { id: 'nature', header: 'NATURE', visible: preferences.showNature !== false && !preferences.hideParents, getVal: (c: any) => c.type === 'auxiliaire' ? 'Auxiliaire' : 'Général', width: 15 },
        { id: 'codeAfs', header: 'CODE AFS/EF', visible: preferences.showCodeAfs !== false, getVal: (c: any) => c.code_poste_etats_financiers || '-', width: 20 },
        { id: 'intitule', header: 'INTITULÉ', visible: preferences.showIntitule !== false, getVal: (c: any) => '  '.repeat(c.depth) + c.libelle, width: 50 },
        { id: 'details', header: 'TIERS RATTACHÉ', visible: preferences.showDetails !== false, getVal: (c: any) => c.tiers?.type || '-', width: 20 },
        { id: 'debit', header: 'SOLDE DÉBIT', visible: preferences.showDebit !== false, getVal: (c: any) => c.soldeDebit || 0, width: 15 },
        { id: 'credit', header: 'SOLDE CRÉDIT', visible: preferences.showCredit !== false, getVal: (c: any) => c.soldeCredit || 0, width: 15 }
      ].filter(col => col.visible);

      const dataToExport = getExportData().map(c => {
        const row: any = {};
        activeCols.forEach(col => {
          row[col.header] = col.getVal(c);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Plan Comptable");

      worksheet['!cols'] = activeCols.map(col => ({ wch: col.width }));

      XLSX.writeFile(workbook, "Plan_Comptable_SYSCOHADA.xlsx");
      toast.success('Export Excel réussi');
    } catch (error) {
      toast.error("Erreur lors de l'export Excel");
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('p', 'pt', 'a4');

      doc.setFontSize(18);
      doc.text('Plan Comptable SYSCOHADA', 40, 40);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Exporté le : ${new Date().toLocaleDateString('fr-FR')}`, 40, 60);

      const activeCols = [
        { id: 'compte', header: 'NUMERO DE COMPTE', visible: preferences.showCompte !== false, getVal: (c: any) => c.numero, width: 70, align: 'left', bold: true },
        { id: 'nature', header: 'NATURE', visible: preferences.showNature !== false && !preferences.hideParents, getVal: (c: any) => c.type === 'auxiliaire' ? 'Auxiliaire' : 'Général', width: 60, align: 'left', bold: false },
        { id: 'codeAfs', header: 'CODE AFS/EF', visible: preferences.showCodeAfs !== false, getVal: (c: any) => c.code_poste_etats_financiers || '-', width: 60, align: 'left', bold: false },
        { id: 'intitule', header: 'INTITULÉ', visible: preferences.showIntitule !== false, getVal: (c: any) => '  '.repeat(c.depth) + c.libelle, width: 130, align: 'left', bold: false },
        { id: 'details', header: 'TIERS', visible: preferences.showDetails !== false, getVal: (c: any) => c.tiers?.type || '-', width: 60, align: 'left', bold: false },
        { id: 'debit', header: 'SOLDE DÉBIT', visible: preferences.showDebit !== false, getVal: (c: any) => c.soldeDebit ? formatCurrency(c.soldeDebit) : '-', width: 65, align: 'right', bold: false },
        { id: 'credit', header: 'SOLDE CRÉDIT', visible: preferences.showCredit !== false, getVal: (c: any) => c.soldeCredit ? formatCurrency(c.soldeCredit) : '-', width: 65, align: 'right', bold: false }
      ].filter(col => col.visible);

      const tableHeaders = [activeCols.map(col => col.header)];
      const tableData = getExportData().map(c => activeCols.map(col => col.getVal(c)));

      const columnStyles: any = {};
      activeCols.forEach((col, idx) => {
        columnStyles[idx] = {
          cellWidth: col.width,
          halign: col.align,
          fontStyle: col.bold ? 'bold' : 'normal'
        };
      });

      autoTable(doc, {
        startY: 80,
        head: tableHeaders,
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: columnStyles,
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 20);
        }
      });

      doc.save("Plan_Comptable_SYSCOHADA.pdf");
      toast.success('Export PDF réussi');
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
    }
  };
  const gridTemplate = useMemo(() => {
    const cols = [];
    if (!preferences.hideParents) cols.push('minmax(192px, 1.5fr)');
    if (preferences.showCompte !== false) cols.push('minmax(112px, 1fr)');
    if (preferences.showCodeAfs !== false) cols.push('minmax(96px, 1fr)');
    if (preferences.showIntitule !== false) cols.push('minmax(300px, 3fr)');
    if (preferences.showNature !== false) cols.push('minmax(96px, 1fr)');
    if (preferences.showDetails !== false) cols.push('minmax(128px, 1fr)');
    if (preferences.showDebit !== false) cols.push('minmax(112px, 1fr)');
    if (preferences.showCredit !== false) cols.push('minmax(112px, 1fr)');
    return cols.length > 0 ? cols.join(' ') : '1fr';
  }, [preferences]);

  const renderTreeNode = (node: CompteNode, depth: number = 0, isLastChild: boolean = true, parentLines: boolean[] = []): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isAux = node.type === 'auxiliaire';

    const lines = parentLines.map((isLast, index) => (
      <div key={index} className={cn("w-6 shrink-0 h-full border-l-2 border-primary/30", isLast ? "border-transparent" : "")} />
    ));

    return (
      <div key={node.numero} className="flex flex-col relative">
        <div
          className={cn(
            'grid items-stretch group relative min-w-full w-full transition-colors',
            viewMode === 'list_compact' ? 'py-0.5 px-1.5' : (viewMode === 'list_excel' ? 'py-0 px-0' : 'py-1.5 px-4'),
            viewMode === 'list_excel' ? 'border-b border-l border-r border-slate-300 dark:border-slate-600 hover:bg-blue-50/80 dark:hover:bg-blue-900/30' : 'hover:bg-muted/80 dark:hover:bg-muted',
            isAux && viewMode !== 'list_excel' && 'bg-muted/30'
          )}
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {!preferences.hideParents && (
            <div className="flex h-full absolute left-0 top-0 bottom-0 pointer-events-none pl-4">
              {lines}
              {depth > 0 && (
                <div className="w-6 shrink-0 h-1/2 border-l-2 border-b-2 border-primary/30 rounded-bl-md relative top-0" />
              )}
            </div>
          )}

          {!preferences.hideParents && (
            <div className={cn("w-full shrink-0 flex items-center gap-2", viewMode === 'list_excel' && "py-1")} style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren ? (
                <button
                  onClick={() => handleToggle(node.numero)}
                  className={cn("flex items-center justify-center rounded hover:bg-muted shrink-0 text-muted-foreground hover:text-foreground transition-colors z-10 bg-background shadow-sm border border-border/50", viewMode === 'list_compact' ? "h-4 w-4" : "h-5 w-5")}
                >
                  {node.expanded ? <ChevronDown className={cn(viewMode === 'list_compact' ? "h-3 w-3" : "h-3 w-3")} /> : <ChevronRight className={cn(viewMode === 'list_compact' ? "h-3 w-3" : "h-3 w-3")} />}
                </button>
              ) : (
                <span className={cn("shrink-0", viewMode === 'list_compact' ? "w-4" : "w-5")} />
              )}

              <div className={cn("flex items-center justify-center shrink-0 text-muted-foreground z-10 bg-background rounded-full", viewMode === 'list_compact' ? "h-4 w-4" : "h-5 w-5")}>
                {hasChildren ? (
                  node.expanded ? <FolderOpen className={cn("text-blue-500 fill-blue-500/20", viewMode === 'list_compact' ? "h-3.5 w-3.5" : "h-4 w-4")} /> : <Folder className={cn("text-blue-500 fill-blue-500/20", viewMode === 'list_compact' ? "h-3.5 w-3.5" : "h-4 w-4")} />
                ) : isAux ? (
                  <Users className={cn("text-orange-500", viewMode === 'list_compact' ? "h-3.5 w-3.5" : "h-4 w-4")} />
                ) : (
                  <FileText className={cn("text-slate-400", viewMode === 'list_compact' ? "h-3.5 w-3.5" : "h-4 w-4")} />
                )}
              </div>

              <div
                className={cn("flex items-center justify-center rounded font-bold shrink-0 shadow-sm z-10", viewMode === 'list_compact' ? "h-4 px-1 text-[9px]" : "h-5 px-1.5 text-[10px]")}
                style={{
                  backgroundColor: `hsl(var(--chart-${((parseInt(node.classe) - 1) % 5) + 1}) / 0.15)`,
                  color: `hsl(var(--chart-${((parseInt(node.classe) - 1) % 5) + 1}))`,
                }}
              >
                {node.classe}
              </div>
            </div>
          )}

          {preferences.showCompte !== false && (
            <div className={cn("w-full shrink-0 z-10 pr-2 flex items-center", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 h-full")}>
              <span className={cn(
                "font-mono font-semibold",
                viewMode === 'list_compact' ? 'text-[11px] leading-tight' : 'text-sm',
                preferences.hideParents && isAux ? "text-orange-500" : "text-foreground/90"
              )}>
                {node.numero}
              </span>
            </div>
          )}

          {preferences.showCodeAfs !== false && (
            <div className={cn("w-full shrink-0 flex items-center z-10", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 h-full")}>
              {node.code_poste_etats_financiers ? (
                <Badge variant="outline" className={cn("font-mono bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-200/50", viewMode === 'list_compact' ? "text-[9px] px-1 py-0 h-4 leading-none" : "text-[9px]")}>
                  {node.code_poste_etats_financiers}
                </Badge>
              ) : (
                <span className="text-muted-foreground/30 text-xs">-</span>
              )}
            </div>
          )}

          {preferences.showIntitule !== false && (
            <div className={cn("w-full shrink-0 z-10 pr-2 min-w-0 flex items-center", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 h-full")}>
              <span className={cn("block truncate font-medium text-foreground/80", viewMode === 'list_compact' ? 'text-[11px] leading-tight' : 'text-sm')} title={node.libelle}>{node.libelle}</span>
            </div>
          )}

          {preferences.showNature !== false && (
            <div className={cn("w-full shrink-0 flex items-center z-10", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 h-full")}>
              <Badge variant={isAux ? 'secondary' : 'outline'} className={cn("font-semibold", isAux ? "bg-orange-500/10 text-orange-600 border-orange-200" : "text-muted-foreground border-border/50", viewMode === 'list_compact' ? "text-[9px] h-4 px-1 py-0 leading-none" : "text-[9px] h-4 px-1.5")}>
                {isAux ? 'Auxiliaire' : 'Général'}
              </Badge>
            </div>
          )}

          {preferences.showDetails !== false && (
            <div className={cn("w-full shrink-0 flex flex-col justify-center gap-0 z-10", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 h-full")}>
              {isAux && node.tiers?.type && (
                <div className={cn("flex items-center text-muted-foreground", viewMode === 'list_compact' ? "text-[9px] leading-tight" : "text-[10px]")}>
                  <Users className={cn("mr-1", viewMode === 'list_compact' ? "h-2.5 w-2.5" : "h-2.5 w-2.5")} /> <span className="capitalize">{node.tiers.type}</span>
                </div>
              )}
              {node.lettrable && (
                <div className={cn("flex items-center text-emerald-600 dark:text-emerald-400", viewMode === 'list_compact' ? "text-[9px] leading-tight" : "text-[10px]")}>
                  <span className="h-1 w-1 rounded-full bg-emerald-500 mr-1"></span> Lettrable
                </div>
              )}
              {node.parent && (
                <div className={cn("flex items-center text-muted-foreground", viewMode === 'list_compact' ? "text-[9px] leading-tight" : "text-[10px]")}>
                  <span className={cn("font-mono opacity-70 bg-muted rounded", viewMode === 'list_compact' ? "text-[9px] px-1" : "text-[9px] px-1")}>↗ {node.parent}</span>
                </div>
              )}
            </div>
          )}

          {preferences.showDebit !== false && (
            <div className={cn("w-full text-right shrink-0 z-10 flex items-center justify-end", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 h-full")}>
              <span className={cn("font-mono font-medium text-foreground/90", viewMode === 'list_compact' ? 'text-[11px] leading-none' : 'text-[13px]')}>{node.soldeDebit ? formatCurrency(node.soldeDebit) : '-'}</span>
            </div>
          )}
          {preferences.showCredit !== false && (
            <div className={cn("w-full text-right shrink-0 z-10 flex items-center justify-end", viewMode === 'list_excel' && "px-2 py-1 h-full")}>
              <span className={cn("font-mono font-medium text-foreground/90", viewMode === 'list_compact' ? 'text-[11px] leading-none' : 'text-[13px]')}>{node.soldeCredit ? formatCurrency(node.soldeCredit) : '-'}</span>
            </div>
          )}

        </div>

        {hasChildren && node.expanded && (
          <div className="flex flex-col">
            {node.children!.map((child, index) =>
              renderTreeNode(
                child,
                depth + 1,
                index === node.children!.length - 1,
                [...parentLines, isLastChild]
              )
            )}
          </div>
        )}
      </div>
    );
  };



  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-5.5rem)] animate-fade-in -mt-2 lg:-mt-4 pb-0">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 shrink-0">
        {/* LEFT ALIGNED BUTTONS (View modes) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {/* View Buttons */}
          <div className="flex items-center p-0.5 rounded-md bg-muted border border-border/50">
            <Button
              variant={viewMode === 'list_modern' ? 'default' : 'ghost'}
              size="sm"
              className={cn("h-7 px-2.5 text-[11px] font-medium transition-colors", viewMode === 'list_modern' && "shadow-md")}
              onClick={() => handleViewModeChange('list_modern')}
            >
              <List className="h-3 w-3 mr-1.5" />
              Moderne
            </Button>
            <Button
              variant={viewMode === 'list_excel' ? 'default' : 'ghost'}
              size="sm"
              className={cn("h-7 px-2.5 text-[11px] font-medium transition-colors", viewMode === 'list_excel' && "shadow-md")}
              onClick={() => handleViewModeChange('list_excel')}
            >
              <LayoutGrid className="h-3 w-3 mr-1.5" />
              Tableur
            </Button>
            <Button
              variant={viewMode === 'list_compact' ? 'default' : 'ghost'}
              size="sm"
              className={cn("h-7 px-2.5 text-[11px] font-medium transition-colors", viewMode === 'list_compact' && "shadow-md")}
              onClick={() => handleViewModeChange('list_compact')}
            >
              <AlignJustify className="h-3 w-3 mr-1.5" />
              Compact
            </Button>
          </div>
        </div>

        {/* RIGHT ALIGNED BUTTONS (Actions) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 shadow-sm bg-background relative" title={filterClass === 'all' ? 'Toutes les classes' : `Classe ${filterClass}`}>
                <Filter className="h-3.5 w-3.5" />
                {filterClass !== 'all' && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border/50 shadow-md rounded-lg">
              <DropdownMenuItem onClick={() => setFilterClass('all')} className="cursor-pointer text-xs font-medium focus:bg-muted">
                Toutes les classes
              </DropdownMenuItem>
              {CLASSES_SYSCOHADA.map(c => (
                <DropdownMenuItem key={c.classe} onClick={() => setFilterClass(c.classe)} className="cursor-pointer text-[11px] font-medium focus:bg-muted flex items-center gap-2">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white shadow-sm" style={{ backgroundColor: c.couleur }}>{c.classe}</span>
                  {c.libelle}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Configuration d'affichage */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 shadow-sm bg-background" title="Configuration de l'affichage">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4 bg-background border border-border/50 shadow-md rounded-lg flex flex-col gap-4 z-50">
              <div className="flex flex-col gap-1 border-b pb-2">
                <h4 className="font-semibold text-xs text-foreground">Options d'affichage</h4>
                <p className="text-[10px] text-muted-foreground">Personnalisez les colonnes et éléments affichés.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                {/* Switch pour masquer les parents */}
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="pref-hide-parents" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                    6 chiffres uniquement
                  </Label>
                  <Switch
                    id="pref-hide-parents"
                    checked={!!preferences.hideParents}
                    onCheckedChange={handleToggleHideParents}
                    className="scale-75 data-[state=checked]:bg-primary"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Colonnes à afficher</span>
                  
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="col-compte" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">Compte</Label>
                    <Switch
                      id="col-compte"
                      checked={preferences.showCompte !== false}
                      onCheckedChange={(checked) => handleTogglePreference('showCompte', checked)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="col-intitule" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">Intitulé</Label>
                    <Switch
                      id="col-intitule"
                      checked={preferences.showIntitule !== false}
                      onCheckedChange={(checked) => handleTogglePreference('showIntitule', checked)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="col-code-afs" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">Code AFS/EF</Label>
                    <Switch
                      id="col-code-afs"
                      checked={preferences.showCodeAfs !== false}
                      onCheckedChange={(checked) => handleTogglePreference('showCodeAfs', checked)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="col-nature" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">Nature</Label>
                    <Switch
                      id="col-nature"
                      checked={preferences.showNature !== false}
                      onCheckedChange={(checked) => handleTogglePreference('showNature', checked)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="col-details" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">Détails</Label>
                    <Switch
                      id="col-details"
                      checked={preferences.showDetails !== false}
                      onCheckedChange={(checked) => handleTogglePreference('showDetails', checked)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="col-debit" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">Débit</Label>
                    <Switch
                      id="col-debit"
                      checked={preferences.showDebit !== false}
                      onCheckedChange={(checked) => handleTogglePreference('showDebit', checked)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="col-credit" className="text-[11px] font-medium cursor-pointer text-muted-foreground hover:text-foreground">Crédit</Label>
                    <Switch
                      id="col-credit"
                      checked={preferences.showCredit !== false}
                      onCheckedChange={(checked) => handleTogglePreference('showCredit', checked)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 shadow-sm bg-background" title="Exporter">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background border-border/50 shadow-md rounded-lg">
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer text-[11px] font-medium focus:bg-muted focus:text-foreground">
                Exporter en Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer text-[11px] font-medium focus:bg-muted focus:text-foreground">
                Exporter en PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Stats */}
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 shadow-sm bg-background border-primary/20 text-primary hover:bg-primary/10" onClick={() => setStatsDialogOpen(true)} title="Statistiques">
            <PieChart className="h-3.5 w-3.5" />
          </Button>

          {/* Nouveau */}
          <Button size="sm" className="h-7 w-7 p-0 shadow-sm bg-primary hover:bg-primary/90 ml-1" onClick={openCreate} title="Nouveau compte auxiliaire">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className={cn("border-border/50 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0", viewMode === 'kanban' && "bg-transparent border-0 shadow-none")}>
        <div className={cn("p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0", viewMode === 'list' ? "border-b border-border/50 bg-muted/10" : "mb-1")}>
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-sm font-bold text-foreground/80">Comptes <Badge variant="secondary" className="ml-1 font-mono text-[10px] bg-muted">{filteredTree.length}</Badge></h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher (N°, libellé)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background border-border/50 shadow-sm"
              />
              {search && (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-transparent" onClick={() => { setSearch(''); setFilterClass('all'); }}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {viewMode.startsWith('list') && (
          <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar relative flex flex-col">
            <div className="w-fit min-w-full flex flex-col min-h-max">
              <div 
                className={cn(
                  "sticky top-0 z-20 grid items-stretch bg-muted/90 backdrop-blur-md border-b text-[10px] font-bold text-foreground/90 uppercase tracking-wider shrink-0 min-w-full w-full",
                  viewMode === 'list_excel' ? 'py-0 px-0 border-t border-l border-r border-b-2 border-slate-300 dark:border-slate-600 bg-muted' : 'py-1.5 px-4 border-border/50'
                )}
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {!preferences.hideParents && <div className={cn("w-full shrink-0 flex items-center", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 py-1 min-h-[24px]")}>Structure</div>}
                {preferences.showCompte !== false && (
                  <div className={cn("w-full shrink-0 flex items-center", viewMode === 'list_excel' ? "border-r border-slate-300 dark:border-slate-600 px-2 py-1 min-h-[24px]" : "pr-2")}>Compte</div>
                )}
                {preferences.showCodeAfs !== false && <div className={cn("w-full shrink-0 flex items-center", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 py-1 min-h-[24px]")}>Code AFS/EF</div>}
                {preferences.showIntitule !== false && (
                  <div className={cn("w-full shrink-0 min-w-0 flex items-center", viewMode === 'list_excel' ? "border-r border-slate-300 dark:border-slate-600 px-2 py-1 min-h-[24px]" : "pr-2")}>Intitulé</div>
                )}
                {preferences.showNature !== false && <div className={cn("w-full shrink-0 flex items-center", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 py-1 min-h-[24px]")}>Nature</div>}
                {preferences.showDetails !== false && <div className={cn("w-full shrink-0 flex items-center", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 py-1 min-h-[24px]")}>Détails</div>}
                {preferences.showDebit !== false && <div className={cn("w-full shrink-0 flex items-center justify-end", viewMode === 'list_excel' && "border-r border-slate-300 dark:border-slate-600 px-2 py-1 min-h-[24px]")}>Débit</div>}
                {preferences.showCredit !== false && <div className={cn("w-full shrink-0 flex items-center justify-end", viewMode === 'list_excel' && "px-2 py-1 min-h-[24px]")}>Crédit</div>}
              </div>

              <div className="flex flex-col w-full flex-1">
                {loading ? (
                  <div className="flex flex-col w-full">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div key={i} className={cn("grid items-center min-w-full w-full gap-2", viewMode === 'list_compact' ? 'py-1 px-2' : 'py-2 px-4', "border-b border-border/30")} style={{ gridTemplateColumns: gridTemplate }}>
                        {!preferences.hideParents && <div className="h-4 w-12 bg-muted/60 rounded animate-pulse" />}
                        {preferences.showCompte !== false && <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />}
                        {preferences.showCodeAfs !== false && <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />}
                        {preferences.showIntitule !== false && <div className="h-4 w-full max-w-[200px] bg-muted/60 rounded animate-pulse" />}
                        {preferences.showNature !== false && <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />}
                        {preferences.showDetails !== false && <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />}
                        {preferences.showDebit !== false && <div className="h-4 w-20 bg-muted/60 rounded animate-pulse justify-self-end" />}
                        {preferences.showCredit !== false && <div className="h-4 w-20 bg-muted/60 rounded animate-pulse justify-self-end" />}
                      </div>
                    ))}
                  </div>
                ) : filteredTree.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center h-full">
                    <BookOpen className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">
                      Aucun compte trouvé {search ? `pour « ${search} »` : (filterClass !== 'all' ? `pour la classe ${filterClass}` : '')}
                    </p>
                  </div>
                ) : (
                  filteredTree.map((node, index) => renderTreeNode(node, 0, index === filteredTree.length - 1, []))
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCompte ? 'Modifier le compte' : 'Nouveau compte auxiliaire'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="libelle">Libellé</Label>
              <Input
                id="libelle"
                placeholder="ex: Dangote Cement Zambia"
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">Compte parent (Général)</Label>
              <Select 
                value={form.parent} 
                onValueChange={(v) => {
                  if (!editingCompte) {
                    const prefix = v === '411100' ? '4111' : (v === '401100' ? '401' : v.substring(0, 3));
                    const auxAccounts = rawComptes.filter(c => c.type === 'auxiliaire' && c.numero.startsWith(prefix) && /^\d+$/.test(c.numero));
                    let nextNum = `${prefix}${'1'.padStart(Math.max(6 - prefix.length, 2), '0')}`;
                    if (auxAccounts.length > 0) {
                      const maxAcc = auxAccounts.reduce((max, c) => parseInt(c.numero) > parseInt(max.numero) ? c : max, auxAccounts[0]);
                      const suffix = maxAcc.numero.substring(prefix.length);
                      const nextSuffix = (parseInt(suffix) + 1).toString().padStart(Math.max(6 - prefix.length, 2), '0');
                      nextNum = `${prefix}${nextSuffix}`;
                    }
                    const parentAcc = rawComptes.find(c => c.numero === v);
                    const afs = parentAcc?.code_poste_etats_financiers || '';
                    setForm(prev => ({ ...prev, numero: nextNum, parent: v, code_poste_etats_financiers: afs }));
                  } else {
                    setForm(prev => ({ ...prev, parent: v }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte parent" />
                </SelectTrigger>
                <SelectContent>
                  {rawComptes.filter((c) => c.numero === '411100' || c.numero === '401100').map((c) => (
                    <SelectItem key={c.numero} value={c.numero}>
                      {c.numero} - {c.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Numéro de compte</Label>
                <Input
                  id="numero"
                  placeholder="Auto-généré"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  disabled
                  className="bg-muted/50 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code_poste_etats_financiers">Code AFS/EF</Label>
                <Input
                  id="code_poste_etats_financiers"
                  placeholder="Hérité"
                  value={form.code_poste_etats_financiers}
                  onChange={(e) => setForm({ ...form, code_poste_etats_financiers: e.target.value })}
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="lettrable" className="cursor-pointer">Compte lettrable</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Autorise le lettrage des écritures</p>
              </div>
              <Switch
                id="lettrable"
                checked={form.lettrable}
                onCheckedChange={(v) => setForm({ ...form, lettrable: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSave}>{editingCompte ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Vous êtes sur le point de supprimer le compte auxiliaire <strong className="text-foreground">{compteToDelete?.numero} - {compteToDelete?.libelle}</strong> de manière permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-md border-border/60 shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/20">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Statistiques du Plan Comptable
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
                <CardContent className="p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Comptes</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">{stats.total}</span>
                  <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                    <span>Généraux: <strong className="text-foreground">{stats.generalCount}</strong></span>
                    <span>Auxiliaires: <strong className="text-foreground">{stats.auxCount}</strong></span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-emerald-500/5">
                <CardContent className="p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Mouvements Débit</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.totalDebit)}</span>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-rose-500/5">
                <CardContent className="p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Mouvements Crédit</span>
                  </div>
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(stats.totalCredit)}</span>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-primary/5">
                <CardContent className="p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Solde Global</span>
                  </div>
                  <span className={cn("text-2xl font-bold", stats.totalDebit - stats.totalCredit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {formatCurrency(Math.abs(stats.totalDebit - stats.totalCredit))}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">{stats.totalDebit - stats.totalCredit >= 0 ? 'Débiteur' : 'Créditeur'}</span>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-foreground/80 mb-3 flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
                Répartition par Classe
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.classBreakdown.map((cb) => (
                  <div key={cb.classe} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-xs" style={{ backgroundColor: cb.couleur }}>
                        {cb.classe}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{cb.libelle}</span>
                        <span className="text-xs text-muted-foreground">{cb.count} comptes</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-foreground/80 bg-background px-2.5 py-1 rounded-md shadow-sm border border-border/40">
                      {Math.round((cb.count / stats.total) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-border/50 bg-muted/10">
            <DialogClose asChild>
              <Button variant="outline" className="shadow-sm">Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
