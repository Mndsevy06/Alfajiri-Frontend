'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Wallet,
  TrendingUp,
  Users,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileBarChart,
  AlertTriangle,
  Info,
  CheckCircle2,
  PencilLine,
  Download,
  Activity,
  MapPin,
  Clock,
  Package
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  KPIS_DASHBOARD,
  CHART_CASHFLOW,
  CHART_RENTABILITE,
  CHART_EXPLOSION_CHARGES,
  ACTIVITES_RECENTES,
  CAMIONS,
} from '@/lib/mock-data';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const iconMap: Record<string, LucideIcon> = {
  wallet: Wallet,
  'trending-up': TrendingUp,
  users: Users,
  truck: Truck,
};

const activiteIcon: Record<string, LucideIcon> = {
  validation: CheckCircle2,
  creation: Plus,
  export: Download,
  alerte: AlertTriangle,
  lecture: Info,
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-md p-4 shadow-2xl ring-1 ring-black/5">
        <p className="mb-2 text-sm font-medium text-muted-foreground">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="h-2.5 w-2.5 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium">{entry.name}</span>
              </div>
              <span className="text-sm font-bold">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Vue consolidée — Exercice 2025 — TransAfrique Cement Trading SARL
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl shadow-sm border-primary/20 hover:bg-primary/5 transition-all" asChild>
            <Link href="/restitutions">
              <FileBarChart className="h-4 w-4 mr-2 text-primary" />
              Générer une balance
            </Link>
          </Button>
          <Button size="sm" className="h-10 px-4 rounded-xl shadow-md bg-gradient-to-r from-primary to-primary/80 hover:brightness-110 transition-all" asChild>
            <Link href="/saisie">
              <PencilLine className="h-4 w-4 mr-2" />
              Nouvelle saisie
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS_DASHBOARD.map((kpi, i) => {
          const Icon = iconMap[kpi.icon];
          const positive = kpi.evolution > 0;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            >
              <Card className="relative overflow-hidden group border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)] transition-all duration-300">
                <div
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                  style={{ backgroundColor: kpi.color }}
                />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-current transition-all duration-500 opacity-20" style={{ color: kpi.color }} />
                
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transform group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: `${kpi.color}15`, color: kpi.color, border: `1px solid ${kpi.color}30` }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 truncate">{kpi.label}</p>
                      <div className="text-xl font-black tracking-tighter truncate">
                        {formatCurrency(kpi.value)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="secondary" className={cn(
                        'flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md border-0',
                        positive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                      )}>
                      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(kpi.evolution)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold">Flux de trésorerie</CardTitle>
                <CardDescription className="text-sm mt-1">Évolution des entrées et sorties (YTD)</CardDescription>
              </div>
              <Badge variant="outline" className="bg-background/50 backdrop-blur">Exercice 2025</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_CASHFLOW} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="mois" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  fontWeight={500}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px', fontWeight: 500 }} />
                <Area 
                  type="monotone" 
                  dataKey="entrees" 
                  name="Entrées" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3} 
                  fill="url(#colorEntrees)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--chart-2))', className: 'drop-shadow-md' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sorties" 
                  name="Sorties" 
                  stroke="hsl(var(--chart-5))" 
                  strokeWidth={3} 
                  fill="url(#colorSorties)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--chart-5))', className: 'drop-shadow-md' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Répartition des charges</CardTitle>
            <CardDescription>Vue détaillée par poste de dépense</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[350px]">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {CHART_EXPLOSION_CHARGES.map((entry, index) => (
                      <linearGradient key={`grad-${index}`} id={`pieGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={CHART_EXPLOSION_CHARGES}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    stroke="none"
                    cornerRadius={6}
                  >
                    {CHART_EXPLOSION_CHARGES.map((entry, i) => (
                      <Cell key={i} fill={`url(#pieGrad-${i})`} className="drop-shadow-sm hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {CHART_EXPLOSION_CHARGES.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: entry.color }} />
                  <span className="truncate text-muted-foreground font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts & Activities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Rentabilité par rotation</CardTitle>
            <CardDescription>Analyse des marges par voyage de camion</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={CHART_RENTABILITE} margin={{ left: -10, right: 10, top: 20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                <XAxis dataKey="voyage" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} fontWeight={500} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px', fontWeight: 500 }} />
                <Bar dataKey="ca" name="Chiffre d'affaires" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="couts" name="Coûts" fill="hsl(var(--chart-5))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Line type="monotone" dataKey="marge" name="Marge nette" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--chart-2))' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Journal d'activités</CardTitle>
            <CardDescription>Actions récentes sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4 max-h-[320px] overflow-y-auto scrollbar-thin pr-2">
              {ACTIVITES_RECENTES.map((act, i) => {
                const Icon = activiteIcon[act.type] || Info;
                return (
                  <motion.div 
                    key={act.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="group flex items-start gap-4 p-3 rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all duration-300"
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300',
                      act.type === 'validation' && 'bg-success/15 text-success',
                      act.type === 'creation' && 'bg-primary/15 text-primary',
                      act.type === 'export' && 'bg-chart-4/15 text-chart-4',
                      act.type === 'alerte' && 'bg-warning/15 text-warning',
                      act.type === 'lecture' && 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm leading-tight">
                        <span className="font-semibold text-foreground">{act.user}</span>{' '}
                        <span className="text-muted-foreground">{act.action}</span>{' '}
                        <span className="font-medium text-foreground">{act.objet}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/70" />
                        <p className="text-xs text-muted-foreground font-medium">{act.time}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logistics Tracking Card */}
      <Card className="border-border/50 shadow-md bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
        <CardHeader className="relative z-10 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-2xl font-bold">Centre de Contrôle Logistique</CardTitle>
                <span className="relative flex h-3 w-3 ml-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
              </div>
              <CardDescription className="text-base">Suivi GPS en temps réel des rotations en cours</CardDescription>
            </div>
            <Button variant="secondary" className="gap-2 font-semibold shadow-sm hover:bg-secondary/80 transition-colors" asChild>
              <Link href="/logistique">
                <MapPin className="h-4 w-4 text-primary" />
                Ouvrir la carte
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {CAMIONS.slice(0, 6).map((cam, i) => {
              const statutLabel: Record<string, string> = {
                chargement: 'En chargement',
                transit_zambie: 'Transit Zambie',
                douane_zambie: 'Douane Zambie',
                douane_rdc: 'Douane RDC',
                transit_rdc: 'Transit RDC',
                arrive_sabri: 'Arrivé Sabri',
                decharge: 'Déchargé',
              };
              const statutColor: Record<string, string> = {
                chargement: 'bg-muted text-muted-foreground border-muted-foreground/20',
                transit_zambie: 'bg-primary/10 text-primary border-primary/20',
                douane_zambie: 'bg-warning/10 text-warning border-warning/20',
                douane_rdc: 'bg-warning/10 text-warning border-warning/20',
                transit_rdc: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
                arrive_sabri: 'bg-success/10 text-success border-success/20',
                decharge: 'bg-success/10 text-success border-success/20',
              };
              
              // Determine progress bar color based on status
              const progressColor = cam.statut.includes('douane') ? 'bg-warning' 
                                : cam.statut.includes('arrive') || cam.statut.includes('decharge') ? 'bg-success'
                                : 'bg-primary';

              return (
                <motion.div 
                  key={cam.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="group rounded-2xl border border-border/60 bg-background/80 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-md relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: cam.statut.includes('douane') ? 'hsl(var(--warning))' : cam.statut.includes('arrive') ? 'hsl(var(--success))' : 'hsl(var(--primary))', opacity: 0.5 }} />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <Truck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-lg font-bold tracking-tight">{cam.immat}</p>
                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cam.chauffeur}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('px-3 py-1 font-semibold', statutColor[cam.statut])}>
                      {statutLabel[cam.statut]}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 mt-5">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Package className="h-4 w-4" />
                        Progression
                      </span>
                      <span className="text-foreground font-bold">{cam.progression}%</span>
                    </div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cam.progression}%` }}
                        transition={{ duration: 1, delay: 0.2 + (i * 0.1), ease: "easeOut" }}
                        className={cn("h-full rounded-full transition-all duration-500", progressColor)}
                      />
                    </div>
                    <p className="text-sm font-medium text-foreground/80 flex items-center gap-2 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{cam.position}</span>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
