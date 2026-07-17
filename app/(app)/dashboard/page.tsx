'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, Users, Truck, ArrowUpRight, ArrowDownRight,
  Plus, FileBarChart, AlertTriangle, Info, CheckCircle2,
  PencilLine, Download, Activity, MapPin, Clock, Package,
  Star, RefreshCw, AlertCircle, CheckCircle, PieChart as PieChartIcon
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { GlassCard, Button as NeonButton } from '@/components/ui/Layout';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  KPIS_DASHBOARD, CHART_CASHFLOW, CHART_RENTABILITE,
  CHART_EXPLOSION_CHARGES, ACTIVITES_RECENTES, EXPEDITIONS,
  CHART_BALANCE_AGEE, CHART_PERFORMANCE_RADAR
} from '@/lib/mock-data';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { useEntite } from '@/lib/entite-context';

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

const tooltipStyle = {
  backgroundColor: 'rgba(10,10,20,0.9)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={tooltipStyle} className="p-3 shadow-2xl">
        <p className="font-semibold text-indigo-300 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill }} className="flex justify-between gap-4">
            <span>{p.name}:</span>
            <span className="font-bold">{typeof p.value === 'number' && p.value > 999 ? formatCurrency(p.value) : p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Radar to hide the default format
const RadarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={tooltipStyle} className="p-3 shadow-2xl flex flex-col gap-1">
        <p className="font-semibold text-indigo-300">{data.subject}</p>
        <p className="font-bold text-white flex items-center gap-2">
          Score: <span className="text-emerald-400 text-lg">{data.value}</span> / 100
        </p>
      </div>
    );
  }
  return null;
};

// Colors for BarChart
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#3b82f6', '#14b8a6'];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { activeEntite } = useEntite();
  
  // Real-time states
  const [kpis, setKpis] = useState([
    { label: 'Tresorerie globale', value: 0, evolution: 0, icon: 'wallet', color: 'hsl(142 71% 45%)' },
    { label: "Chiffre d'affaires (YTD)", value: 0, evolution: 0, icon: 'trending-up', color: 'hsl(221 83% 53%)' },
    { label: 'Creances clients', value: 0, evolution: 0, icon: 'users', color: 'hsl(38 92% 50%)' },
    { label: 'Dettes fournisseurs', value: 0, evolution: 0, icon: 'truck', color: 'hsl(280 65% 60%)' }
  ]);
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [chargesData, setChargesData] = useState<any[]>([]);
  const [rentabiliteData, setRentabiliteData] = useState<any[]>([]);
  const [balanceAgeeData, setBalanceAgeeData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [expeditionsList, setExpeditionsList] = useState<any[]>([]);
  const [activitesList, setActivitesList] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Connect to WebSocket for real-time updates
    const dossierId = activeEntite?.id || '';
    const wsUrl = `ws://localhost:8000/ws/dashboard/?dossier_id=${dossierId}`;
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'DASHBOARD_UPDATE' && message.data) {
            const d = message.data;
            if (d.kpis) setKpis(d.kpis);
            if (d.chart_cashflow) setCashflowData(d.chart_cashflow);
            if (d.chart_explosion_charges) setChargesData(d.chart_explosion_charges);
            if (d.chart_rentabilite) setRentabiliteData(d.chart_rentabilite);
            if (d.chart_balance_agee) setBalanceAgeeData(d.chart_balance_agee);
            if (d.chart_performance_radar) setPerformanceData(d.chart_performance_radar);
            if (d.expeditions) setExpeditionsList(d.expeditions);
            if (d.activites_recentes) setActivitesList(d.activites_recentes);
          }
        } catch (err) {
          console.error("Failed to parse websocket message", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, retrying in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [activeEntite?.id]);

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-24">
        <RefreshCw className="w-8 h-8 text-primary/50 animate-spin" />
      </div>
    );
  }

  const kpiGradients = [
    { gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500' },
    { gradient: 'from-indigo-500 to-purple-600', glow: 'shadow-indigo-500/30', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-500' },
    { gradient: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/30', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-500' },
    { gradient: 'from-rose-500 to-orange-600', glow: 'shadow-rose-500/30', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Section Removed */}

      {/* KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = iconMap[kpi.icon] || Info;
          const positive = kpi.evolution > 0;
          const style = kpiGradients[i % kpiGradients.length];

          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GlassCard className="p-5 overflow-hidden relative group border-t border-t-white/5" glow={false}>
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg ${style.glow}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md",
                    positive ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  )}>
                    {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(kpi.evolution)}%
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-black tracking-tighter text-foreground mt-1 drop-shadow-sm">{formatCurrency(kpi.value)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">vs mois précédent</p>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Row 2: Cashflow (Area) + Balance Agee (Stacked Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: AreaChart (Flux de tresorerie) */}
        <GlassCard className="p-0 overflow-hidden flex flex-col border-t border-t-white/5 shadow-2xl shadow-indigo-500/5 hover:shadow-indigo-500/10 transition-shadow duration-500" glow={false}>
          <div className="p-5 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-white/5 to-transparent">
            <div>
              <h2 className="font-bold text-foreground text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Flux de trésorerie
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Évolution YTD des mouvements</p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              Solde {cashflowData.length > 0 ? formatCurrency(cashflowData[cashflowData.length - 1].solde) : 0}
            </span>
          </div>
          <div className="p-5 sm:p-6 flex-1 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  {/* Subtle drop shadow for line */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#10b981" floodOpacity="0.3" />
                  </filter>
                  <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#f43f5e" floodOpacity="0.3" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                <XAxis dataKey="mois" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} fontWeight={600} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px', fontWeight: 600 }} />
                <Area type="monotone" dataKey="entrees" name="Entrées" stroke="#10b981" strokeWidth={4} fill="url(#colorEntrees)" filter="url(#glow)" activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981', className: 'drop-shadow-lg' }} />
                <Area type="monotone" dataKey="sorties" name="Sorties" stroke="#f43f5e" strokeWidth={4} fill="url(#colorSorties)" filter="url(#glowRed)" activeDot={{ r: 8, strokeWidth: 0, fill: '#f43f5e', className: 'drop-shadow-lg' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* CHART 2: Stacked BarChart (Balance Agee) */}
        <GlassCard className="p-0 overflow-hidden flex flex-col border-t border-t-white/5 shadow-2xl shadow-cyan-500/5 hover:shadow-cyan-500/10 transition-shadow duration-500" glow={false}>
          <div className="p-5 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-white/5 to-transparent">
            <div>
              <h2 className="font-bold text-foreground text-xl flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Balance Âgée
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Créances et dettes par tranche d'âge</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Clients</Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Frs</Badge>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex-1 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanceAgeeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <defs>
                  <linearGradient id="gradClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="gradFournisseurs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                <XAxis dataKey="tranche" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} fontWeight={600} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px', fontWeight: 600 }} />
                <Bar dataKey="clients" name="Créances Clients" stackId="a" fill="url(#gradClients)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="fournisseurs" name="Dettes Fournisseurs" stackId="a" fill="url(#gradFournisseurs)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Row 3: Rentabilite (Composed), Charges (Pie), Performance (Radar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART 3: Rentabilite (ComposedChart) */}
        <GlassCard className="p-0 overflow-hidden flex flex-col border-t border-t-white/5" glow={false}>
          <div className="p-5 sm:p-6 border-b border-border/50 bg-gradient-to-b from-white/5 to-transparent">
            <h2 className="font-bold text-foreground text-xl flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              Rentabilité Rotation
            </h2>
            <p className="text-sm text-muted-foreground mt-1">CA vs Coûts par expédition</p>
          </div>
          <div className="p-5 sm:p-6 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rentabiliteData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="gradCouts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.6} />
                  </linearGradient>
                  <filter id="glowMarge" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.5" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                <XAxis dataKey="voyage" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} fontWeight={600} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px', fontWeight: 600 }} />
                <Bar dataKey="ca" name="CA" fill="url(#gradCA)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="couts" name="Coûts" fill="url(#gradCouts)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Line type="monotone" dataKey="marge" name="Marge" stroke="#10b981" strokeWidth={3} filter="url(#glowMarge)" dot={{ r: 4, strokeWidth: 2, fill: '#0a0a14' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* CHART 4: Charges (PieChart - Donut) */}
        <GlassCard className="p-0 overflow-hidden flex flex-col border-t border-t-white/5" glow={false}>
          <div className="p-5 sm:p-6 border-b border-border/50 bg-gradient-to-b from-white/5 to-transparent">
            <h2 className="font-bold text-foreground text-xl flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-rose-400" />
              Répartition des charges
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Vue par poste de dépense</p>
          </div>
          <div className="p-5 sm:p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-full h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {chargesData.map((entry, index) => (
                      <linearGradient key={`gradPie-${index}`} id={`pieGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                    <filter id="shadowPie">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
                    </filter>
                  </defs>
                  <Pie 
                    data={chargesData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={65} 
                    outerRadius={95} 
                    paddingAngle={6} 
                    dataKey="value" 
                    stroke="none" 
                    cornerRadius={8}
                  >
                    {chargesData.map((entry, i) => (
                      <Cell key={i} fill={`url(#pieGrad-${i})`} filter="url(#shadowPie)" className="hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-3xl font-black text-foreground drop-shadow-md">
                  {(chargesData.reduce((acc, curr) => acc + curr.value, 0) / 1000).toFixed(0)}k
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Total</span>
              </div>
            </div>
            <div className="w-full mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
              {chargesData.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}80` }} />
                  <span className="text-muted-foreground font-medium truncate max-w-[80px]">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* CHART 5: Performance (RadarChart) */}
        <GlassCard className="p-0 overflow-hidden flex flex-col border-t border-t-white/5 relative" glow={false}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="p-5 sm:p-6 border-b border-border/50 bg-gradient-to-b from-white/5 to-transparent relative z-10">
            <h2 className="font-bold text-foreground text-xl flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Santé Financière
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Indice de performance globale</p>
          </div>
          <div className="p-5 sm:p-6 flex-1 min-h-[300px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={performanceData}>
                <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="#10b981"
                  fillOpacity={0.25}
                  className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                />
                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Row 4: Logistique + Marge Mensuelle (Bar) + Activites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART 6: Marge Mensuelle (BarChart) */}
        <GlassCard className="p-0 overflow-hidden flex flex-col border-t border-t-white/5 shadow-2xl shadow-fuchsia-500/5" glow={false}>
          <div className="p-5 sm:p-6 border-b border-border/50 bg-gradient-to-b from-white/5 to-transparent">
            <h2 className="font-bold text-foreground text-xl flex items-center gap-2">
              <Wallet className="w-5 h-5 text-fuchsia-400" />
              Marge par mois
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Évolution nette</p>
          </div>
          <div className="p-5 sm:p-6 flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  {cashflowData.map((_, index) => (
                    <linearGradient key={`barGrad-${index}`} id={`barGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.4} />
                    </linearGradient>
                  ))}
                  <filter id="shadowBar">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                <XAxis dataKey="mois" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} fontWeight={600} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }} />
                <Bar dataKey="solde" name="Marge Nette" radius={[6, 6, 0, 0]} maxBarSize={35}>
                  {cashflowData.map((_, i) => (
                    <Cell key={i} fill={`url(#barGrad-${i})`} filter="url(#shadowBar)" className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* LOGISTIQUE */}
        <GlassCard className="p-0 overflow-hidden relative flex flex-col" variant="blue" glow={false}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#007FFF]/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          <div className="p-5 sm:p-6 border-b border-[#007FFF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 bg-gradient-to-b from-white/5 to-transparent">
            <div>
              <h3 className="text-xl font-bold">Centre Logistique</h3>
              <p className="text-sm opacity-80 mt-1">Suivi GPS en temps réel</p>
            </div>
            <Link href="/logistique">
              <NeonButton variant="neon-yellow" className="h-9 px-4 text-xs font-semibold shadow-sm transition-colors flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                Carte
              </NeonButton>
            </Link>
          </div>
          <div className="p-5 sm:p-6 flex-1 space-y-4 relative z-10 max-h-[350px] overflow-y-auto scrollbar-thin">
            {expeditionsList.slice(0, 3).map((exp, i) => (
              <motion.div key={exp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border border-[var(--border-default)]/30 bg-background/50 p-4 hover:shadow-[0_0_20px_rgba(0,127,255,0.15)] hover:-translate-y-1 transition-all duration-300 backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#007FFF]" />
                <div className="flex items-center justify-between mb-4 pl-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007FFF]/10 text-[#007FFF] shadow-inner">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">{exp.identifiant}</p>
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Users className="h-3 w-3" /> {exp.responsable}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-semibold bg-[#007FFF]/10 text-[#007FFF] border-[#007FFF]/20 shadow-sm">
                    En cours
                  </Badge>
                </div>
                <div className="space-y-3 mt-4 pl-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" /> Progression
                    </span>
                    <span className="text-foreground font-bold">{exp.progression}%</span>
                  </div>
                  <Progress value={exp.progression} className="h-1.5 bg-secondary shadow-inner" />
                  <p className="text-xs font-medium text-foreground/80 flex items-center gap-1.5 pt-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{exp.position}</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* ACTIVITÉS */}
        <GlassCard className="p-0 overflow-hidden flex flex-col border-t border-t-white/5" glow={false}>
          <div className="p-5 sm:p-6 border-b border-border/50 bg-gradient-to-b from-white/5 to-transparent">
            <h3 className="text-xl font-bold text-foreground">Journal d'activités</h3>
            <p className="text-sm text-muted-foreground mt-1">Actions récentes sur la plateforme</p>
          </div>
          <div className="p-4 sm:p-5 flex-1">
            <div className="space-y-2 max-h-[310px] overflow-y-auto scrollbar-thin pr-2">
              {activitesList.map((act, i) => {
                const Icon = activiteIcon[act.type] || Info;
                return (
                  <motion.div key={act.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="group flex items-start gap-4 p-3 rounded-xl border border-transparent hover:border-border/50 hover:bg-white/5 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl shrink-0 shadow-inner transition-transform group-hover:scale-110 duration-300',
                      act.type === 'validation' && 'bg-emerald-500/15 text-emerald-500',
                      act.type === 'creation' && 'bg-indigo-500/15 text-indigo-500',
                      act.type === 'export' && 'bg-cyan-500/15 text-cyan-500',
                      act.type === 'alerte' && 'bg-amber-500/15 text-amber-500',
                      act.type === 'lecture' && 'bg-slate-500/15 text-slate-500'
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
          </div>
        </GlassCard>
      </div>

      {/* Row 5: Activity indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle, label: 'Factures Payées', value: activeEntite ? `68%` : '0%', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: Clock, label: 'Délai moyen', value: activeEntite ? `3.2 jours` : '0 jours', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { icon: AlertCircle, label: 'Alertes System', value: activeEntite ? `2` : '0', color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { icon: Star, label: 'Satisfaction', value: activeEntite ? `94%` : '0%', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
              <GlassCard className="p-4 flex items-center gap-4 border-t border-t-white/5 hover:-translate-y-1 transition-transform duration-300" glow={false}>
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold">{item.label}</p>
                  <p className={`text-lg sm:text-xl font-black ${item.color} mt-0.5 drop-shadow-sm`}>{item.value}</p>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
