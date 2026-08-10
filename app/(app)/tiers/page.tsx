'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Users, Building2, Briefcase, Filter, Edit, Trash2, Phone, Mail, Eye, List, LayoutGrid, AlignJustify } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/api';
import { TiersFormModal } from '@/components/tiers-form-modal';
import { TiersDetailsModal } from '@/components/tiers-details-modal';
import { CardContent } from '@/components/ui/card';
import { GlassCard, Button as NeonButton } from '@/components/ui/Layout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function TiersPage() {
  const [tiersList, setTiersList] = useState<any[]>([]);
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingTiers, setEditingTiers] = useState<any>(null);
  const [viewingTiers, setViewingTiers] = useState<any>(null);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const loadTiers = async () => {
    try {
      setLoadingTiers(true);
      const data = await fetchWithAuth('/plan_comptable/tiers/');
      setTiersList(data);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des tiers');
    } finally {
      setLoadingTiers(false);
    }
  };

  const [viewMode, setViewMode] = useState<'list_modern' | 'list_excel' | 'list_compact'>('list_modern');

  useEffect(() => {
    const savedView = localStorage.getItem('tiersViewMode');
    if (savedView) setViewMode(savedView as any);
    loadTiers();
  }, []);

  const handleViewModeChange = (mode: 'list_modern' | 'list_excel' | 'list_compact') => {
    setViewMode(mode);
    localStorage.setItem('tiersViewMode', mode);
  };

  const openCreateModal = () => {
    setEditingTiers(null);
    setIsTiersModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingTiers(t);
    setIsTiersModalOpen(true);
  };

  const openDetailsModal = (t: any) => {
    setViewingTiers(t);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tiers ?')) return;
    try {
      await fetchWithAuth(`/plan_comptable/tiers/${code}/`, {
        method: 'DELETE',
      });
      toast.success('Tiers supprimé');
      setTiersList(tiersList.filter(t => t.code !== code));
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    }
  };

  const filteredTiers = useMemo(() => {
    return tiersList.filter(t => {
      const matchSearch = (t.nom?.toLowerCase() || '').includes(search.toLowerCase()) ||
                          (t.code?.toLowerCase() || '').includes(search.toLowerCase()) ||
                          (t.type?.toLowerCase() || '').includes(search.toLowerCase()) ||
                          (t.compte?.toLowerCase() || '').includes(search.toLowerCase());
      const matchType = filterType === 'all' || t.type === filterType;
      return matchSearch && matchType;
    });
  }, [tiersList, search, filterType]);

  const totalClients = tiersList.filter(t => t.type === 'client').length;
  const totalFournisseurs = tiersList.filter(t => t.type === 'fournisseur').length;
  const totalTiers = tiersList.length;

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-5.5rem)] animate-fade-in -mt-2 lg:-mt-4 pb-0">
      
      {/* HEADER STATIQUE (Stats + Boutons) */}
      <div className="flex flex-col gap-2 border-b border-[var(--border-default)]/50 pb-2 shrink-0">
        
        {/* Statistiques type Saisie Comptable */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Tiers</span>
                {loadingTiers ? <Skeleton className="h-4 w-12 sm:h-5 sm:w-16 mt-1" /> : <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-primary truncate">{totalTiers}</span>}
              </div>
              <div className="p-1 sm:p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </CardContent>
          </GlassCard>
          
          <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Clients</span>
                {loadingTiers ? <Skeleton className="h-4 w-12 sm:h-5 sm:w-16 mt-1" /> : <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-chart-2 truncate">{totalClients}</span>}
              </div>
              <div className="p-1 sm:p-1.5 rounded-md bg-chart-2/10 text-chart-2 shrink-0">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </CardContent>
          </GlassCard>

          <GlassCard glow={false} className="bg-[var(--bg-secondary)]/40 backdrop-blur-sm border-[var(--border-default)]/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-1.5 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Fournisseurs</span>
                {loadingTiers ? <Skeleton className="h-4 w-12 sm:h-5 sm:w-16 mt-1" /> : <span className="text-[10px] sm:text-base font-bold leading-none mt-0.5 sm:mt-1 text-amber-500 truncate">{totalFournisseurs}</span>}
              </div>
              <div className="p-1 sm:p-1.5 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </CardContent>
          </GlassCard>
        </div>

        {/* Action Bar (View buttons + Actions) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
          
          {/* VIEW BUTTONS + Titre (Gauche) */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center p-0.5 rounded-md bg-muted/50 border border-border/50">
            <NeonButton
              variant="ghost"
              size="sm"
              className={cn("h-7 w-8 px-0 flex items-center justify-center transition-colors", viewMode === 'list_modern' ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => handleViewModeChange('list_modern')}
              title="Vue Moderne"
            >
              <List className="h-4 w-4" />
            </NeonButton>
            <NeonButton
              variant="ghost"
              size="sm"
              className={cn("h-7 w-8 px-0 flex items-center justify-center transition-colors", viewMode === 'list_excel' ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => handleViewModeChange('list_excel')}
              title="Vue Tableur"
            >
              <LayoutGrid className="h-4 w-4" />
            </NeonButton>
            <NeonButton
              variant="ghost"
              size="sm"
              className={cn("h-7 w-8 px-0 flex items-center justify-center transition-colors", viewMode === 'list_compact' ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => handleViewModeChange('list_compact')}
              title="Vue Compacte"
            >
              <AlignJustify className="h-4 w-4" />
            </NeonButton>
          </div>
          <h2 className="text-sm font-bold text-foreground/80 flex items-center gap-2">Tiers</h2>
        </div>

        {/* Action Bar (Droite) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <NeonButton variant="ghost" size="icon" className={cn("h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors", filterType !== 'all' && "bg-primary/10 text-primary")}>
                <Filter className="h-3.5 w-3.5" />
              </NeonButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filterType} onValueChange={setFilterType}>
                <DropdownMenuRadioItem value="all">Tous les tiers</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="client">Clients</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fournisseur">Fournisseurs</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {showSearch || search ? (
            <div className="relative animate-in slide-in-from-right-5 fade-in duration-200">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus={!search}
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => { if (!search) setShowSearch(false); }}
                className="pl-8 h-8 w-[200px] sm:w-[250px] border-border bg-background text-xs shadow-none rounded-lg"
              />
            </div>
          ) : (
            <NeonButton variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setShowSearch(true)}>
              <Search className="h-3.5 w-3.5" />
            </NeonButton>
          )}

          <NeonButton size="icon" className="h-8 w-8 rounded-lg shadow-sm" onClick={openCreateModal}>
            <Plus className="h-3.5 w-3.5" />
          </NeonButton>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar mt-2">

        <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-sm h-full flex flex-col">
          <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar relative">
            <div className="w-full">
              <table className="w-full text-sm">
                <thead className={cn(
                  "sticky top-0 z-10",
                  viewMode === 'list_excel' ? 'bg-muted border-b-2 border-slate-300 dark:border-slate-600' : 'bg-muted/90 backdrop-blur-md border-b border-[var(--border-default)]/50'
                )}>
                  <tr className={cn(viewMode === 'list_compact' && "text-[11px]")}>
                    <th className={cn("text-left font-semibold text-foreground/90", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0.5" : "px-4 py-3.5"))}>Code</th>
                    <th className={cn("text-left font-semibold text-foreground/90", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0.5" : "px-4 py-3.5"))}>Raison sociale / Nom</th>
                    <th className={cn("text-left font-semibold text-foreground/90", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0.5" : "px-4 py-3.5"))}>Type</th>
                    <th className={cn("text-left font-semibold text-foreground/90", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0.5" : "px-4 py-3.5"))}>Contact</th>
                    <th className={cn("text-left font-semibold text-foreground/90", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0.5" : "px-4 py-3.5"))}>Compte rattaché</th>
                    <th className={cn("text-right font-semibold text-foreground/90", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0.5" : "px-4 py-3.5"))}>Solde</th>
                    <th className={cn("text-right font-semibold text-foreground/90 w-24", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0.5" : "px-4 py-3.5"))}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTiers ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground"><Skeleton className="h-4 w-32 mx-auto" /></td></tr>
                  ) : filteredTiers.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Aucun tiers trouvé</td></tr>
                  ) : (
                    filteredTiers.map((t: any) => (
                      <tr key={t.code} className={cn(
                        "group transition-colors",
                        viewMode === 'list_excel' ? "border-b border-slate-300 dark:border-slate-600 hover:bg-blue-50/80 dark:hover:bg-blue-900/30" : "border-b border-border/30 hover:bg-muted/80 dark:hover:bg-muted",
                        viewMode === 'list_compact' ? "text-[11px] leading-tight" : "text-sm"
                      )}>
                        <td className={cn("font-mono font-semibold", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-l border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0 h-8" : "px-4 py-3.5"))}>{t.code}</td>
                        <td className={cn(viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0 h-8" : "px-4 py-3.5"))}>
                          <div className={cn("flex items-center gap-2", viewMode !== 'list_compact' && "sm:gap-3")}>
                            <div className={cn("rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0", viewMode === 'list_compact' ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs")}>
                              {t.nom ? t.nom.substring(0, 2).toUpperCase() : '??'}
                            </div>
                            <span className={cn("font-medium", viewMode === 'list_compact' && "truncate max-w-[120px] sm:max-w-[200px]")}>{t.nom}</span>
                          </div>
                        </td>
                        <td className={cn("capitalize", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0 h-8" : "px-4 py-3.5"))}>
                          <Badge variant="outline" className={cn("font-semibold bg-primary/5 text-primary border-primary/20", viewMode === 'list_compact' ? "text-[9px] px-1 py-0 h-4 leading-none" : "text-[11px]")}>
                            {t.type}
                          </Badge>
                        </td>
                        <td className={cn(viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0 h-8" : "px-4 py-3.5"))}>
                          <div className="flex flex-col gap-0 justify-center h-full">
                            {t.telephone && <span className={cn("text-muted-foreground flex items-center gap-1", viewMode === 'list_compact' ? "text-[10px]" : "text-xs")}><Phone className={cn(viewMode === 'list_compact' ? "h-2.5 w-2.5" : "h-3 w-3")} /> {t.telephone}</span>}
                            {t.email && <span className={cn("text-muted-foreground flex items-center gap-1", viewMode === 'list_compact' ? "text-[10px]" : "text-xs")} title={t.email}><Mail className={cn("truncate max-w-[120px]", viewMode === 'list_compact' ? "h-2.5 w-2.5" : "h-3 w-3")} /> {t.email}</span>}
                            {!t.telephone && !t.email && <span className="text-xs text-muted-foreground opacity-50">-</span>}
                          </div>
                        </td>
                        <td className={cn("font-mono text-muted-foreground", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "text-[11px] px-2 py-0 h-8" : "text-xs px-4 py-3.5"))}>{t.compte || '-'}</td>
                        <td className={cn("text-right", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0 h-8" : "px-4 py-3.5"))}>
                          {(() => {
                            const debit = parseFloat(t.soldeDebit || 0);
                            const credit = parseFloat(t.soldeCredit || 0);
                            const solde = debit - credit;
                            const isPositive = solde > 0;
                            const isNegative = solde < 0;
                            return (
                              <span className={cn(
                                "font-mono font-bold",
                                viewMode === 'list_compact' ? "text-[11px]" : "text-sm",
                                isPositive ? "text-chart-2" : isNegative ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(solde)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className={cn("text-right", viewMode === 'list_excel' ? "px-2 py-1.5 border-r border-slate-300 dark:border-slate-600" : (viewMode === 'list_compact' ? "px-2 py-0 h-8" : "px-4 py-3.5"))}>
                          <div className="flex items-center justify-end gap-1">
                            <NeonButton variant="ghost" size="icon" className={cn("text-muted-foreground hover:text-primary bg-primary/5 hover:bg-primary/10", viewMode === 'list_compact' ? "h-6 w-6" : "h-7 w-7")} onClick={() => openDetailsModal(t)}>
                              <Eye className={cn(viewMode === 'list_compact' ? "h-3 w-3" : "h-3.5 w-3.5")} />
                            </NeonButton>
                            <NeonButton variant="ghost" size="icon" className={cn("text-blue-500 bg-blue-500/10 hover:bg-blue-500/20", viewMode === 'list_compact' ? "h-6 w-6" : "h-7 w-7")} onClick={() => openEditModal(t)}>
                              <Edit className={cn(viewMode === 'list_compact' ? "h-3 w-3" : "h-3.5 w-3.5")} />
                            </NeonButton>
                            <NeonButton variant="ghost" size="icon" className={cn("text-destructive bg-destructive/10 hover:bg-destructive/20", viewMode === 'list_compact' ? "h-6 w-6" : "h-7 w-7")} onClick={() => handleDelete(t.code)}>
                              <Trash2 className={cn(viewMode === 'list_compact' ? "h-3 w-3" : "h-3.5 w-3.5")} />
                            </NeonButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </GlassCard>
      </div>

      <TiersFormModal 
        open={isTiersModalOpen} 
        onOpenChange={setIsTiersModalOpen} 
        onSuccess={() => loadTiers()} 
        editData={editingTiers} 
      />
      <TiersDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        tiers={viewingTiers}
      />

    </div>
  );
}
