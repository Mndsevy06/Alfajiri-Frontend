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
} from 'lucide-react';
import Tree from 'react-d3-tree';
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
  const [viewMode, setViewMode] = useState<'list' | 'orgchart' | 'kanban'>('list');
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 400, y: 50 });



  const loadData = async () => {
    try {
      const data = await fetchWithAuth('/plan_comptable/comptes/');
      setRawComptes(data);
      setComptes(buildTree(data));
    } catch (error) {
      toast.error('Erreur lors du chargement du plan comptable');
    }
  };

  useEffect(() => {
    loadData();
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

  const filteredTree = useMemo(() => {
    if (!search && filterClass === 'all') return comptes;
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
    let result = filterNode(comptes);
    if (filterClass !== 'all') {
      result = result.filter((n) => n.classe === filterClass);
    }
    return result;
  }, [comptes, search, filterClass]);

  useEffect(() => {
    if (viewMode === 'orgchart' && containerRef.current) {
      setTranslate({
        x: containerRef.current.clientWidth / 2,
        y: 60
      });
    }
  }, [viewMode, filteredTree]);

  const openCreate = () => {
    setEditingCompte(null);
    setForm({ numero: '', libelle: '', parent: '', lettrable: false, type: 'auxiliaire' });
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
        if (children && children.length > 0) {
          result = result.concat(flattenTree(children, depth + 1));
        }
      }
      return result;
    };
    return flattenTree(comptes);
  };

  const exportToExcel = () => {
    try {
      const dataToExport = getExportData().map(c => ({
        'Numéro': c.numero,
        'Libellé': '  '.repeat(c.depth) + c.libelle,
        'Classe': c.classe,
        'Nature': c.type === 'general' ? 'Général' : 'Auxiliaire',
        'Compte Parent': c.parent || '-',
        'Lettrable': c.lettrable ? 'Oui' : 'Non',
        'Tiers Rattaché': c.tiers?.type || '-',
        'Solde Débit': c.soldeDebit || 0,
        'Solde Crédit': c.soldeCredit || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Plan Comptable");

      const maxWidths = [15, 40, 10, 15, 15, 10, 15, 15, 15];
      worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));

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

      const tableData = getExportData().map(c => [
        c.numero,
        '  '.repeat(c.depth) + c.libelle,
        c.type === 'general' ? 'Général' : 'Auxiliaire',
        c.parent || '-',
        c.soldeDebit ? formatCurrency(c.soldeDebit) : '-',
        c.soldeCredit ? formatCurrency(c.soldeCredit) : '-'
      ]);

      autoTable(doc, {
        startY: 80,
        head: [['Compte', 'Libellé', 'Nature', 'Parent', 'Débit', 'Crédit']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 150 },
          4: { halign: 'right' },
          5: { halign: 'right' }
        },
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
            'flex items-center py-1.5 group relative hover:bg-muted/30 transition-colors',
            isAux && 'bg-muted/5'
          )}
        >
          <div className="flex h-full absolute left-0 top-0 bottom-0 pointer-events-none pl-4">
            {lines}
            {depth > 0 && (
              <div className="w-6 shrink-0 h-1/2 border-l-2 border-b-2 border-primary/30 rounded-bl-md relative top-0" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-2" style={{ paddingLeft: `${4 + depth * 24 + (depth > 0 ? 12 : 0)}px` }}>
            {hasChildren ? (
              <button
                onClick={() => handleToggle(node.numero)}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted shrink-0 text-muted-foreground hover:text-foreground transition-colors z-10 bg-background shadow-sm border border-border/50"
              >
                {node.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}

            <div className="shrink-0 text-muted-foreground z-10 bg-background rounded-full">
              {hasChildren ? (
                node.expanded ? <FolderOpen className="h-4 w-4 text-blue-500 fill-blue-500/20" /> : <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
              ) : isAux ? (
                <Users className="h-4 w-4 text-orange-500" />
              ) : (
                <FileText className="h-4 w-4 text-slate-400" />
              )}
            </div>

            <div
              className="flex h-5 px-1.5 items-center justify-center rounded text-[10px] font-bold shrink-0 shadow-sm z-10"
              style={{
                backgroundColor: `hsl(var(--chart-${((parseInt(node.classe) - 1) % 5) + 1}) / 0.15)`,
                color: `hsl(var(--chart-${((parseInt(node.classe) - 1) % 5) + 1}))`,
              }}
            >
              {node.classe}
            </div>

            <span className="font-mono text-sm font-semibold shrink-0 text-foreground/90">{node.numero}</span>
            <span className="text-sm truncate font-medium text-foreground/80">{node.libelle}</span>
          </div>

          <div className="w-24 shrink-0 flex items-center z-10">
            <Badge variant={isAux ? 'secondary' : 'outline'} className={cn("text-[9px] h-4 px-1.5 font-semibold", isAux ? "bg-orange-500/10 text-orange-600 border-orange-200" : "text-muted-foreground border-border/50")}>
              {isAux ? 'Auxiliaire' : 'Général'}
            </Badge>
          </div>

          <div className="w-32 shrink-0 flex flex-col justify-center gap-0.5 z-10">
            {isAux && node.tiers?.type && (
              <div className="flex items-center text-[10px] text-muted-foreground">
                <Users className="h-2.5 w-2.5 mr-1.5" /> <span className="capitalize">{node.tiers.type}</span>
              </div>
            )}
            {node.lettrable && (
              <div className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Lettrable
              </div>
            )}
            {node.parent && (
              <div className="flex items-center text-[10px] text-muted-foreground">
                <span className="font-mono text-[9px] opacity-70 bg-muted px-1 rounded">↗ {node.parent}</span>
              </div>
            )}
          </div>

          <div className="w-28 text-right shrink-0 z-10">
            <span className="font-mono text-[13px] font-medium text-foreground/90">{node.soldeDebit ? formatCurrency(node.soldeDebit) : '-'}</span>
          </div>
          <div className="w-28 text-right shrink-0 z-10">
            <span className="font-mono text-[13px] font-medium text-foreground/90">{node.soldeCredit ? formatCurrency(node.soldeCredit) : '-'}</span>
          </div>

          <div className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-4 z-10">
            {isAux && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground bg-background/50" onClick={() => openEdit(node)} title="Modifier ce compte auxiliaire">
                  <Pencil className="h-3 w-3" />
                </Button>
                {!hasChildren && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 bg-background/50" onClick={() => confirmDelete(node)} title="Supprimer ce compte">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>
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

  const renderKanbanView = () => {
    if (filteredTree.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border/50">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Aucun compte trouvé pour « {search} »</p>
        </div>
      );
    }

    return (
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start min-h-[60vh]">
        {filteredTree.map((rootNode) => (
          <div key={rootNode.numero} className="flex-shrink-0 w-80 bg-muted/20 border border-border/60 shadow-sm rounded-xl flex flex-col max-h-[60vh]">
            <div className="p-3 border-b border-border/60 bg-muted/40 rounded-t-xl flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold shadow-sm"
                  style={{
                    backgroundColor: `hsl(var(--chart-${((parseInt(rootNode.classe) - 1) % 5) + 1}) / 0.15)`,
                    color: `hsl(var(--chart-${((parseInt(rootNode.classe) - 1) % 5) + 1}))`,
                  }}
                >
                  {rootNode.classe}
                </div>
                <h3 className="font-semibold text-sm text-foreground/90 truncate max-w-[180px]" title={rootNode.libelle}>{rootNode.libelle}</h3>
              </div>
              <Badge variant="secondary" className="text-xs bg-background shadow-sm border border-border/50">{rootNode.children?.length || 0}</Badge>
            </div>

            <div className="p-2.5 overflow-y-auto flex-1 flex flex-col gap-2.5 custom-scrollbar">
              {rootNode.children?.map((child) => (
                <Card key={child.numero} className="shadow-sm border-border/50 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group bg-background/90 hover:bg-background">
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {child.type === 'auxiliaire' ? <Users className="h-4 w-4 text-orange-500" /> : <Folder className="h-4 w-4 text-blue-500 fill-blue-500/10" />}
                        <span className="font-mono text-sm font-bold text-foreground/90">{child.numero}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {child.type === 'auxiliaire' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted" onClick={() => openEdit(child)} title="Modifier ce compte auxiliaire">
                              <Pencil className="h-3 w-3" />
                            </Button>
                            {(!child.children || child.children.length === 0) && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 bg-muted/50 hover:bg-muted" onClick={(e) => { e.stopPropagation(); confirmDelete(child); }} title="Supprimer ce compte">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight line-clamp-2" title={child.libelle}>{child.libelle}</p>
                    {(child.soldeDebit > 0 || child.soldeCredit > 0) && (
                      <div className="flex items-center justify-between pt-2.5 border-t border-border/40 mt-1">
                        {child.soldeDebit > 0 && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">D: {formatCurrency(child.soldeDebit)}</span>}
                        {child.soldeCredit > 0 && <span className="text-xs font-medium text-rose-600 dark:text-rose-400">C: {formatCurrency(child.soldeCredit)}</span>}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              {(!rootNode.children || rootNode.children.length === 0) && (
                <div className="text-center py-6 text-muted-foreground text-xs opacity-60">
                  Aucun compte
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOrgChart = () => {
    const formatNode = (node: CompteNode): any => {
      return {
        name: node.numero,
        attributes: {
          libelle: node.libelle,
          classe: node.classe,
          type: node.type,
          soldeDebit: node.soldeDebit,
          soldeCredit: node.soldeCredit,
        },
        children: node.children?.map(formatNode) || []
      };
    };

    const treeData = {
      name: "Plan Comptable",
      attributes: { libelle: "SYSCOHADA", classe: "0", type: "general" },
      children: filteredTree.map(formatNode)
    };

    const renderCustomNodeElement = ({ nodeDatum, toggleNode }: any) => {
      const isRoot = nodeDatum.name === "Plan Comptable";
      const isAux = nodeDatum.attributes?.type === 'auxiliaire';
      const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
      const isCollapsed = nodeDatum.__rd3t.collapsed;
      const classNum = parseInt(nodeDatum.attributes?.classe) || 1;

      return (
        <g>
          <foreignObject x="-80" y="-30" width="160" height="70">
            <div
              className={cn(
                "relative flex flex-col p-2 bg-card border border-border/50 rounded-lg shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer w-[160px] h-[65px] group",
                isAux ? "border-t-4 border-t-orange-500" : isRoot ? "border-t-4 border-t-slate-800 dark:border-t-slate-200" : `border-t-4`
              )}
              style={!isAux && !isRoot ? { borderTopColor: `hsl(var(--chart-${((classNum - 1) % 5) + 1}))` } : undefined}
              onClick={toggleNode}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-xs text-foreground/90 font-mono tracking-tight truncate pr-1">{nodeDatum.name}</span>
                {isAux && <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-orange-500/10 text-orange-600 uppercase shrink-0">Aux</span>}
              </div>
              <p className="text-[9px] leading-tight text-muted-foreground line-clamp-2 font-medium group-hover:text-foreground/80 transition-colors">
                {nodeDatum.attributes?.libelle}
              </p>

              {hasChildren && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background border border-border text-foreground hover:bg-muted shadow-sm rounded-full h-5 w-5 flex items-center justify-center transition-colors z-10">
                  <ChevronDown className={cn("h-3 w-3 text-primary transition-transform", !isCollapsed && "rotate-180")} />
                </div>
              )}

              {hasChildren && isCollapsed && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm ring-2 ring-background">
                  {nodeDatum.children.length}
                </div>
              )}
            </div>
          </foreignObject>
        </g>
      );
    };

    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} className="border border-border/50 rounded-md bg-muted/5 relative overflow-hidden cursor-move">
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="step"
          renderCustomNodeElement={renderCustomNodeElement}
          translate={translate}
          zoomable={true}
          collapsible={true}
          initialDepth={1}
          nodeSize={{ x: 180, y: 120 }}
          separation={{ siblings: 1.1, nonSiblings: 1.3 }}
          enableLegacyTransitions={true}
          transitionDuration={300}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-5.5rem)] animate-fade-in -mt-2 lg:-mt-4 pb-0">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 shrink-0">
        {/* LEFT ALIGNED BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 shadow-sm bg-background">
                <Filter className="h-3 w-3 mr-1.5" />
                {filterClass === 'all' ? 'Toutes les classes' : `Classe ${filterClass}`}
                <ChevronDown className="h-3 w-3 ml-1" />
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

          {/* Import */}
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 shadow-sm bg-background" onClick={() => toast.info('Import CSV en cours...')}>
            <Upload className="h-3 w-3 mr-1.5" />
            Importer
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 shadow-sm bg-background">
                <Download className="h-3 w-3 mr-1.5" />
                Exporter
                <ChevronDown className="h-3 w-3 ml-1" />
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
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 shadow-sm bg-background border-primary/20 text-primary hover:bg-primary/10" onClick={() => setStatsDialogOpen(true)}>
            <PieChart className="h-3 w-3 mr-1.5" />
            Statistiques
          </Button>

          {/* Nouveau */}
          <Button size="sm" className="h-7 text-[11px] px-3 font-semibold shadow-sm bg-primary hover:bg-primary/90" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nouveau
          </Button>
        </div>

        {/* RIGHT ALIGNED BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {/* View Buttons */}
          <div className="flex items-center p-0.5 rounded-md bg-muted border border-border/50">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={cn("h-7 px-2.5 text-[11px] font-medium transition-colors", viewMode === 'list' && "shadow-md")}
              onClick={() => setViewMode('list')}
            >
              <List className="h-3 w-3 mr-1.5" />
              Liste
            </Button>
            <Button
              variant={viewMode === 'orgchart' ? 'default' : 'ghost'}
              size="sm"
              className={cn("h-7 px-2.5 text-[11px] font-medium transition-colors", viewMode === 'orgchart' && "shadow-md")}
              onClick={() => setViewMode('orgchart')}
            >
              <Network className="h-3 w-3 mr-1.5" />
              Arbre
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className={cn("h-7 px-2.5 text-[11px] font-medium transition-colors", viewMode === 'kanban' && "shadow-md")}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-3 w-3 mr-1.5" />
              Cartes
            </Button>
          </div>
        </div>
      </div>

      <Card className={cn("border-border/50 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0", viewMode === 'kanban' && "bg-transparent border-0 shadow-none")}>
        <div className={cn("p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0", viewMode === 'list' ? "border-b border-border/50 bg-muted/10" : "mb-1")}>
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-sm font-bold text-foreground/80">Comptes <Badge variant="secondary" className="ml-1 font-mono text-[10px] bg-muted">{filteredTree.length}</Badge></h2>
          </div>
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

        {viewMode === 'list' ? (
          <>
            <div className="flex items-center px-4 py-1.5 bg-muted/30 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <span className="w-5 shrink-0" />
                <span className="w-5 shrink-0" />
                <span className="w-24 shrink-0">Compte</span>
                <span>Libellé</span>
              </div>
              <div className="w-24 shrink-0">Nature</div>
              <div className="w-32 shrink-0">Détails</div>
              <div className="w-28 text-right shrink-0">Débit</div>
              <div className="w-28 text-right shrink-0">Crédit</div>
              <div className="w-16 shrink-0 text-right pr-2">Actions</div>
            </div>

            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col">
                {filteredTree.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Aucun compte trouvé pour « {search} »</p>
                  </div>
                ) : (
                  filteredTree.map((node, index) => renderTreeNode(node, 0, index === filteredTree.length - 1, []))
                )}
              </div>
            </CardContent>
          </>
        ) : viewMode === 'orgchart' ? (
          <CardContent className="p-0 flex-1 min-h-0">
            {renderOrgChart()}
          </CardContent>
        ) : (
          <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
            {renderKanbanView()}
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
              <Label htmlFor="numero">Numero de compte</Label>
              <Input
                id="numero"
                placeholder="ex: 401-DANGOTE"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="libelle">Libelle</Label>
              <Input
                id="libelle"
                placeholder="ex: Dangote Cement Zambia"
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">Compte parent</Label>
              <Select value={form.parent} onValueChange={(v) => setForm({ ...form, parent: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un compte parent" />
                </SelectTrigger>
                <SelectContent>
                  {rawComptes.filter((c) => c.type === 'general').map((c) => (
                    <SelectItem key={c.numero} value={c.numero}>
                      {c.numero} - {c.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="lettrable" className="cursor-pointer">Compte lettrable</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Autorise le lettrage des ecritures</p>
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
