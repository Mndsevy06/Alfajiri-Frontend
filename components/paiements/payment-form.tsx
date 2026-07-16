'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  CalendarIcon, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Landmark, 
  UploadCloud, 
  User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api';

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
  const [type, setType] = useState('encaissement');
  const [tiersList, setTiersList] = useState<Tier[]>([]);
  
  // Form State
  const [selectedTier, setSelectedTier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('virement');
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadTiers = async () => {
      try {
        const data = await fetchWithAuth('/plan_comptable/tiers/');
        setTiersList(data);
      } catch (error) {
        console.error('Error loading tiers', error);
        toast.error('Erreur lors du chargement des tiers');
      }
    };
    loadTiers();
  }, []);

  const filteredTiers = tiersList.filter(tier => {
    if (type === 'encaissement') {
      return tier.type === 'client';
    } else {
      return tier.type === 'fournisseur';
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
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

  return (
    <div className="space-y-4">
      <Tabs defaultValue="encaissement" className="w-full" onValueChange={(val) => {
        setType(val);
        setSelectedTier(''); // Reset selection on type change
      }}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="encaissement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Encaissement Client
          </TabsTrigger>
          <TabsTrigger value="decaissement" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
            Paiement Fournisseur
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tiers">{type === 'encaissement' ? 'Client' : 'Fournisseur'}</Label>
              <Select required value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="bg-background/50 backdrop-blur-sm h-10">
                  <SelectValue placeholder="Sélectionnez un tiers" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTiers.map(tier => (
                    <SelectItem key={tier.code} value={tier.code}>
                      {tier.nom}
                    </SelectItem>
                  ))}
                  {filteredTiers.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">Aucun tiers trouvé</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="pl-10 h-10 bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-10 h-10 bg-background/50 backdrop-blur-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="method">Mode de Paiement</Label>
              <Select required value={method} onValueChange={setMethod}>
                <SelectTrigger className="bg-background/50 backdrop-blur-sm h-10">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement Bancaire</SelectItem>
                  <SelectItem value="especes">Espèces (Caisse)</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reference">Référence (N° Facture/BL)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reference"
                  placeholder="Ex: FAC-2025"
                  required
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="pl-10 h-10 bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memo">Notes (Optionnel)</Label>
              <Input
                id="memo"
                placeholder="Commentaires..."
                value={memo}
                onChange={e => setMemo(e.target.value)}
                className="h-10 bg-background/50 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border/50">
            <div className="w-full sm:w-1/3">
              <input
                type="file"
                ref={fileRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              <div 
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-md p-2 flex items-center justify-center gap-2 transition-colors cursor-pointer bg-background/30 backdrop-blur-sm h-10 ${file ? 'border-primary text-primary' : 'border-muted-foreground/25 text-muted-foreground hover:bg-muted/50'}`}
              >
                <UploadCloud className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium truncate">
                  {file ? file.name : "Joindre fichier"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {onCancel && (
                <Button type="button" variant="outline" className="h-10" onClick={onCancel} disabled={loading}>
                  Annuler
                </Button>
              )}
              <Button type="submit" disabled={loading} className="gap-2 h-10 shadow-lg">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Traitement...
                  </span>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Valider
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
