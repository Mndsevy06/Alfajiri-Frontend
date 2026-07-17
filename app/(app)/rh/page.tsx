'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Calculator, 
  FileText, 
  Filter, 
  Landmark, 
  Plus, 
  Search, 
  Users, 
  Wallet,
  Briefcase,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard, Button as NeonButton } from '@/components/ui/Layout';

import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { BulletinForm } from '@/components/paie/bulletin-form';
import { fetchWithAuth } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function RHPage() {
  const [activeTab, setActiveTab] = useState<'employes' | 'paie'>('employes');
  
  return (
    <div className="space-y-1 animate-fade-in">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'employes' ? <EmployesView activeTab={activeTab} setActiveTab={setActiveTab} /> : <PaieView activeTab={activeTab} setActiveTab={setActiveTab} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// EMPLOYES VIEW
// ----------------------------------------------------------------------
function EmployesView({ activeTab, setActiveTab }: { activeTab: 'employes' | 'paie', setActiveTab: (t: 'employes' | 'paie') => void }) {
  const [employes, setEmployes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewEmployeOpen, setIsNewEmployeOpen] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState<any>(null);
  
  // New Employe Form State
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [poste, setPoste] = useState('');
  const [typeContrat, setTypeContrat] = useState('');
  const [salaireBase, setSalaireBase] = useState('');
  const [contratFile, setContratFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEmployes = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/plan_comptable/tiers/');
      setEmployes(data.filter((t: any) => t.type === 'personnel'));
    } catch (error) {
      console.error('Error loading employes', error);
      toast.error('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployes();
  }, []);

  const handleCreateEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom) return;
    
    setIsSubmitting(true);
    try {
      // Create a unique code
      const code = `EMP${Date.now().toString().slice(-4)}`;
      
      const formData = new FormData();
      formData.append('code', code);
      formData.append('nom', nom);
      formData.append('type', 'personnel');
      
      if (email) formData.append('email', email);
      if (telephone) formData.append('telephone', telephone);
      if (poste) formData.append('poste', poste);
      if (typeContrat) formData.append('type_contrat', typeContrat);
      if (salaireBase) formData.append('salaire_base', salaireBase);
      if (contratFile) formData.append('contrat_fichier', contratFile);
      
      await fetchWithAuth('/plan_comptable/tiers/', {
        method: 'POST',
        body: formData
      });
      
      toast.success('Employé créé avec succès !');
      setIsNewEmployeOpen(false);
      
      // Reset form
      setNom('');
      setEmail('');
      setTelephone('');
      setPoste('');
      setTypeContrat('');
      setSalaireBase('');
      setContratFile(null);
      
      loadEmployes();
    } catch (error) {
      console.error('Error creating employe', error);
      toast.error('Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = employes.filter(e => e.nom.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        <GlassCard glow={false} className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Employés</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-primary truncate">{employes.length}</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard glow={false} className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Masse Salariale</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-emerald-500 truncate">$45,200</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard glow={false} className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Recrutements</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-amber-500 truncate">3</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard glow={false} className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Départs</span>
              <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-rose-500 truncate">0</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-md bg-rose-500/10 text-rose-500 shrink-0">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-border/50 mb-1 relative">
        {/* Toggle (gauche) */}
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-border/50 shrink-0">
          <button onClick={() => setActiveTab('employes')} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all', activeTab === 'employes' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground')}>
            <Users className="w-3.5 h-3.5" /> Employés
          </button>
          <button onClick={() => setActiveTab('paie')} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all', activeTab === 'paie' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground')}>
            <Wallet className="w-3.5 h-3.5" /> Paie
          </button>
        </div>

        {/* Boutons icônes (droite) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 w-8 text-xs bg-transparent border-border transition-all duration-300 focus:w-[200px] hover:w-[200px] focus:bg-background/50 rounded-full cursor-pointer focus:cursor-text"
            />
          </div>
          <NeonButton size="icon" className="h-8 w-8 rounded-lg shadow-sm" onClick={() => setIsNewEmployeOpen(true)} title="Nouvel Employé">
            <Plus className="w-3.5 h-3.5" />
          </NeonButton>
        </div>
      </div>

      <GlassCard glow={false} className="border-white/10 shadow-lg bg-background/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead>Code</TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Poste (Simulation)</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun employé trouvé.</TableCell></TableRow>
              ) : (
                filtered.map((emp) => (
                  <TableRow key={emp.code} className="hover:bg-white/5 border-white/5">
                    <TableCell className="font-medium text-muted-foreground">{emp.code}</TableCell>
                    <TableCell className="font-bold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">{emp.nom.charAt(0)}</div>
                      {emp.nom}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{emp.email || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{emp.telephone || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Briefcase className="w-3 h-3 mr-1.5" />
                        {emp.poste || 'Employé standard'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={emp.statut === 'Actif' || !emp.statut ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" : ""}>
                        {emp.statut || 'Actif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <NeonButton variant="ghost" size="icon" onClick={() => setSelectedEmploye(emp)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </NeonButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </GlassCard>

      {/* Détails Employé Dialog */}
      <Dialog open={!!selectedEmploye} onOpenChange={(open) => !open && setSelectedEmploye(null)}>
        <DialogContent className="max-w-[92vw] sm:max-w-[500px] rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Détails de l'employé</DialogTitle>
            <DialogDescription className="hidden">Détails et informations de l'employé sélectionné</DialogDescription>
          </DialogHeader>
          {selectedEmploye && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold">
                  {selectedEmploye.nom.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedEmploye.nom}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEmploye.code}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedEmploye.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedEmploye.telephone || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Poste / Fonction</p>
                  <p className="font-medium">{selectedEmploye.poste || 'Employé standard'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <Badge variant="outline" className={selectedEmploye.statut === 'Actif' || !selectedEmploye.statut ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 mt-1" : "mt-1"}>
                    {selectedEmploye.statut || 'Actif'}
                  </Badge>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <NeonButton variant="outline" onClick={() => setSelectedEmploye(null)}>Fermer</NeonButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isNewEmployeOpen} onOpenChange={setIsNewEmployeOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel employé</DialogTitle>
            <DialogDescription className="hidden">Formulaire de création d'un nouvel employé</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEmploye} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet <span className="text-destructive">*</span></Label>
              <Input id="nom" value={nom} onChange={e => setNom(e.target.value)} required placeholder="Ex: Jean Dupont" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@alphajiri.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel">Téléphone</Label>
              <Input id="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+243 ..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poste">Poste / Fonction</Label>
                <Input id="poste" value={poste} onChange={e => setPoste(e.target.value)} placeholder="Ex: Développeur Web" />
              </div>
              <div className="space-y-2">
                <Label>Type de contrat</Label>
                <Select value={typeContrat} onValueChange={setTypeContrat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDI">CDI</SelectItem>
                    <SelectItem value="CDD">CDD</SelectItem>
                    <SelectItem value="Stage">Stage</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaire">Salaire de base (USD)</Label>
                <Input id="salaire" type="number" step="0.01" value={salaireBase} onChange={e => setSalaireBase(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contrat">Pièce jointe (Contrat)</Label>
                <Input id="contrat" type="file" onChange={e => setContratFile(e.target.files?.[0] || null)} className="cursor-pointer file:cursor-pointer file:text-sm file:font-medium" />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <NeonButton type="button" variant="ghost" onClick={() => setIsNewEmployeOpen(false)}>Annuler</NeonButton>
              <NeonButton type="submit" disabled={isSubmitting || !nom}>
                {isSubmitting ? 'Création...' : 'Créer'}
              </NeonButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ----------------------------------------------------------------------
// PAIE VIEW (Original PaiePage Content)
// ----------------------------------------------------------------------
function PaieView({ activeTab, setActiveTab }: { activeTab: 'employes' | 'paie', setActiveTab: (t: 'employes' | 'paie') => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterMois, setFilterMois] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBulletins = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/rh/bulletins/');
      setBulletins(data);
    } catch (error) {
      console.error('Error loading bulletins', error);
      toast.error('Erreur lors du chargement des bulletins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBulletins();
  }, []);

  const filteredBulletins = bulletins.filter(b => {
    const matchSearch = b.employe_nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPeriode = filterMois === 'all' || b.periode === filterMois;
    return matchSearch && matchPeriode;
  });

  // Calculate KPIs
  const totalBrut = filteredBulletins.reduce((acc, curr) => acc + parseFloat(curr.salaire_base || 0) + parseFloat(curr.heures_sup || 0) + (curr.primes?.reduce((s: number, p: any) => s + parseFloat(p.montant), 0) || 0), 0);
  const totalSocial = filteredBulletins.reduce((acc, curr) => acc + parseFloat(curr.cnss_employe || 0), 0);
  const totalImpots = filteredBulletins.reduce((acc, curr) => acc + parseFloat(curr.ipr || 0), 0);
  const totalNet = filteredBulletins.reduce((acc, curr) => acc + parseFloat(curr.net_a_payer || 0), 0);

  const KPIS = [
    {
      title: 'Masse Salariale Brute',
      value: totalBrut.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      iconClass: 'bg-primary/10 text-primary',
      icon: Wallet
    },
    {
      title: 'Cotisations Sociales',
      value: totalSocial.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      iconClass: 'bg-amber-500/10 text-amber-500',
      icon: Users
    },
    {
      title: 'Retenues Fiscales',
      value: totalImpots.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      iconClass: 'bg-rose-500/10 text-rose-500',
      icon: Landmark
    },
    {
      title: 'Net à Payer',
      value: totalNet.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      iconClass: 'bg-emerald-500/10 text-emerald-500',
      icon: Calculator
    },
  ];

  const handleSuccess = () => {
    setIsDialogOpen(false);
    loadBulletins();
  };

  return (
    <div className="space-y-1.5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard glow={false} className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
                <div className="flex flex-col overflow-hidden w-full">
                  <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{kpi.title}</span>
                  <span className={cn("text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 truncate", kpi.iconClass.split(' ')[1])} title={kpi.value}>{kpi.value}</span>
                </div>
                <div className={cn("p-1 sm:p-1.5 rounded-md shrink-0", kpi.iconClass)}>
                  <kpi.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-border/50 mb-1 relative">
        {/* Toggle (gauche) */}
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted/50 border border-border/50 shrink-0">
          <button onClick={() => setActiveTab('employes')} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all', activeTab === 'employes' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground')}>
            <Users className="w-3.5 h-3.5" /> Employés
          </button>
          <button onClick={() => setActiveTab('paie')} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all', activeTab === 'paie' ? 'bg-blue-600 shadow-sm text-white' : 'text-muted-foreground hover:text-foreground')}>
            <Wallet className="w-3.5 h-3.5" /> Paie
          </button>
        </div>

        {/* Info centré */}
        <div className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground hidden lg:flex items-center gap-2 whitespace-nowrap pointer-events-none">
          <FileText className="h-3.5 w-3.5" /> Bulletins de Paie — <Badge variant="secondary" className="text-[10px]">{filteredBulletins.length}</Badge>
        </div>

        {/* Boutons icônes (droite) */}
        <div className="flex items-center gap-2 shrink-0">
          {showSearch || searchTerm ? (
            <div className="relative animate-in slide-in-from-right-5 fade-in duration-200">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus={!searchTerm}
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => { if (!searchTerm) setShowSearch(false); }}
                className="pl-8 h-8 w-[200px] sm:w-[250px] border-border bg-background text-sm shadow-sm rounded-lg"
              />
            </div>
          ) : (
            <NeonButton variant="outline" size="icon" onClick={() => setShowSearch(true)} className="h-8 w-8 rounded-lg shadow-sm group" title="Rechercher">
              <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </NeonButton>
          )}

          <div className="flex items-center gap-2 bg-background border border-border rounded-lg shadow-sm px-2 h-8">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              type="month" 
              value={filterMois} 
              onChange={(e) => setFilterMois(e.target.value)}
              className="h-7 w-[130px] border-none bg-transparent p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          <NeonButton size="icon" onClick={() => setIsDialogOpen(true)} className="h-8 w-8 rounded-lg shadow-sm" title="Nouveau bulletin">
            <Plus className="h-3.5 w-3.5" />
          </NeonButton>
        </div>
      </div>

      <GlassCard glow={false} className="border-white/10 shadow-lg bg-background/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead>Période</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead className="text-right">Salaire Brut</TableHead>
                  <TableHead className="text-right">Charges Sociales</TableHead>
                  <TableHead className="text-right">Impôts</TableHead>
                  <TableHead className="text-right">Net à Payer</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Chargement des bulletins...
                    </TableCell>
                  </TableRow>
                ) : filteredBulletins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Aucun bulletin trouvé pour cette période.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBulletins.map((bulletin) => (
                    <TableRow key={bulletin.id} className="hover:bg-white/5 transition-colors border-white/5">
                      <TableCell className="font-medium text-muted-foreground">{bulletin.periode}</TableCell>
                      <TableCell className="font-semibold">{bulletin.employe_nom}</TableCell>
                      <TableCell className="text-right">
                        {(parseFloat(bulletin.salaire_base) + parseFloat(bulletin.heures_sup) + (bulletin.primes?.reduce((s: number, p: any) => s + parseFloat(p.montant), 0) || 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </TableCell>
                      <TableCell className="text-right text-amber-500/80">-{parseFloat(bulletin.cnss_employe).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                      <TableCell className="text-right text-rose-500/80">-{parseFloat(bulletin.ipr).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-500">
                        {parseFloat(bulletin.net_a_payer).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          bulletin.statut === 'payé' ? 'default' :
                          bulletin.statut === 'validé' ? 'outline' : 'secondary'
                        } className={
                          bulletin.statut === 'payé' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                          bulletin.statut === 'validé' ? 'border-primary/50 text-primary' : ''
                        }>
                          {bulletin.statut.charAt(0).toUpperCase() + bulletin.statut.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </GlassCard>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[800px] lg:max-w-[1000px] border-white/10 bg-background/95 backdrop-blur-xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-white/10 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calculator className="h-5 w-5 text-primary" />
              Saisie d'un Bulletin de Paie
            </DialogTitle>
            <DialogDescription className="hidden">Saisie d'un nouveau bulletin de paie</DialogDescription>
          </DialogHeader>
          <div className="p-6 overflow-y-auto scrollbar-thin flex-1">
            <BulletinForm onSuccess={handleSuccess} onCancel={() => setIsDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
