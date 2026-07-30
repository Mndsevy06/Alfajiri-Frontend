'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDownRight,
  ArrowUpRight,
  CalendarIcon, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Landmark, 
  PlusCircle, 
  UploadCloud, 
  User,
  Wallet
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
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api';
import { TiersFormModal } from '@/components/tiers-form-modal';
import { cn } from '@/lib/utils';

interface PaymentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Tier {
  code: string;
  nom: string;
  type: string;
}

export function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'encaissement' | 'decaissement'>('encaissement');
  const [tiersList, setTiersList] = useState<Tier[]>([]);
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);
  
  const generateReference = (paymentType: string) => {
    const prefix = paymentType === 'encaissement' ? 'ENC' : 'DEC';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${dateStr}-${random}`;
  };

  // Form State
  const [selectedTier, setSelectedTier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('virement');
  const [reference, setReference] = useState(generateReference('encaissement'));
  const [memo, setMemo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const loadTiers = async () => {
    try {
      const data = await fetchWithAuth('/plan_comptable/tiers/');
      setTiersList(data);
    } catch (error) {
      console.error('Error loading tiers', error);
      toast.error('Erreur lors du chargement des tiers');
    }
  };

  useEffect(() => {
    loadTiers();
  }, []);

  useEffect(() => {
    setReference(generateReference(type));
  }, [type]);

  const filteredTiers = tiersList.filter(tier => {
    if (type === 'encaissement') {
      return tier.type === 'client';
    } else {
      return tier.type === 'fournisseur';
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'decaissement') {
      setShowWarning(true);
    } else {
      processPayment();
    }
  };

  const processPayment = async () => {
    setLoading(true);
    setShowWarning(false);
    
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('date', date);
      formData.append('tiers', selectedTier);
      formData.append('montant', amount);
      formData.append('mode', method);
      formData.append('reference', reference);
      formData.append('memo', memo);
      formData.append('statut', 'en_attente');
      
      if (file) {
        formData.append('justificatif', file);
      }

      await fetchWithAuth('/paiements/operations/', {
        method: 'POST',
        body: formData
      });

      toast.success(
        type === 'encaissement' 
          ? 'Encaissement enregistré avec succès' 
          : 'Paiement enregistré avec succès'
      );
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving payment', error);
      toast.error('Erreur lors de l\'enregistrement de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Custom Tabs */}
      <div className="flex p-1 bg-muted/50 rounded-xl">
        <button
          type="button"
          onClick={() => { setType('encaissement'); setSelectedTier(''); }}
          className={cn(
            "relative flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors",
            type === 'encaissement' ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {type === 'encaissement' && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 shadow-sm border border-emerald-500/20 rounded-lg"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4" />
            Encaissement Client
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setType('decaissement'); setSelectedTier(''); }}
          className={cn(
            "relative flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors",
            type === 'decaissement' ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {type === 'decaissement' && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-rose-500/10 dark:bg-rose-500/20 shadow-sm border border-rose-500/20 rounded-lg"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Paiement Fournisseur
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Tiers */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="tiers" className="text-sm font-medium">
              {type === 'encaissement' ? 'Client' : 'Fournisseur'}
            </Label>
            <Select 
              required 
              value={selectedTier} 
              onValueChange={(val) => {
                if (val === 'new_tier') {
                  setIsTiersModalOpen(true);
                } else {
                  setSelectedTier(val);
                }
              }}
            >
              <SelectTrigger className="h-10 bg-background/50 focus:ring-primary/20 transition-all">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder={`Sélectionnez un ${type === 'encaissement' ? 'client' : 'fournisseur'}`} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_tier" className="font-semibold text-primary cursor-pointer hover:bg-primary/10">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Ajouter un nouveau {type === 'encaissement' ? 'client' : 'fournisseur'}
                  </div>
                </SelectItem>
                {filteredTiers.map(tier => (
                  <SelectItem key={tier.code} value={tier.code}>
                    {tier.nom}
                  </SelectItem>
                ))}
                {filteredTiers.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground text-center">Aucun tiers trouvé</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-sm font-medium">Montant (USD)</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-10 h-10 bg-background/50 font-semibold text-lg focus-visible:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-sm font-medium">Date</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                id="date"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="pl-10 h-10 bg-background/50 focus-visible:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Method */}
          <div className="space-y-1.5">
            <Label htmlFor="method" className="text-sm font-medium">Mode de Paiement</Label>
            <Select required value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-10 bg-background/50 focus:ring-primary/20 transition-all">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Mode" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virement">Virement Bancaire</SelectItem>
                <SelectItem value="especes">Espèces (Caisse)</SelectItem>
                <SelectItem value="mobile">Mobile Money</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <Label htmlFor="reference" className="text-sm font-medium">Référence (Générée automatiquement)</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                id="reference"
                placeholder="N° Facture / BL"
                required
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="pl-10 h-10 bg-background/50 focus-visible:ring-primary/20 transition-all font-mono text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="memo" className="text-sm font-medium">Notes (Optionnel)</Label>
            <Input
              id="memo"
              placeholder="Commentaires supplémentaires..."
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="h-10 bg-background/50 focus-visible:ring-primary/20 transition-all"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-medium">Justificatif (Optionnel)</Label>
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                file ? "border-primary/50 bg-primary/5" : "bg-background/30"
              )}
            >
              <input
                type="file"
                ref={fileRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center gap-2 text-primary"
                  >
                    <div className="p-3 bg-primary/10 rounded-full">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">Cliquez pour remplacer</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center gap-2 text-muted-foreground"
                  >
                    <div className="p-3 bg-muted rounded-full group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Cliquez ou glissez un fichier</p>
                      <p className="text-xs mt-1">PDF, JPG, PNG (max. 5MB)</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
          {onCancel && (
            <Button 
              type="button" 
              variant="ghost" 
              className="h-10 px-6 rounded-lg font-medium hover:bg-muted/80" 
              onClick={onCancel} 
              disabled={loading}
            >
              Annuler
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading} 
            className="h-10 px-8 rounded-lg font-medium shadow-md hover:shadow-lg transition-all gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Enregistrer l'opération
              </>
            )}
          </Button>
        </div>
      </form>

      <TiersFormModal 
        open={isTiersModalOpen} 
        onOpenChange={setIsTiersModalOpen}
        onSuccess={(newTiers) => {
          if (newTiers && newTiers.code) {
            setSelectedTier(newTiers.code);
          }
          loadTiers();
        }}
        defaultType={type === 'encaissement' ? 'client' : 'fournisseur'}
        allowedTypes={[type === 'encaissement' ? 'client' : 'fournisseur']}
      />

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="border-[var(--border-default)]/50 bg-background/95 text-foreground backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-500 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Vérification du solde
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80 mt-2">
              Vous êtes sur le point d'enregistrer un décaissement de <strong className="text-foreground font-bold">{amount || '0'} USD</strong> via <strong className="text-foreground capitalize">{method.replace('_', ' ')}</strong>.
              <br /><br />
              Veuillez vous assurer que le compte de trésorerie (Caisse ou Banque) dispose des fonds nécessaires. Un solde insuffisant au moment du rapprochement pourrait causer des anomalies comptables.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={loading} className="bg-transparent border-border/50 hover:bg-muted">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); processPayment(); }} disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white shadow-md">
              {loading ? "Traitement..." : "Confirmer le paiement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
