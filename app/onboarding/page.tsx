'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  CalendarDays,
  Coins,
  ArrowRight,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    sigle: '',
    status: '',
    adresse: '',
    ville: '',
    pays: '',
    telephone: '',
    email: '',
    rccm: '',
    idNat: '',
    nImpot: '',
    dateStart: '',
    dateEnd: '',
    currency: '',
    exerciceEnCours: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.name || !formData.status || !formData.adresse) {
        toast.error("Veuillez remplir les informations de l'entreprise.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.rccm || !formData.idNat || !formData.nImpot) {
        toast.error("Veuillez remplir les informations fiscales.");
        return;
      }
      setStep(3);
    } else {
      if (!formData.dateStart || !formData.dateEnd || !formData.currency) {
        toast.error('Veuillez définir les paramètres comptables.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        toast.success('Configuration terminée', {
          description: 'Votre environnement de travail est prêt.',
        });
        router.push('/dashboard');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Dynamic Background for Glassmorphism */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-normal animate-pulse [animation-duration:10s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-chart-2/20 blur-[120px] mix-blend-normal" />
      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-background/40 p-5 sm:p-7 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/30 dark:border-white/10 backdrop-blur-3xl z-10 mx-4 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/10 dark:to-white/0 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-6 text-center space-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-xl shadow-primary/30 mb-1 ring-1 ring-white/20">
              <Building2 className="h-6 w-6" />
            </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Configuration Initiale</h1>
          <p className="text-muted-foreground text-xs max-w-[80%]">
            Personnalisez votre espace de travail en définissant les paramètres de votre entreprise.
          </p>
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className={`h-2 rounded-full transition-all duration-500 ${step >= 1 ? 'w-12 bg-primary' : 'w-4 bg-muted'}`} />
          <div className={`h-2 rounded-full transition-all duration-500 ${step >= 2 ? 'w-12 bg-primary' : 'w-4 bg-muted'}`} />
          <div className={`h-2 rounded-full transition-all duration-500 ${step >= 3 ? 'w-12 bg-primary' : 'w-4 bg-muted'}`} />
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-semibold">Raison sociale</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="TransAfrique"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sigle" className="text-xs font-semibold">Sigle</Label>
                    <div className="relative">
                      <Input
                        id="sigle"
                        placeholder="TACT"
                        value={formData.sigle}
                        onChange={(e) => setFormData({ ...formData, sigle: e.target.value })}
                        className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-semibold">Statut juridique</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-10 bg-background/60 border-white/10 text-sm">
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SARL">SARL (Société à Responsabilité Limitée)</SelectItem>
                      <SelectItem value="SA">SA (Société Anonyme)</SelectItem>
                      <SelectItem value="SAS">SAS (Société par Actions Simplifiée)</SelectItem>
                      <SelectItem value="Ets">Établissement (Ets)</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse" className="text-xs font-semibold">Adresse physique</Label>
                  <div className="relative">
                    <Input
                      id="adresse"
                      placeholder="Avenue du Ciment 42, Lubumbashi..."
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ville" className="text-xs font-semibold">Ville</Label>
                    <Input
                      id="ville"
                      placeholder="Ex: Lubumbashi"
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pays" className="text-xs font-semibold">Pays</Label>
                    <Input
                      id="pays"
                      placeholder="Ex: RDC"
                      value={formData.pays}
                      onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                      className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telephone" className="text-xs font-semibold">Téléphone</Label>
                    <Input
                      id="telephone"
                      placeholder="+243 ..."
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@entreprise.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="rccm" className="text-xs font-semibold">RCCM</Label>
                  <div className="relative">
                    <Input
                      id="rccm"
                      placeholder="RCC/CD/HKT/2023/B-0142"
                      value={formData.rccm}
                      onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
                      className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="idNat" className="text-xs font-semibold">Identification Nationale</Label>
                  <div className="relative">
                    <Input
                      id="idNat"
                      placeholder="01-N8-K7400-X-2023"
                      value={formData.idNat}
                      onChange={(e) => setFormData({ ...formData, idNat: e.target.value })}
                      className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nImpot" className="text-xs font-semibold">Numéro d'Impôt</Label>
                  <div className="relative">
                    <Input
                      id="nImpot"
                      placeholder="A0142891Z"
                      value={formData.nImpot}
                      onChange={(e) => setFormData({ ...formData, nImpot: e.target.value })}
                      className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="exerciceEnCours" className="text-xs font-semibold">Année Fiscale (Exercice en cours)</Label>
                  <div className="relative">
                    <Input
                      id="exerciceEnCours"
                      placeholder="Ex: 2025"
                      value={formData.exerciceEnCours}
                      onChange={(e) => setFormData({ ...formData, exerciceEnCours: e.target.value })}
                      className="h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateStart" className="text-xs font-semibold">Début exercice</Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateStart"
                        type="date"
                        value={formData.dateStart}
                        onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                        className="pl-10 h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateEnd" className="text-xs font-semibold">Fin exercice</Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateEnd"
                        type="date"
                        value={formData.dateEnd}
                        onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                        className="pl-10 h-10 bg-background/60 focus-visible:bg-background transition-colors border-white/10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-xs font-semibold">Devise principale</Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 text-muted-foreground" />
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger className="pl-10 h-10 bg-background/60 border-white/10 text-sm">
                        <SelectValue placeholder="Sélectionnez une devise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dollar Américain</SelectItem>
                        <SelectItem value="CDF">CDF - Franc Congolais</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 mt-6">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="h-10 px-6 text-sm"
                onClick={() => setStep(step - 1)}
              >
                Retour
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 text-sm font-medium shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Configuration...
                </span>
              ) : step < 3 ? (
                <span className="flex items-center gap-2">
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Terminer la configuration
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </form>
        </div>
      </motion.div>
    </div>
  );
}
