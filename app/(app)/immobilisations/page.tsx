'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Download,
  Calculator,
  Trash2,
  Pencil,
  TrendingDown,
  Calendar,
  Loader2,
  FileIcon,
  Printer,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard, Button as NeonButton } from '@/components/ui/Layout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { toast } from 'sonner';
import { SITES } from '@/lib/mock-data';
import type { Immobilisation } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/api';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ImmobilisationsPage() {
  const [immos, setImmos] = useState<Immobilisation[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [simulating, setSimulating] = useState<Immobilisation | null>(null);
  const [amortissementPlan, setAmortissementPlan] = useState<any[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [sites, setSites] = useState<{id: string, label: string, short?: string}[]>([]);
  const [siteOpen, setSiteOpen] = useState(false);
  const [siteSearch, setSiteSearch] = useState('');
  
  const [form, setForm] = useState({
    id: undefined as string | undefined,
    code: '',
    libelle: '',
    categorie: 'Materiel de transport',
    valeurAcquisition: '',
    duree: '5',
    methode: 'lineaire' as 'lineaire' | 'degressive' | 'exceptionnelle' | 'unites_oeuvre',
    site: 'lubumbashi' as string,
    dateAcquisition: new Date().toISOString().split('T')[0],
  });

  const resetForm = () => setForm({
    id: undefined,
    code: '',
    libelle: '',
    categorie: 'Materiel de transport',
    valeurAcquisition: '',
    duree: '5',
    methode: 'lineaire',
    site: 'lubumbashi',
    dateAcquisition: new Date().toISOString().split('T')[0],
  });

  const fetchImmos = async () => {
    try {
      const data = await fetchWithAuth('/immobilisations/');
      setImmos(data);
    } catch (e) {
      toast.error('Erreur lors du chargement des immobilisations');
    }
  };

  const fetchSites = async () => {
    try {
      const data = await fetchWithAuth('/immobilisations/sites/');
      setSites(data);
    } catch (e) {
      // Ignorer l'erreur silencieusement ou utiliser des sites par défaut
    }
  };

  useEffect(() => {
    fetchImmos();
    fetchSites();
  }, []);

  const filtered = useMemo(() => {
    return immos.filter(
      (i) =>
        i.libelle.toLowerCase().includes(search.toLowerCase()) ||
        i.code.toLowerCase().includes(search.toLowerCase()) ||
        i.categorie.toLowerCase().includes(search.toLowerCase())
    );
  }, [immos, search]);

  const totalAcquisition = immos.reduce((s, i) => s + Number(i.valeurAcquisition), 0);
  const totalAmortissement = immos.reduce((s, i) => s + Number(i.cumulAmortissement), 0);
  const totalVNC = immos.reduce((s, i) => s + Number(i.vnc), 0);
  const totalDotation = immos.reduce((s, i) => s + Number(i.dotationAnnuelle), 0);

  const handleCreate = async () => {
    const valeur = parseFloat(form.valeurAcquisition);
    const duree = parseInt(form.duree);
    if (!form.libelle || !valeur || !duree) {
      toast.error('Veuillez renseigner tous les champs obligatoires');
      return;
    }
    
    try {
      const immoData = {
        code: form.code || `IM-${String(immos.length + 1).padStart(3, '0')}`,
        libelle: form.libelle,
        categorie: form.categorie,
        dateAcquisition: form.dateAcquisition,
        valeurAcquisition: valeur,
        duree,
        methode: form.methode,
        site: form.site,
      };

      if (form.id) {
        await fetchWithAuth(`/immobilisations/${form.id}/`, {
          method: 'PUT',
          body: JSON.stringify(immoData),
        });
        toast.success('Immobilisation modifiée');
      } else {
        await fetchWithAuth('/immobilisations/', {
          method: 'POST',
          body: JSON.stringify(immoData),
        });
        toast.success('Immobilisation créée');
      }

      setDialogOpen(false);
      resetForm();
      fetchImmos();
    } catch (e: any) {
      toast.error('Erreur lors de l\'enregistrement', { description: e.message });
    }
  };

  const handleEdit = (immo: Immobilisation) => {
    setForm({
      id: immo.id,
      code: immo.code,
      libelle: immo.libelle,
      categorie: immo.categorie,
      valeurAcquisition: immo.valeurAcquisition.toString(),
      duree: immo.duree.toString(),
      methode: immo.methode as any,
      site: immo.site,
      dateAcquisition: typeof immo.dateAcquisition === 'string' ? immo.dateAcquisition.split('T')[0] : new Date(immo.dateAcquisition).toISOString().split('T')[0],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchWithAuth(`/immobilisations/${id}/`, {
        method: 'DELETE',
      });
      toast.success('Immobilisation supprimée');
      fetchImmos();
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const generateDotations = async () => {
    try {
      const year = new Date().getFullYear();
      const dotationTotal = immos.reduce((acc, i) => acc + Number(i.dotationAnnuelle), 0);
      
      const today = new Date().toISOString().split('T')[0];
      const timestamp = Date.now().toString().slice(-6);
      const ecritureData = {
        numero: `OD-${year}-DOT-${timestamp}`,
        piece: `PC-OD-${year}-DOT-${timestamp}`,
        journal: 'OD',
        date: today,
        libelle: `Dotations aux amortissements de l'exercice ${year}`,
        statut: 'brouillard',
        lignes: [
          { date: today, compte: '68', libelleCompte: 'Dotations aux amortissements', libelle: 'Dotation globale', debit: dotationTotal, credit: 0 },
          { date: today, compte: '28', libelleCompte: 'Amortissements', libelle: 'Dotation globale', debit: 0, credit: dotationTotal }
        ]
      };

      await fetchWithAuth('/saisie/ecritures/', {
        method: 'POST',
        body: JSON.stringify(ecritureData)
      });
      toast.success('Dotations générées', {
        description: `${formatCurrency(dotationTotal)} ajoutés au brouillard OD`,
      });
    } catch (e: any) {
      toast.error('Erreur lors de la génération', { description: e.message });
    }
  };

  const exportToCSV = () => {
    const data = immos.map(i => ({
      Code: i.code,
      Libellé: i.libelle,
      Catégorie: i.categorie,
      Site: i.site,
      Acquisition: formatDate(i.dateAcquisition),
      Valeur: Number(i.valeurAcquisition),
      Cumul: Number(i.cumulAmortissement),
      VNC: Number(i.vnc),
      Méthode: i.methode,
      Durée: i.duree
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Immobilisations");
    XLSX.writeFile(wb, "Registre_Immobilisations.xlsx");
    toast.success('Registre exporté en Excel');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Registre des Immobilisations", 14, 15);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

    const tableData = immos.map(i => [
      i.code,
      i.libelle,
      i.categorie,
      formatDate(i.dateAcquisition),
      formatCurrency(Number(i.valeurAcquisition)),
      formatCurrency(Number(i.cumulAmortissement)),
      formatCurrency(Number(i.vnc))
    ]);

    autoTable(doc, {
      head: [['Code', 'Libellé', 'Catégorie', 'Acquisition', 'Valeur', 'Cumul', 'VNC']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("Registre_Immobilisations.pdf");
    toast.success('Registre exporté en PDF');
  };

  const handleSimulate = async (immo: Immobilisation) => {
    setSimulating(immo);
    setIsLoadingPlan(true);
    setAmortissementPlan([]);
    try {
      const data = await fetchWithAuth(`/immobilisations/${immo.id}/amortissement/`);
      setAmortissementPlan(data);
    } catch (e) {
      toast.error('Erreur lors du calcul de l\'amortissement');
    } finally {
      setIsLoadingPlan(false);
    }
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        <GlassCard glow={false} className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Valeur d'acquisition</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-primary truncate" title={formatCurrency(totalAcquisition)}>{formatCurrency(totalAcquisition)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard glow={false} className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Cumul amortissements</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-warning truncate" title={formatCurrency(totalAmortissement)}>{formatCurrency(totalAmortissement)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-warning/10 text-warning shrink-0">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard glow={false} className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">VNC totale</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-chart-2 truncate" title={formatCurrency(totalVNC)}>{formatCurrency(totalVNC)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-chart-2/10 text-chart-2 shrink-0">
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard glow={false} className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Dotation annuelle</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-chart-4 truncate" title={formatCurrency(totalDotation)}>{formatCurrency(totalDotation)}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-chart-4/10 text-chart-4 shrink-0">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-border/50 mb-1 relative">
        {/* Info gauche */}
        <div className="text-xs text-muted-foreground font-medium">
          {immos.length} immobilisation{immos.length > 1 ? 's' : ''} enregistrée{immos.length > 1 ? 's' : ''}
        </div>

        {/* Boutons icônes (droite) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-8 text-xs bg-transparent border-border transition-all duration-300 focus:w-[200px] hover:w-[200px] focus:bg-background/50 rounded-full cursor-pointer focus:cursor-text"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" title="Exporter">
                <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileIcon className="h-4 w-4 mr-2" /> Export Excel / CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToPDF}>
                <Printer className="h-4 w-4 mr-2" /> Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:bg-accent group" onClick={generateDotations} title="Générer dotations">
            <Calculator className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Button>

          <Button size="icon" className="h-8 w-8 rounded-lg shadow-sm" onClick={() => { resetForm(); setDialogOpen(true); }} title="Nouvelle immobilisation">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <GlassCard glow={false} className="border-white/10 shadow-lg bg-background/50 backdrop-blur-xl">
        <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Acquisition</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-right">Cumul Amort.</TableHead>
                  <TableHead className="text-right">VNC</TableHead>
                  <TableHead className="text-center">Amorti à</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => {
                  const valeurAcq = Number(i.valeurAcquisition);
                  const cumulAmort = Number(i.cumulAmortissement);
                  const vnc = Number(i.vnc);
                  const amortPct = valeurAcq > 0 ? (cumulAmort / valeurAcq) * 100 : 0;
                  const site = SITES.find((s) => s.id === i.site);
                  return (
                    <TableRow key={i.id} className="group">
                      <TableCell className="font-mono font-medium">{i.code}</TableCell>
                      <TableCell>{i.libelle}</TableCell>
                      <TableCell className="text-muted-foreground">{i.categorie}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {site?.short || i.site}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(i.dateAcquisition)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(valeurAcq)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(cumulAmort)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatCurrency(vnc)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={amortPct} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground">{Math.round(amortPct)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <NeonButton variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSimulate(i)}>
                            <Calculator className="h-3.5 w-3.5" />
                          </NeonButton>
                          <NeonButton variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(i)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </NeonButton>
                          <NeonButton
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(i.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </NeonButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                      Aucune immobilisation trouvée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </GlassCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifier l\'immobilisation' : 'Nouvelle immobilisation'}</DialogTitle>
            <DialogDescription className="sr-only">Formulaire de création d'une nouvelle immobilisation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input
                placeholder="ex: Camion Mercedes Actros"
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immobilisations incorporelles">Immobilisations incorporelles</SelectItem>
                    <SelectItem value="Immobilisations corporelles">Immobilisations corporelles</SelectItem>
                    <SelectItem value="Immobilisations financières">Immobilisations financières</SelectItem>
                    <SelectItem value="Terrains">Terrains</SelectItem>
                    <SelectItem value="Bâtiments">Bâtiments</SelectItem>
                    <SelectItem value="Installations techniques">Installations techniques</SelectItem>
                    <SelectItem value="Matériel de transport">Matériel de transport</SelectItem>
                    <SelectItem value="Mobilier et matériel de bureau">Mobilier et matériel de bureau</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex flex-col">
                <Label>Site</Label>
                <Popover open={siteOpen} onOpenChange={setSiteOpen}>
                  <PopoverTrigger asChild>
                    <NeonButton
                      variant="outline"
                      role="combobox"
                      aria-expanded={siteOpen}
                      className="justify-between"
                    >
                      {form.site
                        ? sites.find((s) => s.label === form.site)?.label || form.site
                        : "Sélectionner ou saisir un site..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </NeonButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Rechercher ou saisir..." 
                        value={siteSearch}
                        onValueChange={setSiteSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {siteSearch ? (
                            <NeonButton 
                              variant="ghost" 
                              className="w-full justify-start text-sm font-normal py-2 px-2"
                              onClick={() => {
                                setForm({ ...form, site: siteSearch });
                                setSiteOpen(false);
                                setSiteSearch('');
                              }}
                            >
                              Créer le site "{siteSearch}"
                            </NeonButton>
                          ) : (
                            <span className="py-2 px-2 text-sm text-muted-foreground">Aucun site trouvé.</span>
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {sites.map((s) => (
                            <CommandItem
                              key={s.id}
                              value={s.label}
                              onSelect={() => {
                                setForm({ ...form, site: s.label });
                                setSiteOpen(false);
                                setSiteSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.site === s.label ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {s.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valeur d'acquisition (USD)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.valeurAcquisition}
                  onChange={(e) => setForm({ ...form, valeurAcquisition: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Durée (années)</Label>
                <Input
                  type="number"
                  value={form.duree}
                  onChange={(e) => setForm({ ...form, duree: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date d'acquisition</Label>
                <Input
                  type="date"
                  value={form.dateAcquisition}
                  onChange={(e) => setForm({ ...form, dateAcquisition: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Méthode</Label>
                <Select value={form.methode} onValueChange={(v) => setForm({ ...form, methode: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lineaire">Linéaire</SelectItem>
                    <SelectItem value="degressive">Dégressive</SelectItem>
                    <SelectItem value="exceptionnelle">Exceptionnelle</SelectItem>
                    <SelectItem value="unites_oeuvre">Unités d'œuvre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.valeurAcquisition && form.duree && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dotation annuelle approx.</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(parseFloat(form.valeurAcquisition) / parseInt(form.duree))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <NeonButton variant="outline">Annuler</NeonButton>
            </DialogClose>
            <NeonButton onClick={handleCreate}>{form.id ? 'Modifier' : 'Créer'}</NeonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!simulating} onOpenChange={(o) => !o && setSimulating(null)}>
        <DialogContent className="sm:max-w-lg">
          {simulating && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Plan d'amortissement - {simulating.code}
                </DialogTitle>
                <DialogDescription>{simulating.libelle} - Méthode {simulating.methode}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Valeur</p>
                    <p className="font-mono font-semibold">{formatCurrency(Number(simulating.valeurAcquisition))}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Durée</p>
                    <p className="font-mono font-semibold">{simulating.duree} ans</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Méthode</p>
                    <p className="font-mono font-semibold capitalize">{simulating.methode}</p>
                  </div>
                </div>
                
                {isLoadingPlan ? (
                  <div className="py-8 flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="max-h-[300px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/50 z-10">
                        <TableRow>
                          <TableHead>Année</TableHead>
                          <TableHead className="text-right">Base</TableHead>
                          <TableHead className="text-right">Dotation</TableHead>
                          <TableHead className="text-right">Cumul</TableHead>
                          <TableHead className="text-right">VNC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {amortissementPlan.map((row) => (
                          <TableRow key={row.annee}>
                            <TableCell className="font-medium">An {row.annee}</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(row.baseAmortissable)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(row.dotation)}</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(row.cumul)}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">{formatCurrency(row.vnc)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
