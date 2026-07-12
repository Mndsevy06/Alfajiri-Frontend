'use client';

import { useState } from 'react';
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

interface PaymentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('encaissement');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulation of API Call
    setTimeout(() => {
      toast.success(
        type === 'encaissement' 
          ? 'Encaissement enregistré avec succès' 
          : 'Paiement enregistré avec succès',
        {
          description: 'La pièce a été journalisée et lettrée.'
        }
      );
      setLoading(false);
      if (onSuccess) onSuccess();
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="encaissement" className="w-full" onValueChange={setType}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="encaissement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Encaissement Client
          </TabsTrigger>
          <TabsTrigger value="decaissement" className="data-[state=active]:destructive data-[state=active]:text-destructive-foreground">
            Paiement Fournisseur
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tiers">{type === 'encaissement' ? 'Client' : 'Fournisseur/Transporteur'}</Label>
              <Select required>
                <SelectTrigger className="bg-background/50 backdrop-blur-sm">
                  <SelectValue placeholder="Sélectionnez un tiers" />
                </SelectTrigger>
                <SelectContent>
                  {type === 'encaissement' ? (
                    <>
                      <SelectItem value="client-1">Société Minière KZI</SelectItem>
                      <SelectItem value="client-2">Construct RDC</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="fourn-1">Dangote Zambia</SelectItem>
                      <SelectItem value="fourn-2">Transports Mabuya</SelectItem>
                      <SelectItem value="fourn-3">Caisse de Site (Sabri)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date de l'opération</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  required
                  className="pl-10 bg-background/50 backdrop-blur-sm"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
                  className="pl-10 bg-background/50 backdrop-blur-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Mode de Paiement</Label>
              <Select required defaultValue="virement">
                <SelectTrigger className="bg-background/50 backdrop-blur-sm">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence (N° Facture / BL)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reference"
                placeholder="Ex: FAC-2025-0042"
                required
                className="pl-10 bg-background/50 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Justificatif (Obligatoire)</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer bg-background/30 backdrop-blur-sm">
              <UploadCloud className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-medium">Glissez-déposez la preuve</p>
              <p className="text-xs text-muted-foreground">PDF, JPG ou PNG (Max 5MB)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">Mémorandum / Notes</Label>
            <Textarea
              id="memo"
              placeholder="Notes..."
              className="resize-none h-14 bg-background/50 backdrop-blur-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={loading} className="gap-2 shadow-lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Traitement...
                </span>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Valider l'Opération
                </>
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
