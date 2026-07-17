'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  FileSignature, 
  Landmark, 
  ReceiptText, 
  Calendar,
  AlertCircle,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { fetchWithAuth } from '@/lib/api';

export default function FiscalitePage() {
  const [activeTab, setActiveTab] = useState<'declarations' | 'retenues'>('declarations');
  
  return (
    <div className="space-y-2">
      <div className="flex justify-end items-center gap-4 -mt-2 lg:-mt-4">
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-border/50">
          <button
            onClick={() => setActiveTab('declarations')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
              activeTab === 'declarations' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileSignature className="w-3.5 h-3.5" />
            Déclarations
          </button>
          <button
            onClick={() => setActiveTab('retenues')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
              activeTab === 'retenues' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            Retenues à la source
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'declarations' ? <DeclarationsView /> : <RetenuesView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DeclarationsView() {
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [typeDecl, setTypeDecl] = useState('TVA');
  const [periode, setPeriode] = useState('');
  const [montant, setMontant] = useState('');
  const [echeance, setEcheance] = useState('');
  const [statut, setStatut] = useState('Brouillon');

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/fiscalite/declarations/');
      setDeclarations(data);
    } catch (error) {
      console.error('Error loading declarations:', error);
      toast.error('Erreur lors du chargement des déclarations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeclarations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        id: `DEC-${Date.now().toString().slice(-6)}`,
        type_declaration: typeDecl,
        periode,
        montant: parseFloat(montant),
        echeance,
        statut
      };
      
      await fetchWithAuth('/fiscalite/declarations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      toast.success('Déclaration générée avec succès');
      setIsDialogOpen(false);
      
      // Reset
      setTypeDecl('TVA');
      setPeriode('');
      setMontant('');
      setEcheance('');
      setStatut('Brouillon');
      
      loadDeclarations();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Erreur lors de la génération de la déclaration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = declarations.filter(d => 
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.periode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.type_declaration.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tvaTotale = declarations.filter(d => d.type_declaration === 'TVA' && d.statut !== 'Déclaré et Payé').reduce((acc, curr) => acc + parseFloat(curr.montant), 0);
  const acomptesTotaux = declarations.filter(d => d.type_declaration.includes('Acompte IS') && d.statut === 'Déclaré et Payé').reduce((acc, curr) => acc + parseFloat(curr.montant), 0);

  const KPIS = [
    {
      title: 'TVA Nette',
      value: tvaTotale.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      iconClass: 'bg-primary/10 text-primary',
      icon: Landmark
    },
    {
      title: 'Acomptes IS',
      value: acomptesTotaux.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      iconClass: 'bg-emerald-500/10 text-emerald-500',
      icon: ReceiptText
    },
    {
      title: 'Échéance',
      value: '15 du mois',
      iconClass: 'bg-amber-500/10 text-amber-500',
      icon: Calendar
    },
    {
      title: 'Pénalités',
      value: '0.00 $',
      iconClass: 'bg-emerald-500/10 text-emerald-500',
      icon: CheckCircle2
    },
  ];

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
                <div className="flex flex-col overflow-hidden w-full">
                  <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{kpi.title}</span>
                  <span className={cn("text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 truncate", kpi.iconClass.split(' ')[1])} title={kpi.value}>{kpi.value}</span>
                </div>
                <div className={cn("p-1 sm:p-1.5 rounded-md shrink-0", kpi.iconClass)}>
                  <kpi.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-end gap-2">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 w-8 text-xs bg-transparent border-border transition-all duration-300 focus:w-[150px] hover:w-[150px] focus:bg-background/50 rounded-full cursor-pointer focus:cursor-text" 
            />
          </div>
          <Button variant="default" size="sm" className="h-8 text-xs px-3 shadow-none" onClick={() => setIsDialogOpen(true)} title="Générer Déclaration">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Générer
          </Button>
        </div>

        <Card className="border-white/10 shadow-lg bg-background/50 backdrop-blur-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead>Référence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune déclaration trouvée.</TableCell></TableRow>
                ) : (
                  filtered.map((dec) => (
                    <TableRow key={dec.id} className="hover:bg-white/5 border-white/5">
                      <TableCell className="font-medium text-muted-foreground">{dec.id}</TableCell>
                      <TableCell className="font-semibold">{dec.type_declaration}</TableCell>
                      <TableCell>{dec.periode}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {new Date(dec.echeance).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {parseFloat(dec.montant).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          dec.statut === 'Déclaré et Payé' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                          dec.statut === 'Brouillon' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : ''
                        }>
                          {dec.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Générer une Déclaration</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour initialiser une déclaration fiscale.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de Déclaration</Label>
                <Select value={typeDecl} onValueChange={setTypeDecl}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TVA">TVA</SelectItem>
                    <SelectItem value="IPR">IPR</SelectItem>
                    <SelectItem value="Acompte IS">Acompte IS</SelectItem>
                    <SelectItem value="Solde IS">Solde IS</SelectItem>
                    <SelectItem value="Patente">Patente</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Période</Label>
                <Input required value={periode} onChange={e => setPeriode(e.target.value)} placeholder="Ex: Juillet 2026" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant Estimé (USD)</Label>
                <Input required type="number" step="0.01" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Date d'échéance</Label>
                <Input required type="date" value={echeance} onChange={e => setEcheance(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut Initial</Label>
              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brouillon">Brouillon</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Déclaré et Payé">Déclaré et Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RetenuesView() {
  const [retenues, setRetenues] = useState<any[]>([]);
  const [tiersList, setTiersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [tiers, setTiers] = useState('');
  const [typeRetenue, setTypeRetenue] = useState('IBP 14%');
  const [date, setDate] = useState('');
  const [baseCalcul, setBaseCalcul] = useState('');
  const [montantRetenu, setMontantRetenu] = useState('');
  const [statut, setStatut] = useState('Prélevé');

  const loadData = async () => {
    setLoading(true);
    try {
      const [retData, tiersData] = await Promise.all([
        fetchWithAuth('/fiscalite/retenues/'),
        fetchWithAuth('/plan_comptable/tiers/')
      ]);
      setRetenues(retData);
      setTiersList(tiersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto calculate based on type
  useEffect(() => {
    if (baseCalcul && typeRetenue) {
      const base = parseFloat(baseCalcul);
      if (typeRetenue === 'IBP 14%') {
        setMontantRetenu((base * 0.14).toFixed(2));
      } else if (typeRetenue === 'Loyer 22%') {
        setMontantRetenu((base * 0.22).toFixed(2));
      }
    }
  }, [baseCalcul, typeRetenue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        id: `RET-${Date.now().toString().slice(-6)}`,
        tiers,
        type_retenue: typeRetenue,
        date,
        base_calcul: parseFloat(baseCalcul),
        montant: parseFloat(montantRetenu),
        statut
      };
      
      await fetchWithAuth('/fiscalite/retenues/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      toast.success('Retenue enregistrée avec succès');
      setIsDialogOpen(false);
      
      // Reset
      setTiers('');
      setTypeRetenue('IBP 14%');
      setDate('');
      setBaseCalcul('');
      setMontantRetenu('');
      setStatut('Prélevé');
      
      loadData();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Erreur lors de l\'enregistrement de la retenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = retenues.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.tiers_nom && r.tiers_nom.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-1.5">
      <div className="flex justify-end items-center gap-2">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 h-8 w-8 text-xs bg-transparent border-border transition-all duration-300 focus:w-[150px] hover:w-[150px] focus:bg-background/50 rounded-full cursor-pointer focus:cursor-text" 
          />
        </div>
        <Button variant="default" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsDialogOpen(true)} title="Saisir Retenue">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Card className="border-white/10 shadow-lg bg-background/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead>Référence</TableHead>
                <TableHead>Tiers</TableHead>
                <TableHead>Type de Retenue</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Base de Calcul</TableHead>
                <TableHead className="text-right">Montant Retenu</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune retenue trouvée.</TableCell></TableRow>
              ) : (
                filtered.map((ret) => (
                  <TableRow key={ret.id} className="hover:bg-white/5 border-white/5">
                    <TableCell className="font-medium text-muted-foreground">{ret.id}</TableCell>
                    <TableCell className="font-semibold">{ret.tiers_nom}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                        {ret.type_retenue}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(ret.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {parseFloat(ret.base_calcul).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-500">
                      -{parseFloat(ret.montant).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        ret.statut === 'Reversé à l\'État' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                        'border-amber-500/30 text-amber-500 bg-amber-500/10'
                      }>
                        {ret.statut}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Saisir une Retenue</DialogTitle>
            <DialogDescription>
              Enregistrez une retenue à la source appliquée à un tiers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Tiers (Client/Fournisseur/Bailleur)</Label>
              <Select value={tiers} onValueChange={setTiers}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le tiers" />
                </SelectTrigger>
                <SelectContent>
                  {tiersList.map(t => (
                    <SelectItem key={t.code} value={t.code}>{t.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de Retenue</Label>
                <Select value={typeRetenue} onValueChange={setTypeRetenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IBP 14%">IBP 14%</SelectItem>
                    <SelectItem value="Loyer 22%">Loyer 22%</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Calcul (Brut USD)</Label>
                <Input required type="number" step="0.01" value={baseCalcul} onChange={e => setBaseCalcul(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Montant Retenu (USD)</Label>
                <Input required type="number" step="0.01" value={montantRetenu} onChange={e => setMontantRetenu(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brouillon">Brouillon</SelectItem>
                  <SelectItem value="Prélevé">Prélevé</SelectItem>
                  <SelectItem value="Reversé à l'État">Reversé à l'État</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting || !tiers}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
