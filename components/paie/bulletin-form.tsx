'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2,
  Calculator, 
  CalendarIcon, 
  CheckCircle2, 
  ChevronLeft,
  ChevronRight,
  FileText, 
  Plus, 
  Trash2, 
  User,
  Wallet,
  Clock,
  CreditCard,
  Banknote,
  Landmark,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BulletinFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Tier {
  code: string;
  nom: string;
  type: string;
}

const STEPS = [
  { id: 1, title: 'Informations Générales', description: 'Employé, période et contrat', icon: User },
  { id: 2, title: 'Rémunération Brute', description: 'Salaire, heures sup, primes', icon: Plus },
  { id: 3, title: 'Déductions & Retenues', description: 'Cotisations (CNSS) et impôts (IPR)', icon: Trash2 },
  { id: 4, title: 'Charges & Récapitulatif', description: 'Charges employeur et Net', icon: Building2 },
];

export function BulletinForm({ onSuccess, onCancel }: BulletinFormProps) {
  const [loading, setLoading] = useState(false);
  const [employes, setEmployes] = useState<Tier[]>([]);
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Form State
  const [selectedEmploye, setSelectedEmploye] = useState('');
  const [periode, setPeriode] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [joursTravailles, setJoursTravailles] = useState(26); // 26 days is standard in DRC
  const [modePaiement, setModePaiement] = useState('virement');
  
  // Gains
  const [salaireBase, setSalaireBase] = useState(0);
  const [heuresSup, setHeuresSup] = useState(0);
  const [primes, setPrimes] = useState<{ id: string; libelle: string; montant: number; imposable: boolean; cotisable: boolean }[]>([]);
  
  // Retenues
  const [tauxCnss, setTauxCnss] = useState(5); // 5% part employé par défaut RDC
  const [tauxIpr, setTauxIpr] = useState(15); // Taux IPR moyen/forfaitaire par défaut
  const [avances, setAvances] = useState(0);
  
  // Cotisations Patronales (RDC OHADA standards)
  const [tauxCnssPatronal, setTauxCnssPatronal] = useState(13); // 13% par défaut
  const [tauxInpp, setTauxInpp] = useState(1); // 1% à 3% selon la taille de l'entreprise
  const [tauxOnem, setTauxOnem] = useState(0.2); // 0.2% par défaut

  useEffect(() => {
    const loadEmployes = async () => {
      try {
        const data = await fetchWithAuth('/plan_comptable/tiers/');
        setEmployes(data.filter((t: Tier) => t.type === 'personnel'));
      } catch (error) {
        console.error('Error loading employes', error);
        toast.error('Impossible de charger la liste des employés.');
      }
    };
    loadEmployes();
  }, []);

  const addPrime = () => {
    setPrimes([...primes, { id: Date.now().toString(), libelle: '', montant: 0, imposable: true, cotisable: true }]);
  };

  const removePrime = (id: string) => {
    setPrimes(primes.filter(p => p.id !== id));
  };

  const updatePrime = (id: string, field: string, value: any) => {
    setPrimes(primes.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Calculations OHADA
  const totalPrimesCotisables = primes.filter(p => p.cotisable).reduce((sum, p) => sum + p.montant, 0);
  const totalPrimesImposables = primes.filter(p => p.imposable).reduce((sum, p) => sum + p.montant, 0);
  
  const salaireBrutCotisable = salaireBase + heuresSup + totalPrimesCotisables;
  const salaireBrutImposable = salaireBase + heuresSup + totalPrimesImposables;
  
  // Retenues Employé
  const cnssEmploye = (salaireBrutCotisable * tauxCnss) / 100;
  
  // Charges Patronales
  const cnssPatronal = (salaireBrutCotisable * tauxCnssPatronal) / 100;
  const inppPatronal = (salaireBrutCotisable * tauxInpp) / 100;
  const onemPatronal = (salaireBrutCotisable * tauxOnem) / 100;
  const totalChargesPatronales = cnssPatronal + inppPatronal + onemPatronal;
  
  // Base Imposable nette (Brut imposable - Cotisations sociales déductibles)
  const baseImposableNette = Math.max(0, salaireBrutImposable - cnssEmploye);
  
  // IPR (calculé sur la base nette imposable)
  const ipr = (baseImposableNette * tauxIpr) / 100;
  
  // Le Net à Payer = Salaire Brut Global - Retenues (Sociales + Fiscales + Avances)
  const salaireBrutGlobal = salaireBase + heuresSup + primes.reduce((sum, p) => sum + p.montant, 0);
  const totalRetenues = cnssEmploye + ipr + avances;
  const netAPayer = Math.max(0, salaireBrutGlobal - totalRetenues);

  const getModePaiementLabel = (val: string) => {
    const modes: Record<string, string> = {
      virement: 'Virement Bancaire',
      equity_bcdc: 'Equity BCDC',
      rawbank: 'Rawbank / Illicocash',
      especes: 'Espèces',
      mpesa: 'M-Pesa',
      airtel_money: 'Airtel Money',
      orange_money: 'Orange Money',
      afrimoney: 'Afrimoney'
    };
    return modes[val] || val;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentStep !== STEPS.length) return;

    setLoading(true);
    
    try {
      const payload = {
        employe: selectedEmploye,
        periode,
        jours_travailles: joursTravailles,
        mode_paiement: modePaiement,
        salaire_base: Number(salaireBase.toFixed(2)),
        heures_sup: Number(heuresSup.toFixed(2)),
        primes: primes.map(p => ({ ...p, montant: Number(p.montant.toFixed(2)) })),
        cnss_employe: Number(cnssEmploye.toFixed(2)),
        ipr: Number(ipr.toFixed(2)),
        avances: Number(avances.toFixed(2)),
        cnss_patronal: Number(cnssPatronal.toFixed(2)),
        inpp_patronal: Number(inppPatronal.toFixed(2)),
        onem_patronal: Number(onemPatronal.toFixed(2)),
        net_a_payer: Number(netAPayer.toFixed(2)),
        statut: 'valide' // Par défaut on le met en validé lors de la création via l'assistant pour le test
      };
      
      await fetchWithAuth('/rh/bulletins/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      toast.success('Bulletin de paie généré avec succès !', {
        description: 'Le bulletin a été enregistré et est prêt à être validé.'
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving bulletin', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du bulletin');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && (!selectedEmploye || !periode || !joursTravailles)) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (currentStep === 2 && salaireBase <= 0) {
      toast.error('Le salaire de base doit être supérieur à 0.');
      return;
    }
    
    if (currentStep < STEPS.length) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98,
    })
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-b-xl overflow-hidden">
      {/* Wizard Header / Progress - Compact */}
      <div className="px-6 py-4 shrink-0 border-b border-border bg-muted/10">
        <div className="flex justify-between items-center relative max-w-2xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 rounded-full z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-300 ease-in-out" 
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          
          {STEPS.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  currentStep === step.id ? "bg-primary text-primary-foreground shadow-sm" :
                  currentStep > step.id ? "bg-primary/20 text-primary border border-primary/30" :
                  "bg-background border border-border text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              <div className="mt-2 text-center absolute top-8 hidden sm:block w-24">
                <p className={cn("text-[10px] font-medium leading-tight", currentStep >= step.id ? "text-primary" : "text-muted-foreground")}>
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            {/* STEP 1: Informations Générales */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Informations Administratives</h3>
                  <p className="text-sm text-muted-foreground">Sélectionnez l'employé et la période concernée.</p>
                </div>
                
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="employe" className="text-sm font-medium">Employé <span className="text-destructive">*</span></Label>
                    <Select value={selectedEmploye} onValueChange={setSelectedEmploye}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un employé..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employes.map(emp => (
                          <SelectItem key={emp.code} value={emp.code}>
                            {emp.nom} - <span className="text-muted-foreground text-xs">{emp.code}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="periode" className="text-sm font-medium">Période <span className="text-destructive">*</span></Label>
                      <Input
                        id="periode"
                        type="month"
                        value={periode}
                        onChange={e => setPeriode(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jours" className="text-sm font-medium">Jours Trav. <span className="text-destructive">*</span></Label>
                      <Input
                        id="jours"
                        type="number"
                        min="0"
                        max="31"
                        value={joursTravailles}
                        onChange={e => setJoursTravailles(parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modePaiement" className="text-sm font-medium">Mode de Paiement <span className="text-destructive">*</span></Label>
                      <Select value={modePaiement} onValueChange={setModePaiement}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="Choisir un mode de paiement" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Banques & Espèces</div>
                          <SelectItem value="virement">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center"><Landmark className="w-3.5 h-3.5 text-foreground" /></div>
                              <span>Virement Bancaire</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="equity_bcdc">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#802434] flex items-center justify-center text-[8px] font-bold text-white leading-none text-center">EQTY</div>
                              <span>Equity BCDC</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="rawbank">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#f4d03f] flex items-center justify-center text-[10px] font-bold text-black italic">R</div>
                              <span>Rawbank / Illicocash</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="especes">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center"><Banknote className="w-3.5 h-3.5 text-emerald-600" /></div>
                              <span>Espèces (Cash)</span>
                            </div>
                          </SelectItem>
                          
                          <div className="px-2 py-1.5 mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-border">Mobile Money</div>
                          <SelectItem value="mpesa">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#00b14f] flex items-center justify-center text-[8px] font-bold text-white tracking-tighter">M-PESA</div>
                              <span>M-Pesa (Vodacom)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="airtel_money">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#ff0000] flex items-center justify-center text-[10px] font-bold text-white tracking-tighter italic">airtel</div>
                              <span>Airtel Money</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="orange_money">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#ff7900] flex items-center justify-center text-[12px] font-bold text-black tracking-tighter">O</div>
                              <span>Orange Money</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="afrimoney">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#702082] flex items-center justify-center text-[6px] font-bold text-white tracking-tighter uppercase text-center leading-none">AFRI<br/>MONEY</div>
                              <span>Afrimoney (Africell)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Gains & Rémunération */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Rémunération Brute</h3>
                  <p className="text-sm text-muted-foreground">Saisissez les montants en USD.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaireBase" className="text-sm font-medium">Salaire de Base <span className="text-destructive">*</span></Label>
                    <Input
                      id="salaireBase"
                      type="number"
                      min="0"
                      step="0.01"
                      value={salaireBase || ''}
                      onChange={e => setSalaireBase(parseFloat(e.target.value) || 0)}
                      className="font-medium"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heuresSup" className="text-sm font-medium">Heures Supplémentaires</Label>
                    <Input
                      id="heuresSup"
                      type="number"
                      min="0"
                      step="0.01"
                      value={heuresSup || ''}
                      onChange={e => setHeuresSup(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Primes et Indemnités</Label>
                    <Button type="button" onClick={addPrime} variant="secondary" size="sm" className="h-8">
                      <Plus className="h-3 w-3 mr-1" /> Ajouter
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <AnimatePresence>
                      {primes.map((prime) => (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          key={prime.id} 
                          className="flex flex-wrap items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border"
                        >
                          <div className="flex-1 min-w-[120px]">
                            <Input 
                              placeholder="Libellé de la prime" 
                              value={prime.libelle} 
                              onChange={(e) => updatePrime(prime.id, 'libelle', e.target.value)} 
                              className="h-8 text-sm bg-background"
                            />
                          </div>
                          <div className="w-24">
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              value={prime.montant || ''} 
                              onChange={(e) => updatePrime(prime.id, 'montant', parseFloat(e.target.value) || 0)} 
                              className="h-8 text-sm bg-background font-medium"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex items-center gap-2 px-2">
                            <Switch 
                              checked={prime.cotisable}
                              onCheckedChange={(c) => updatePrime(prime.id, 'cotisable', c)}
                              title="Cotisable"
                            />
                            <span className="text-[10px] text-muted-foreground w-10">Cotis.</span>
                            
                            <Switch 
                              checked={prime.imposable}
                              onCheckedChange={(c) => updatePrime(prime.id, 'imposable', c)}
                              title="Imposable"
                            />
                            <span className="text-[10px] text-muted-foreground w-10">Impos.</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => removePrime(prime.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {primes.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">Aucune prime ajoutée</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Retenues */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Déductions & Retenues</h3>
                  <p className="text-sm text-muted-foreground">CNSS, IPR et Avances éventuelles.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Social */}
                  <div className="space-y-4 bg-muted/20 p-5 rounded-xl border border-border">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground"/> Retenues Sociales</h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="tauxCnss" className="text-xs">Taux CNSS Employé (%)</Label>
                        <Input
                          id="tauxCnss"
                          type="number"
                          min="0"
                          step="0.1"
                          value={tauxCnss}
                          onChange={e => setTauxCnss(parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div className="pt-2 border-t border-border/50 text-xs">
                        <div className="flex justify-between py-1 mt-2">
                          <span className="text-muted-foreground">Base Cotisable:</span>
                          <span className="font-medium">{salaireBrutCotisable.toFixed(2)} $</span>
                        </div>
                        <div className="flex justify-between font-medium text-rose-500 py-1">
                          <span>Montant CNSS:</span>
                          <span>-{cnssEmploye.toFixed(2)} $</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fiscal & Autres */}
                  <div className="space-y-4 bg-muted/20 p-5 rounded-xl border border-border">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><Calculator className="w-4 h-4 text-muted-foreground"/> Fiscal & Avances</h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="tauxIpr" className="text-xs">Taux IPR (%)</Label>
                        <Input
                          id="tauxIpr"
                          type="number"
                          min="0"
                          step="0.1"
                          value={tauxIpr}
                          onChange={e => setTauxIpr(parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                        <div className="pt-2 border-t border-border/50 text-xs">
                          <div className="flex justify-between py-1 mt-2">
                            <span className="text-muted-foreground">Base imposable:</span>
                            <span className="font-medium">{baseImposableNette.toFixed(2)} $</span>
                          </div>
                          <div className="flex justify-between font-medium text-rose-500 py-1">
                            <span>Montant IPR:</span>
                            <span>-{ipr.toFixed(2)} $</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 pt-1">
                        <Label htmlFor="avances" className="text-xs">Avances & Acomptes (USD)</Label>
                        <Input
                          id="avances"
                          type="number"
                          min="0"
                          step="0.01"
                          value={avances || ''}
                          onChange={e => setAvances(parseFloat(e.target.value) || 0)}
                          className="h-8"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Charges Patronales & Récapitulatif final */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Récapitulatif & Validation</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patronal & Fisc */}
                  <div className="space-y-4 bg-muted/20 p-5 rounded-xl border border-border flex flex-col">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground"/> Charges & Déclarations</h4>
                    
                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider border-b border-border/50 pb-1">Cotisations Sociales (CNSS / INPP / ONEM)</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="tauxCnssPatronal" className="text-[10px] text-muted-foreground">CNSS Patronal (%)</Label>
                          <Input
                            id="tauxCnssPatronal"
                            type="number"
                            min="0"
                            step="0.1"
                            value={tauxCnssPatronal}
                            onChange={e => setTauxCnssPatronal(parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs"
                          />
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Patronal:</span>
                            <span className="font-medium">{cnssPatronal.toFixed(2)} $</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="tauxInpp" className="text-[10px] text-muted-foreground">INPP Patronal (%)</Label>
                          <Input
                            id="tauxInpp"
                            type="number"
                            min="0"
                            step="0.1"
                            value={tauxInpp}
                            onChange={e => setTauxInpp(parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs"
                          />
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Patronal:</span>
                            <span className="font-medium">{inppPatronal.toFixed(2)} $</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="tauxOnem" className="text-[10px] text-muted-foreground">ONEM Patronal (%)</Label>
                          <Input
                            id="tauxOnem"
                            type="number"
                            min="0"
                            step="0.1"
                            value={tauxOnem}
                            onChange={e => setTauxOnem(parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs"
                          />
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Patronal:</span>
                            <span className="font-medium">{onemPatronal.toFixed(2)} $</span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-end pb-1 text-xs">
                          <div className="flex justify-between border-t border-border pt-1">
                            <span className="font-semibold">Total Patronal:</span>
                            <span className="font-bold">{totalChargesPatronales.toFixed(2)} $</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 mt-auto">
                      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider border-b border-border/50 pb-1">Retenues Fiscales (Fisc / DGI)</div>
                      <div className="flex justify-between items-center text-xs bg-rose-500/10 text-rose-600 p-2 rounded-md border border-rose-500/20">
                        <span className="font-medium">IPR ({tauxIpr}%)</span>
                        <span className="font-bold">{ipr.toFixed(2)} $</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground italic">
                        *L'IPR est déduit du salaire mais doit être reversé au fisc par l'employeur.
                      </div>
                    </div>
                  </div>

                  {/* Fiche */}
                  <div className="space-y-3 bg-primary/5 p-5 rounded-xl border border-primary/20 flex flex-col">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/> Fiche de Paie</h4>
                    <div className="text-xs space-y-1">
                      <p><span className="text-muted-foreground">Employé:</span> <span className="font-medium">{employes.find(e => e.code === selectedEmploye)?.nom || 'N/A'}</span></p>
                      <p><span className="text-muted-foreground">Période:</span> <span className="font-medium">{periode}</span> ({joursTravailles} jours)</p>
                    </div>
                    
                    <div className="text-xs space-y-1.5 pt-3 border-t border-border/50">
                      <div className="flex justify-between text-muted-foreground"><span>Salaire de Base</span> <span>{salaireBase.toFixed(2)} $</span></div>
                      {heuresSup > 0 && <div className="flex justify-between text-muted-foreground"><span>Heures Sup</span> <span>+{heuresSup.toFixed(2)} $</span></div>}
                      {primes.length > 0 && <div className="flex justify-between text-muted-foreground"><span>Primes</span> <span>+{primes.reduce((sum, p) => sum + p.montant, 0).toFixed(2)} $</span></div>}
                      <div className="flex justify-between font-semibold pt-1 text-foreground"><span>Brut Global</span> <span>{salaireBrutGlobal.toFixed(2)} $</span></div>
                    </div>
                    
                    <div className="text-xs space-y-1.5 pt-3 border-t border-border/50 text-rose-500/90">
                      <div className="flex justify-between"><span>Retenue CNSS</span> <span>-{cnssEmploye.toFixed(2)} $</span></div>
                      <div className="flex justify-between"><span>Retenue IPR</span> <span>-{ipr.toFixed(2)} $</span></div>
                      {avances > 0 && <div className="flex justify-between"><span>Avances</span> <span>-{avances.toFixed(2)} $</span></div>}
                    </div>

                    <div className="pt-6 border-t border-primary/20 relative z-10 mt-auto">
                      <p className="text-[11px] text-primary uppercase tracking-widest font-semibold mb-2">Net à Payer (au {getModePaiementLabel(modePaiement)})</p>
                      <div className="flex items-baseline gap-3">
                        <p className="text-2xl font-bold text-primary">{netAPayer.toFixed(2)} $</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Navigation */}
      <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10 shrink-0">
        <div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} size="sm" className="text-muted-foreground">
              Annuler
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1 || loading}
            size="sm"
            className="w-24"
          >
            Précédent
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button 
              onClick={nextStep} 
              size="sm"
              className="w-24"
            >
              Suivant
            </Button>
          ) : (
            <Button 
              onClick={() => handleSubmit()} 
              disabled={loading}
              size="sm"
              className="w-32"
            >
              {loading ? 'Validation...' : 'Valider'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
