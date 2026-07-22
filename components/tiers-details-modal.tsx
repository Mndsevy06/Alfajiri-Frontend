'use client';

import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button as NeonButton } from '@/components/ui/Layout';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Briefcase,
  Users,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiersDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiersData: any;
}

export function TiersDetailsModal({ open, onOpenChange, tiersData }: TiersDetailsModalProps) {
  if (!tiersData) return null;

  const debit = parseFloat(tiersData.soldeDebit || 0);
  const credit = parseFloat(tiersData.soldeCredit || 0);
  const soldeNet = debit - credit;
  const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col border-muted/50 shadow-2xl overflow-hidden p-0 rounded-xl [&>button]:hidden">
        
        {/* Custom close button */}
        <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent shrink-0"></div>
        
        {/* Header Header */}
        <div className="relative px-6 pt-6 pb-4 flex flex-col items-center justify-center gap-2.5 border-b border-border/30 backdrop-blur-sm text-center shrink-0">
          <div className="h-16 w-16 rounded-full bg-background border-4 border-background shadow-md flex items-center justify-center text-2xl font-bold text-primary shrink-0 relative overflow-hidden ring-2 ring-primary/20">
            {tiersData.photo_profil ? (
              <img src={tiersData.photo_profil} alt={tiersData.nom} className="w-full h-full object-cover" />
            ) : (
              tiersData.nom ? tiersData.nom.substring(0, 2).toUpperCase() : '??'
            )}
          </div>
          <div className="flex flex-col items-center max-w-[85%] mx-auto">
            <h2 className="text-xl font-bold text-foreground leading-tight">{tiersData.nom}</h2>
            <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className="text-xs font-semibold bg-primary/5 text-primary border-primary/20 capitalize px-2.5 py-0.5">
                {tiersData.type}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                Code: {tiersData.code}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 grid gap-5 overflow-y-auto scrollbar-thin flex-1">
          
          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informations de Contact</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 transition-colors hover:bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Téléphone</span>
                  <span className="text-sm font-medium">{tiersData.telephone || 'Non renseigné'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 transition-colors hover:bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium break-all">{tiersData.email || 'Non renseigné'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comptabilité Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Comptabilité & Finances</h3>
            
            <div className="flex items-center justify-between p-3 rounded-t-lg bg-muted/30 border border-border/50 border-b-0">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Compte Rattaché</span>
              </div>
              <span className="font-mono text-sm font-semibold">{tiersData.compte || 'Aucun'}</span>
            </div>

            <div className="grid grid-cols-2">
              <div className="p-3 border border-border/50 bg-background flex flex-col items-center justify-center gap-1 border-r-0">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Débit</span>
                <span className="font-mono text-sm font-semibold text-muted-foreground">{formatCurrency(debit)}</span>
              </div>
              <div className="p-3 border border-border/50 bg-background flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Crédit</span>
                <span className="font-mono text-sm font-semibold text-muted-foreground">{formatCurrency(credit)}</span>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-b-lg border border-border/50 border-t-0 flex items-center justify-between",
              soldeNet > 0 ? "bg-chart-2/10" : soldeNet < 0 ? "bg-destructive/10" : "bg-muted/30"
            )}>
              <span className="text-sm font-bold uppercase tracking-wider">Solde Net</span>
              <span className={cn(
                "font-mono text-lg font-bold",
                soldeNet > 0 ? "text-chart-2" : soldeNet < 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {formatCurrency(soldeNet)}
              </span>
            </div>
            
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
