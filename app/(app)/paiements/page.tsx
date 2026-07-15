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
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Paiements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi centralisé des encaissements et décaissements de l'entreprise.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${
                  kpi.trend === 'up' && kpi.icon !== ArrowUpRight ? 'bg-emerald-500/10 text-emerald-500' :
                  kpi.trend === 'down' || kpi.icon === ArrowUpRight ? 'bg-rose-500/10 text-rose-500' :
                  'bg-amber-500/10 text-amber-500'
                }`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className={`text-xs mt-1 font-medium ${
                  kpi.trend === 'up' && kpi.icon !== ArrowUpRight ? 'text-emerald-500' :
                  kpi.trend === 'down' || kpi.icon === ArrowUpRight ? 'text-rose-500' :
                  'text-amber-500'
                }`}>
                  {kpi.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
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
            <Button variant="outline" size="icon" onClick={() => setShowSearch(true)} className="h-8 w-8 rounded-lg shadow-sm group" title="Rechercher">
              <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Button>
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
          
          <Button variant="default" size="sm" onClick={() => setIsDialogOpen(true)} className="h-8 rounded-lg px-3 text-xs font-semibold shadow-sm ml-1" title="Nouvelle opération">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Nouvelle opération</span>
          </Button>
        </div>

        {/* Main Table */}
        <Card className="border-white/10 shadow-lg bg-background/50 backdrop-blur-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
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
                    <TableRow key={payment.id} className="hover:bg-white/5 transition-colors border-white/5">
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
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] border-white/10 bg-background/95 backdrop-blur-xl p-5">
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
