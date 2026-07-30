'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  CreditCard, 
  DollarSign, 
  Filter, 
  Plus, 
  Search, 
  Wallet 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard, Button as NeonButton } from '@/components/ui/Layout';

import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { PaymentForm } from '@/components/paiements/payment-form';
import { fetchWithAuth } from '@/lib/api';
import { toast } from 'sonner';

interface Payment {
  id: string;
  date: string;
  type: string;
  tiers: string;
  tiers_nom: string;
  reference: string;
  montant: string;
  mode: string;
  statut: string;
}

export default function PaiementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterStatut, setFilterStatut] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/paiements/operations/');
      setPayments(data);
    } catch (error) {
      console.error('Failed to fetch payments', error);
      toast.error('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    fetchPayments(); // Refresh list after new payment
  };

  const filteredPayments = payments.filter(payment => {
    const matchSearch = (payment.tiers_nom && payment.tiers_nom.toLowerCase().includes(searchTerm.toLowerCase())) || 
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === 'all' || payment.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  // Calculate KPIs
  const totalEncaissements = payments
    .filter(p => p.type === 'encaissement')
    .reduce((acc, curr) => acc + parseFloat(curr.montant), 0);
    
  const totalDecaissements = payments
    .filter(p => p.type === 'decaissement')
    .reduce((acc, curr) => acc + parseFloat(curr.montant), 0);
    
  const soldeNet = totalEncaissements - totalDecaissements;

  const KPIS = [
    {
      title: 'Total Encaissements',
      value: totalEncaissements.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      change: 'Opérations enregistrées',
      trend: 'up',
      icon: ArrowDownRight,
    },
    {
      title: 'Total Décaissements',
      value: totalDecaissements.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      change: 'Opérations enregistrées',
      trend: 'down',
      icon: ArrowUpRight,
    },
    {
      title: 'Solde Net',
      value: soldeNet.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      change: 'Trésorerie Actuelle',
      trend: soldeNet >= 0 ? 'up' : 'down',
      icon: Wallet,
    },
    {
      title: 'Transactions',
      value: payments.length.toString(),
      change: 'Mouvement total',
      trend: 'neutral',
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-1 sm:gap-4">
        {KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
                <div className="flex flex-col overflow-hidden w-full">
                  <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                    {kpi.title}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                    <span className={cn("text-[10px] sm:text-base font-bold leading-none truncate", 
                      kpi.trend === 'up' && kpi.icon !== ArrowUpRight ? 'text-emerald-500' :
                      kpi.trend === 'down' || kpi.icon === ArrowUpRight ? 'text-rose-500' :
                      'text-amber-500'
                    )} title={kpi.value}>
                      {kpi.value}
                    </span>
                    <span className={cn("text-[7px] sm:text-[9px] font-medium truncate hidden sm:block",
                      kpi.trend === 'up' && kpi.icon !== ArrowUpRight ? 'text-emerald-500/80' :
                      kpi.trend === 'down' || kpi.icon === ArrowUpRight ? 'text-rose-500/80' :
                      'text-amber-500/80'
                    )}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className={cn("p-1 sm:p-1.5 rounded-md shrink-0", 
                  kpi.trend === 'up' && kpi.icon !== ArrowUpRight ? 'bg-emerald-500/10 text-emerald-500' :
                  kpi.trend === 'down' || kpi.icon === ArrowUpRight ? 'bg-rose-500/10 text-rose-500' :
                  'bg-amber-500/10 text-amber-500'
                )}>
                  <kpi.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-[var(--border-default)]/50 mb-1 relative">
          {/* Info gauche */}
          <div className="text-xs text-muted-foreground font-medium">
            {filteredPayments.length} opération{filteredPayments.length > 1 ? 's' : ''}
          </div>

          {/* Boutons icônes (droite) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 shrink-0">
            {showSearch || searchTerm ? (
              <div className="relative animate-in slide-in-from-right-5 fade-in duration-200">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  autoFocus={!searchTerm}
                  placeholder="Rechercher (Tiers, Réf)..."
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

            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="h-8 w-8 px-0 flex items-center justify-center border-border bg-background shadow-sm hover:bg-accent text-muted-foreground hover:text-foreground [&>svg:last-child]:hidden [&>span]:hidden rounded-lg transition-colors" title="Filtrer par statut">
                <Filter className="h-3.5 w-3.5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="lettre">Lettré</SelectItem>
                <SelectItem value="rapproche">Rapproché</SelectItem>
              </SelectContent>
            </Select>
            
            <NeonButton size="icon" onClick={() => setIsDialogOpen(true)} className="h-8 w-8 rounded-lg shadow-sm" title="Nouvelle opération">
              <Plus className="h-3.5 w-3.5" />
            </NeonButton>
          </div>
        </div>

        {/* Main Table */}
        <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-lg bg-[var(--bg-secondary)]/40 backdrop-blur-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-[var(--border-default)]/30">
                  <TableHead>Date</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tiers</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Chargement des transactions...
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Aucune transaction trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-[var(--bg-secondary)] transition-colors border-[var(--border-default)]/30">
                      <TableCell className="font-medium">{payment.date}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.reference}</TableCell>
                      <TableCell>
                        {payment.type === 'encaissement' ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <ArrowDownRight className="mr-1 h-3 w-3" /> Encaissement
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20">
                            <ArrowUpRight className="mr-1 h-3 w-3" /> Décaissement
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{payment.tiers_nom || payment.tiers}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-secondary/50 font-normal capitalize">
                          {payment.mode.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {parseFloat(payment.montant).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          payment.statut === 'lettre' ? 'default' :
                          payment.statut === 'rapproche' ? 'outline' : 'secondary'
                        } className={
                          payment.statut === 'lettre' ? 'bg-primary text-primary-foreground' : ''
                        }>
                          {payment.statut.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </GlassCard>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-[var(--border-default)]/50 bg-background/95 text-foreground backdrop-blur-xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="h-5 w-5 text-primary" />
              Saisir un Paiement / Encaissement
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <PaymentForm onSuccess={handleSuccess} onCancel={() => setIsDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
