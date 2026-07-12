'use client';

import { useState, useMemo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompte, setEditingCompte] = useState<CompteComptable | null>(null);
  const [form, setForm] = useState({
    numero: '',
    libelle: '',
    parent: '',
    lettable: false,
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
            node.numero.toLowerCase().includes(term) ||
            node.libelle.toLowerCase().includes(term) ||
            (node.tiers?.nom.toLowerCase().includes(term) ?? false);
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

  const openCreate = () => {
    setEditingCompte(null);
    setForm({ numero: '', libelle: '', parent: '', lettable: false, type: 'auxiliaire' });
    setDialogOpen(true);
  };

  const openEdit = (compte: CompteComptable) => {
    setEditingCompte(compte);
    setForm({
      numero: compte.numero,
      libelle: compte.libelle,
      parent: compte.parent || '',
      lettable: compte.lettable,
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

  const handleDelete = async (compte: CompteComptable) => {
    try {
      await fetchWithAuth(`/plan_comptable/comptes/${compte.numero}/`, {
        method: 'DELETE',
      });
      toast.success('Compte supprime', { description: compte.numero });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression du compte');
    }
  };

  const renderNode = (node: CompteNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isAux = node.type === 'auxiliaire';
    return (
      <div key={node.numero}>
        <div
          className={cn(
            'flex items-center px-4 py-1.5 hover:bg-muted/40 transition-colors group border-b border-border/30 last:border-0',
            isAux && 'bg-muted/5'
          )}
        >
          {/* Main Info Column absorbing indentation */}
          <div className="flex-1 min-w-0 flex items-center gap-3" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren ? (
              <button
                onClick={() => handleToggle(node.numero)}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {node.expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}

            <div
              className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold shrink-0 shadow-sm"
              style={{
                backgroundColor: `hsl(var(--chart-${((parseInt(node.classe) - 1) % 5) + 1}) / 0.15)`,
                color: `hsl(var(--chart-${((parseInt(node.classe) - 1) % 5) + 1}))`,
              }}
            >
              {node.classe}
            </div>

            <span className="font-mono text-sm font-semibold shrink-0 w-24 text-foreground/90">{node.numero}</span>
            <span className="text-sm truncate font-medium text-foreground/80">{node.libelle}</span>
            
            {isAux && (
              <Badge variant="secondary" className="text-[9px] h-4 shrink-0 px-1.5 font-semibold bg-muted text-muted-foreground">
                <Users className="h-2.5 w-2.5 mr-1" />
                {node.tiers?.type}
              </Badge>
            )}
            {node.lettable && !isAux && (
              <Badge variant="outline" className="text-[9px] h-4 shrink-0 px-1.5 font-semibold text-muted-foreground border-border/50">Lettable</Badge>
            )}
          </div>

          {/* Fixed right columns */}
          <div className="w-28 text-right shrink-0">
            <span className="font-mono text-[13px] font-medium text-foreground/90">{node.soldeDebit ? formatCurrency(node.soldeDebit) : '-'}</span>
          </div>
          <div className="w-28 text-right shrink-0">
            <span className="font-mono text-[13px] font-medium text-foreground/90">{node.soldeCredit ? formatCurrency(node.soldeCredit) : '-'}</span>
          </div>

          {/* Actions */}
          <div className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(node)}>
               <Pencil className="h-3 w-3" />
             </Button>
             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(node)}>
               <Trash2 className="h-3 w-3" />
             </Button>
          </div>
        </div>
        {hasChildren && node.expanded && node.children!.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground/90">Plan Comptable SYSCOHADA</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">
            Arborescence interactive • 8 classes • Comptes auxiliaires (Tiers)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium shadow-sm" onClick={() => toast.info('Import CSV en cours...')}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Importer
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium shadow-sm" onClick={() => toast.success('Plan exporté en CSV')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exporter
          </Button>
          <Button size="sm" className="h-8 text-xs font-semibold shadow-sm bg-primary hover:bg-primary/90" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouveau Compte Auxiliaire
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button 
          variant={filterClass === 'all' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilterClass('all')}
          className="h-7 rounded-full text-[11px] px-3 font-semibold shadow-sm"
        >
          Toutes les classes
        </Button>
        {CLASSES_SYSCOHADA.map((c) => (
          <button
            key={c.classe}
            onClick={() => setFilterClass(filterClass === c.classe ? 'all' : c.classe)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors shadow-sm',
              filterClass === c.classe 
                ? 'bg-foreground text-background border-foreground' 
                : 'bg-background hover:bg-muted border-border/60'
            )}
          >
            <span 
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold"
              style={{ backgroundColor: filterClass === c.classe ? 'rgba(255,255,255,0.2)' : `${c.couleur}20`, color: filterClass === c.classe ? 'white' : c.couleur }}
            >
              {c.classe}
            </span>
            {c.libelle}
          </button>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col">
        <div className="p-2.5 border-b border-border/50 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        
        {/* Table Header */}
        <div className="flex items-center px-4 py-2 bg-muted/30 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
           <div className="flex-1 min-w-0 flex items-center gap-3">
             <span className="w-5 shrink-0" />
             <span className="w-5 shrink-0" />
             <span className="w-24 shrink-0">Compte</span>
             <span>Libellé</span>
           </div>
           <div className="w-28 text-right shrink-0">Débit</div>
           <div className="w-28 text-right shrink-0">Crédit</div>
           <div className="w-16 shrink-0 text-right pr-2">Actions</div>
        </div>

        <CardContent className="p-0 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="flex flex-col">
            {filteredTree.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Aucun compte trouvé pour « {search} »</p>
              </div>
            ) : (
              filteredTree.map((node) => renderNode(node))
            )}
          </div>
        </CardContent>
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
                <Label htmlFor="lettable" className="cursor-pointer">Compte lettable</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Autorise le lettrage des ecritures</p>
              </div>
              <Switch
                id="lettable"
                checked={form.lettable}
                onCheckedChange={(v) => setForm({ ...form, lettable: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSave}>{editingCompte ? 'Enregistrer' : 'Creer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
