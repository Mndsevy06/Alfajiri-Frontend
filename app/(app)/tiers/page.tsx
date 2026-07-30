'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Users, Building2, Briefcase, Filter, Edit, Trash2, Phone, Mail, Eye } from 'lucide-react';
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

  useEffect(() => {
    loadTiers();
  }, []);

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
    <div className="space-y-3 animate-fade-in">
      {/* Mini Stats */}
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

      <div className="space-y-3">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 py-1 border-b border-[var(--border-default)]/50 mb-1 relative">

          {/* Boutons icônes (droite) */}
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
                  <DropdownMenuRadioItem value="personnel">Personnel</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="etat">État & Organismes</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="associe">Associés</DropdownMenuRadioItem>
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

        <GlassCard glow={false} className="border-[var(--border-default)]/50 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="border-b border-[var(--border-default)]/50">
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Code</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Raison sociale / Nom</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Type</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Contact</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Compte rattaché</th>
                    <th className="text-right py-3.5 px-4 font-semibold text-muted-foreground">Solde</th>
                    <th className="text-right py-3.5 px-4 font-semibold text-muted-foreground w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTiers ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground"><Skeleton className="h-4 w-32 mx-auto" /></td></tr>
                  ) : filteredTiers.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Aucun tiers trouvé</td></tr>
                  ) : (
                    filteredTiers.map((t: any) => (
                      <tr key={t.code} className="border-b border-border/30 hover:bg-muted/40 transition-colors group">
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold">{t.code}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                              {t.nom ? t.nom.substring(0, 2).toUpperCase() : '??'}
                            </div>
                            <span className="font-medium">{t.nom}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 capitalize">
                          <Badge variant="outline" className="text-[11px] font-semibold bg-primary/5 text-primary border-primary/20">
                            {t.type}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            {t.telephone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {t.telephone}</span>}
                            {t.email && <span className="text-xs text-muted-foreground flex items-center gap-1" title={t.email}><Mail className="h-3 w-3 truncate max-w-[120px]" /> {t.email}</span>}
                            {!t.telephone && !t.email && <span className="text-xs text-muted-foreground opacity-50">-</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{t.compte || '-'}</td>
                        <td className="py-3.5 px-4 text-right">
                          {(() => {
                            const debit = parseFloat(t.soldeDebit || 0);
                            const credit = parseFloat(t.soldeCredit || 0);
                            const solde = debit - credit;
                            const isPositive = solde > 0;
                            const isNegative = solde < 0;
                            return (
                              <span className={cn(
                                "font-mono font-bold text-sm",
                                isPositive ? "text-chart-2" : isNegative ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(solde)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <NeonButton variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary bg-primary/5 hover:bg-primary/10" onClick={() => openDetailsModal(t)}>
                              <Eye className="h-3.5 w-3.5" />
                            </NeonButton>
                            <NeonButton variant="ghost" size="icon" className="h-7 w-7 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20" onClick={() => openEditModal(t)}>
                              <Edit className="h-3.5 w-3.5" />
                            </NeonButton>
                            <NeonButton variant="ghost" size="icon" className="h-7 w-7 text-destructive bg-destructive/10 hover:bg-destructive/20" onClick={() => handleDelete(t.code)}>
                              <Trash2 className="h-3.5 w-3.5" />
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
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        tiersData={viewingTiers}
      />
    </div>
  );
}
