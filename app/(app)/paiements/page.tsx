'use client';

import { useState } from 'react';
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
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { PaymentForm } from '@/components/paiements/payment-form';

const KPIS = [
  {
    title: 'Total Encaissements (Mois)',
    value: '142,500.00 USD',
    change: '+12.5%',
    trend: 'up',
    icon: ArrowDownRight,
  },
  {
    title: 'Total Décaissements (Mois)',
    value: '84,320.00 USD',
    change: '-2.4%',
    trend: 'down',
    icon: ArrowUpRight,
  },
  {
    title: 'Solde Net Trésorerie',
    value: '358,180.00 USD',
    change: '+8.1%',
    trend: 'up',
    icon: Wallet,
  },
  {
    title: 'Factures en Retard',
    value: '12,450.00 USD',
    change: '3 Factures',
    trend: 'neutral',
    icon: DollarSign,
  },
];

const MOCK_PAYMENTS = [
  {
    id: 'TRX-001',
    date: '2025-07-09',
    type: 'encaissement',
    tiers: 'Société Minière KZI',
    reference: 'FAC-2025-0042',
    amount: 45000.00,
    method: 'Virement',
    status: 'Lettré',
  },
  {
    id: 'TRX-002',
    date: '2025-07-08',
    type: 'decaissement',
    tiers: 'Dangote Zambia',
    reference: 'ACH-2025-0015',
    amount: 12500.00,
    method: 'Virement',
    status: 'Rapproché',
  },
  {
    id: 'TRX-003',
    date: '2025-07-08',
    type: 'decaissement',
    tiers: 'Transports Mabuya',
    reference: 'TRP-2025-0089',
    amount: 3200.00,
    method: 'Mobile Money',
    status: 'En attente',
  },
  {
    id: 'TRX-004',
    date: '2025-07-07',
    type: 'encaissement',
    tiers: 'Construct RDC',
    reference: 'FAC-2025-0041',
    amount: 18500.00,
    method: 'Chèque',
    status: 'Lettré',
  },
];

export default function PaiementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredPayments = MOCK_PAYMENTS.filter(payment => 
    payment.tiers.toLowerCase().includes(searchTerm.toLowerCase()) || 
    payment.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Paiements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi centralisé des encaissements et décaissements de l'entreprise.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Nouvelle Opération
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-white/10 bg-background/95 backdrop-blur-xl p-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="h-5 w-5 text-primary" />
                Saisir un Paiement / Encaissement
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <PaymentForm onSuccess={() => setIsDialogOpen(false)} onCancel={() => setIsDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
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
                  {kpi.change} par rapport au mois précédent
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Table */}
      <Card className="border-white/10 shadow-lg bg-background/50 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
          <CardTitle className="text-lg font-semibold">Historique des Transactions</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher (Tiers, Réf)..."
                className="pl-9 h-9 bg-background/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
        </CardHeader>
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
              {filteredPayments.map((payment) => (
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
                  <TableCell className="font-medium">{payment.tiers}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-secondary/50 font-normal">
                      {payment.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {payment.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      payment.status === 'Lettré' ? 'default' :
                      payment.status === 'Rapproché' ? 'outline' : 'secondary'
                    } className={
                      payment.status === 'Lettré' ? 'bg-primary text-primary-foreground' : ''
                    }>
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Aucune transaction trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
