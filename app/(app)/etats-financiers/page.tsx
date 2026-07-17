'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Circle,
  Lock,
  Scale,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

const CLOTURE_STEPS_TEMPLATE = [
  { id: 'centralisation_journaux', label: 'Centralisation des journaux' },
  { id: 'rapprochement_bancaire', label: 'Rapprochement bancaire' },
  { id: 'inventaire_stocks', label: 'Inventaire des stocks' },
  { id: 'amortissements_provisions', label: 'Amortissements et provisions' },
  { id: 'regularisation_charges_produits', label: 'Régularisation des charges et produits' },
  { id: 'arrete_comptes_tiers', label: 'Arrêté des comptes de tiers' },
  { id: 'validation_commissaire', label: 'Validation par le commissaire aux comptes' },
];

import { fetchWithAuth } from '@/lib/api';
import { useEffect } from 'react';

export default function EtatsFinanciersPage() {
  const [steps, setSteps] = useState(CLOTURE_STEPS_TEMPLATE.map(s => ({ ...s, done: false })));
  const [activeTab, setActiveTab] = useState('bilan');
  const [bilan, setBilan] = useState<any>(null);
  const [cr, setCr] = useState<any>(null);
  const [tafire, setTafire] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const periodeStr = '2025-07'; // TODO: Rendre dynamique via un sélecteur

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchWithAuth('/etats_financiers/bilan/'),
      fetchWithAuth('/etats_financiers/compte-resultat/'),
      fetchWithAuth('/etats_financiers/tafire/'),
      fetchWithAuth(`/etats_financiers/cloture/${periodeStr}/`)
    ]).then(([b, c, t, cloture]) => {
      setBilan(b);
      setCr(c);
      setTafire(t);
      
      // Update checklist state
      setSteps(CLOTURE_STEPS_TEMPLATE.map(s => ({
        ...s,
        done: cloture[s.id] === true
      })));

    }).catch(() => toast.error('Erreur de chargement des etats financiers'))
      .finally(() => setLoading(false));
  }, [periodeStr]);

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const progress = Math.round((doneCount / steps.length) * 100);

  const toggleStep = async (id: string) => {
    const step = steps.find(s => s.id === id);
    if (!step) return;
    
    const newValue = !step.done;
    
    // If trying to check the box, verify it first on the backend
    if (newValue) {
      try {
        const verifyRes = await fetchWithAuth(`/etats_financiers/cloture/verify/${id}/${periodeStr}/`);
        if (verifyRes.status === 'error') {
          // If the backend refuses the validation, show precise error and abort
          toast.error(verifyRes.message, { 
            description: verifyRes.recommendation,
            duration: 8000, // Longer duration so they can read the recommendation
          });
          return;
        }
      } catch (e) {
        toast.error('Erreur de connexion lors de la vérification');
        return;
      }
    }
    
    // Update local state immediately for UI responsiveness
    setSteps(steps.map((s) => (s.id === id ? { ...s, done: newValue } : s)));
    
    try {
      await fetchWithAuth(`/etats_financiers/cloture/${periodeStr}/`, {
        method: 'PUT',
        body: JSON.stringify({ field: id, value: newValue })
      });
      if (newValue) {
        toast.success('Étape validée avec succès');
      } else {
        toast.success('Étape annulée');
      }
    } catch (e) {
      // Revert if error
      setSteps(steps.map((s) => (s.id === id ? { ...s, done: !newValue } : s)));
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const totalActifNet = bilan ? parseFloat(bilan.actif.total) : 0;
  const totalPassif = bilan ? parseFloat(bilan.passif.total) : 0;
  const totalProduits = cr ? parseFloat(cr.produits.total) : 0;
  const totalCharges = cr ? parseFloat(cr.charges.total) : 0;
  const resultatNet = cr ? parseFloat(cr.resultat_net) : 0;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    if (activeTab === 'bilan' && bilan) {
       // Actif
       const actifData: any[][] = [
         ["BILAN - ACTIF - EXERCICE 2025"],
         [],
         ["Catégorie", "Compte", "Libellé", "Montant Net"]
       ];
       ['actif_immobilise', 'actif_circulant', 'tresorerie_actif'].forEach(cat => {
         const label = cat === 'actif_immobilise' ? 'Actif Immobilisé' : cat === 'actif_circulant' ? 'Actif Circulant' : 'Trésorerie Actif';
         bilan.actif[cat]?.forEach((r: any) => {
           actifData.push([label, r.poste, r.libelle, Math.abs(r.montant)]);
         });
       });
       actifData.push([]);
       actifData.push(["", "", "TOTAL ACTIF NET", totalActifNet]);
       
       const wsActif = XLSX.utils.aoa_to_sheet(actifData);
       wsActif['!cols'] = [{wch: 25}, {wch: 15}, {wch: 60}, {wch: 20}];
       XLSX.utils.book_append_sheet(wb, wsActif, "Actif");
       
       // Passif
       const passifData: any[][] = [
         ["BILAN - PASSIF - EXERCICE 2025"],
         [],
         ["Catégorie", "Compte", "Libellé", "Montant"]
       ];
       ['capitaux_propres', 'dettes_financieres', 'passif_circulant', 'tresorerie_passif'].forEach(cat => {
         const label = cat === 'capitaux_propres' ? 'Capitaux Propres' : cat === 'dettes_financieres' ? 'Dettes Financières' : cat === 'passif_circulant' ? 'Passif Circulant' : 'Trésorerie Passif';
         bilan.passif[cat]?.forEach((r: any) => {
           passifData.push([label, r.poste, r.libelle, r.montant]);
         });
       });
       passifData.push([]);
       passifData.push(["", "", "TOTAL PASSIF", totalPassif]);
       
       const wsPassif = XLSX.utils.aoa_to_sheet(passifData);
       wsPassif['!cols'] = [{wch: 25}, {wch: 15}, {wch: 60}, {wch: 20}];
       XLSX.utils.book_append_sheet(wb, wsPassif, "Passif");
       
    } else if (activeTab === 'resultat' && cr) {
       // Produits
       const produitsData: any[][] = [
         ["COMPTE DE RÉSULTAT - PRODUITS - EXERCICE 2025"],
         [],
         ["Catégorie", "Compte", "Libellé", "Montant"]
       ];
       ['produits_exploitation', 'produits_financiers'].forEach(cat => {
         const label = cat === 'produits_exploitation' ? "Produits d'Exploitation" : "Produits Financiers";
         cr.produits[cat]?.forEach((r: any) => {
           produitsData.push([label, r.poste, r.libelle, r.montant]);
         });
       });
       produitsData.push([]);
       produitsData.push(["", "", "TOTAL PRODUITS", totalProduits]);
       
       const wsProduits = XLSX.utils.aoa_to_sheet(produitsData);
       wsProduits['!cols'] = [{wch: 30}, {wch: 15}, {wch: 60}, {wch: 20}];
       XLSX.utils.book_append_sheet(wb, wsProduits, "Produits");
       
       // Charges
       const chargesData: any[][] = [
         ["COMPTE DE RÉSULTAT - CHARGES - EXERCICE 2025"],
         [],
         ["Catégorie", "Compte", "Libellé", "Montant"]
       ];
       ['charges_exploitation', 'charges_financieres'].forEach(cat => {
         const label = cat === 'charges_exploitation' ? "Charges d'Exploitation" : "Charges Financières";
         cr.charges[cat]?.forEach((r: any) => {
           chargesData.push([label, r.poste, r.libelle, r.montant]);
         });
       });
       chargesData.push([]);
       chargesData.push(["", "", "TOTAL CHARGES", totalCharges]);
       chargesData.push([]);
       chargesData.push(["", "", "RÉSULTAT NET", resultatNet]);
       
       const wsCharges = XLSX.utils.aoa_to_sheet(chargesData);
       wsCharges['!cols'] = [{wch: 30}, {wch: 15}, {wch: 60}, {wch: 20}];
       XLSX.utils.book_append_sheet(wb, wsCharges, "Charges");
       
    } else if (activeTab === 'tafire' && tafire) {
       const tafireData: any[][] = [
         ["TAFIRE - EXERCICE 2025"],
         [],
         ["Rubrique", "Calcul", "Montant"]
       ];
       tafire.forEach((r: any) => {
         tafireData.push([r.rubrique, r.calcul, parseFloat(r.montant)]);
       });
       
       const wsTafire = XLSX.utils.aoa_to_sheet(tafireData);
       wsTafire['!cols'] = [{wch: 60}, {wch: 60}, {wch: 20}];
       XLSX.utils.book_append_sheet(wb, wsTafire, "TAFIRE");
    } else {
       toast.error('Aucune donnée à exporter');
       return;
    }
    
    XLSX.writeFile(wb, `etats-financiers-${activeTab}-${periodeStr}.xlsx`);
    toast.success('Export Excel généré avec succès');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    
    if (activeTab === 'bilan' && bilan) {
       doc.text("Bilan - Exercice 2025", 14, 20);
       
       const actifRows: any[] = [];
       ['actif_immobilise', 'actif_circulant', 'tresorerie_actif'].forEach(cat => {
         bilan.actif[cat]?.forEach((r: any) => {
           actifRows.push([r.poste, r.libelle, formatCurrency(Math.abs(r.montant))]);
         });
       });
       
       autoTable(doc, {
         startY: 30,
         head: [['Compte', 'Libellé', 'Net']],
         body: actifRows,
         theme: 'grid',
         styles: { fontSize: 9 },
         headStyles: { fillColor: [41, 128, 185] },
       });
       
       let finalY = (doc as any).lastAutoTable.finalY + 10;
       doc.setFontSize(11);
       doc.text(`Total Actif Net: ${formatCurrency(totalActifNet)}`, 14, finalY);
       
       const passifRows: any[] = [];
       ['capitaux_propres', 'dettes_financieres', 'passif_circulant', 'tresorerie_passif'].forEach(cat => {
         bilan.passif[cat]?.forEach((r: any) => {
           passifRows.push([r.poste, r.libelle, formatCurrency(r.montant)]);
         });
       });
       
       autoTable(doc, {
         startY: finalY + 10,
         head: [['Compte', 'Libellé', 'Montant']],
         body: passifRows,
         theme: 'grid',
         styles: { fontSize: 9 },
         headStyles: { fillColor: [192, 57, 43] },
       });
       
       finalY = (doc as any).lastAutoTable.finalY + 10;
       doc.setFontSize(11);
       doc.text(`Total Passif: ${formatCurrency(totalPassif)}`, 14, finalY);
       
    } else if (activeTab === 'resultat' && cr) {
       doc.text("Compte de résultat - Exercice 2025", 14, 20);
       
       const produitsRows: any[] = [];
       ['produits_exploitation', 'produits_financiers'].forEach(cat => {
         cr.produits[cat]?.forEach((r: any) => {
           produitsRows.push([r.poste, r.libelle, formatCurrency(r.montant)]);
         });
       });
       
       autoTable(doc, {
         startY: 30,
         head: [['Compte', 'Libellé (Produits)', 'Montant']],
         body: produitsRows,
         theme: 'grid',
         styles: { fontSize: 9 },
         headStyles: { fillColor: [39, 174, 96] },
       });
       
       let finalY = (doc as any).lastAutoTable.finalY + 10;
       
       const chargesRows: any[] = [];
       ['charges_exploitation', 'charges_financieres'].forEach(cat => {
         cr.charges[cat]?.forEach((r: any) => {
           chargesRows.push([r.poste, r.libelle, formatCurrency(r.montant)]);
         });
       });
       
       autoTable(doc, {
         startY: finalY,
         head: [['Compte', 'Libellé (Charges)', 'Montant']],
         body: chargesRows,
         theme: 'grid',
         styles: { fontSize: 9 },
         headStyles: { fillColor: [192, 57, 43] },
       });
       
       finalY = (doc as any).lastAutoTable.finalY + 10;
       doc.setFontSize(11);
       doc.text(`Résultat Net: ${formatCurrency(resultatNet)}`, 14, finalY);
       
    } else if (activeTab === 'tafire' && tafire) {
       doc.text("TAFIRE - Exercice 2025", 14, 20);
       
       const tafireRows: any[] = [];
       tafire.forEach((r: any) => {
         tafireRows.push([r.rubrique, r.calcul, formatCurrency(parseFloat(r.montant))]);
       });
       
       autoTable(doc, {
         startY: 30,
         head: [['Rubrique', 'Calcul', 'Montant']],
         body: tafireRows,
         theme: 'grid',
         styles: { fontSize: 9 },
       });
    } else {
       toast.error('Aucune donnée à exporter');
       return;
    }
    
    doc.save(`etats-financiers-${activeTab}-${periodeStr}.pdf`);
    toast.success('Export PDF généré');
  };

  return (
    <div className="space-y-1 animate-fade-in -mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-2.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Actif Net</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-base font-bold leading-none" title={formatCurrency(totalActifNet)}>{formatCurrency(totalActifNet)}</span>
                <span className="text-[9px] font-medium text-emerald-500 flex items-center">(<TrendingUp className="h-2 w-2 mr-0.5" />+5.2%)</span>
              </div>
            </div>
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Scale className="h-3.5 w-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-2.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Passif</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-base font-bold leading-none" title={formatCurrency(totalPassif)}>{formatCurrency(totalPassif)}</span>
                <span className="text-[9px] font-medium text-emerald-500 flex items-center">(<TrendingDown className="h-2 w-2 mr-0.5" />-1.5%)</span>
              </div>
            </div>
            <div className="p-1.5 rounded-md bg-chart-5/10 text-chart-5">
              <PieChart className="h-3.5 w-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-2.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resultat Net</span>
              <div className="flex items-center gap-1 mt-1">
                <span className={cn("text-base font-bold leading-none", resultatNet >= 0 ? "text-emerald-500" : "text-rose-500")} title={formatCurrency(resultatNet)}>
                  {formatCurrency(resultatNet)}
                </span>
                <span className={cn("text-[9px] font-medium flex items-center", resultatNet >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  (<TrendingUp className="h-2 w-2 mr-0.5" />+8.4%)
                </span>
              </div>
            </div>
            <div className={cn("p-1.5 rounded-md", resultatNet >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-border/50 mb-1">
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger value="bilan" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-md px-3 text-xs h-7">
              <Scale className="h-3.5 w-3.5 mr-1.5" />
              Bilan
            </TabsTrigger>
            <TabsTrigger value="resultat" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-md px-3 text-xs h-7">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Compte de résultat
            </TabsTrigger>
            <TabsTrigger value="tafire" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-md px-3 text-xs h-7">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              TAFIRE
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "relative transition-all h-8 text-xs duration-300 shadow-sm",
                    allDone 
                      ? "bg-success/5 border-success/30 text-success hover:bg-success/10 hover:text-success" 
                      : "bg-primary/5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  <span className="font-semibold">Checklist</span>
                  <div className={cn(
                    "ml-1.5 flex h-4 items-center justify-center rounded-full px-1.5 text-[9px] font-bold transition-colors",
                    allDone ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'
                  )}>
                    {doneCount}/{steps.length}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                align="center" 
                sideOffset={12}
                collisionPadding={24}
                className="w-[300px] max-w-[calc(100vw-2rem)] p-0 border shadow-2xl rounded-xl overflow-hidden"
              >
                <div className={cn("p-3.5 border-b transition-colors duration-300", allDone ? "bg-success/5" : "bg-primary/5")}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={cn("font-bold text-sm", allDone ? "text-success" : "text-primary")}>
                      Checklist de clôture
                    </h4>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", allDone ? "bg-success/10 text-success" : "bg-primary/10 text-primary")}>
                      {progress}%
                    </span>
                  </div>
                  <p className={cn("text-[11px] mb-3 leading-tight", allDone ? "text-success font-medium" : "text-muted-foreground")}>
                    {allDone 
                      ? "Toutes les étapes sont validées ! L'exportation des états financiers est débloquée." 
                      : "L'exportation est actuellement bloquée. Veuillez terminer toutes ces étapes pour garantir l'exactitude de vos chiffres et débloquer les exports."}
                  </p>
                  <div className="relative h-1 w-full bg-muted overflow-hidden rounded-full">
                    <div 
                      className={cn("h-full transition-all duration-500 ease-in-out", allDone ? "bg-success" : "bg-primary")} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
                <div className="p-1.5 overflow-y-auto space-y-0.5 scrollbar-thin" style={{ maxHeight: 'min(350px, 50vh)' }}>
                  {steps.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "group flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-200 border",
                        s.done 
                          ? "bg-success/5 border-success/20 hover:bg-success/10 shadow-sm" 
                          : "bg-background border-transparent hover:bg-muted/50 hover:border-border"
                      )}
                      onClick={() => toggleStep(s.id)}
                    >
                      <div className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                        s.done 
                          ? "bg-success border-success text-success-foreground scale-100" 
                          : "border-muted-foreground/30 group-hover:border-primary/50 bg-background scale-95 group-hover:scale-100"
                      )}>
                        <Check className={cn(
                          "h-2.5 w-2.5 transition-all duration-300", 
                          s.done ? "text-white opacity-100 scale-100" : "text-primary opacity-0 scale-50 group-hover:opacity-20"
                        )} />
                      </div>
                      <span className={cn(
                        'text-xs font-medium leading-tight transition-colors duration-200 flex-1', 
                        s.done ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      )}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={!allDone} className={cn("h-8 text-xs", !allDone && "opacity-50 cursor-not-allowed")}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="bilan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-[1.5rem] border border-border group relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md hover:border-primary/40 bg-background">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Actif</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest font-bold mt-1">Immobilisations, stocks, creances, tresorerie</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Compte</TableHead>
                      <TableHead>Libelle</TableHead>
                      <TableHead className="text-right">Brut</TableHead>
                      <TableHead className="text-right">Amort.</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bilan && ['actif_immobilise', 'actif_circulant', 'tresorerie_actif'].map((category) => (
                      bilan.actif[category]?.map((r: any) => (
                        <TableRow key={r.poste}>
                          <TableCell className="font-mono text-xs">{r.poste}</TableCell>
                          <TableCell className="font-medium">{r.libelle}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(Math.abs(r.montant))}</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">—</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {r.montant < 0 ? `(${formatCurrency(Math.abs(r.montant))})` : formatCurrency(r.montant)}
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-bold">Total Actif Net</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatCurrency(totalActifNet)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border border-border group relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md hover:border-chart-4/40 bg-background">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="text-lg font-bold text-foreground group-hover:text-chart-4 transition-colors">Passif</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest font-bold mt-1">Capitaux propres, dettes financieres, dettes d'exploitation</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Compte</TableHead>
                      <TableHead>Libelle</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bilan && ['capitaux_propres', 'dettes_financieres', 'passif_circulant', 'tresorerie_passif'].map((category) => (
                      bilan.passif[category]?.map((r: any) => (
                        <TableRow key={r.poste}>
                          <TableCell className="font-mono text-xs">{r.poste}</TableCell>
                          <TableCell className="font-medium">{r.libelle}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(r.montant)}</TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-bold">Total Passif</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatCurrency(totalPassif)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resultat">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compte de resultat SYSCOHADA</CardTitle>
              <CardDescription>Produits et charges de l'exercice 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">Produits</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Compte</TableHead>
                        <TableHead>Libelle</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cr && ['produits_exploitation', 'produits_financiers'].map((category) => (
                        cr.produits[category]?.map((r: any) => (
                          <TableRow key={r.poste}>
                            <TableCell className="font-mono text-xs">{r.poste}</TableCell>
                            <TableCell className="font-medium">{r.libelle}</TableCell>
                            <TableCell className="text-right font-mono text-success">{formatCurrency(r.montant)}</TableCell>
                          </TableRow>
                        ))
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-bold">Total Produits</TableCell>
                        <TableCell className="text-right font-mono font-bold text-success">
                          {formatCurrency(totalProduits)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <ArrowRight className="h-4 w-4 rotate-180" />
                    </div>
                    <h3 className="font-semibold">Charges</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Compte</TableHead>
                        <TableHead>Libelle</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cr && ['charges_exploitation', 'charges_financieres'].map((category) => (
                        cr.charges[category]?.map((r: any) => (
                          <TableRow key={r.poste}>
                            <TableCell className="font-mono text-xs">{r.poste}</TableCell>
                            <TableCell className="font-medium">{r.libelle}</TableCell>
                            <TableCell className="text-right font-mono text-destructive">{formatCurrency(r.montant)}</TableCell>
                          </TableRow>
                        ))
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-bold">Total Charges</TableCell>
                        <TableCell className="text-right font-mono font-bold text-destructive">
                          {formatCurrency(totalCharges)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              <div className={cn(
                'flex items-center justify-between p-4 rounded-lg mt-4',
                resultatNet >= 0 ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    resultatNet >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  )}>
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resultat net de l'exercice</p>
                    <p className="text-xs text-muted-foreground">Total produits - Total charges</p>
                  </div>
                </div>
                <p className={cn(
                  'text-2xl font-bold font-mono',
                  resultatNet >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {formatCurrency(resultatNet)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tafire">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tableau d'Analyse Financier des Ressources et Emplois (TAFIRE)</CardTitle>
              <CardDescription>Capacite de l'entreprise a generer des ressources internes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Rubrique</TableHead>
                    <TableHead>Calcul</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tafire.map((r, i) => {
                    const isSubtotal = [
                      'Valeur ajoutée',
                      "Excédent brut d'exploitation (EBE)",
                      "Résultat d'exploitation",
                      'Résultat financier',
                      "Résultat net de l'exercice",
                    ].includes(r.rubrique);
                    const amount = parseFloat(r.montant);
                    return (
                      <TableRow key={i} className={cn(isSubtotal && 'bg-muted/50 font-semibold')}>
                        <TableCell className={cn(isSubtotal && 'font-bold')}>{r.rubrique}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.calcul}</TableCell>
                        <TableCell className={cn(
                          'text-right font-mono',
                          amount < 0 && 'text-destructive'
                        )}>
                          {formatCurrency(amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
