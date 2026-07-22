'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  User, 
  CreditCard,
  CheckCircle2,
  Loader2,
  Users,
  ChevronsUpDown,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Button as NeonButton } from '@/components/ui/Layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api';

const COUNTRIES = [
  { code: '+243', countryId: 'cd', name: 'RDC' },
  { code: '+242', countryId: 'cg', name: 'Congo' },
  { code: '+250', countryId: 'rw', name: 'Rwanda' },
  { code: '+257', countryId: 'bi', name: 'Burundi' },
  { code: '+256', countryId: 'ug', name: 'Ouganda' },
  { code: '+33', countryId: 'fr', name: 'France' },
  { code: '+32', countryId: 'be', name: 'Belgique' },
];

interface TiersFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newTiers: any) => void;
  defaultType?: 'client' | 'fournisseur' | 'personnel' | 'etat' | 'associe';
  allowedTypes?: ('client' | 'fournisseur' | 'personnel' | 'etat' | 'associe')[];
  editData?: any;
}

export function TiersFormModal({ open, onOpenChange, onSuccess, defaultType, allowedTypes, editData }: TiersFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [comptes, setComptes] = useState<any[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('+243');
  
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type: defaultType || 'client',
    compte: '',
    telephone: '',
    email: '',
  });

  useEffect(() => {
    if (open) {
      if (editData) {
        setFormData({
          code: editData.code || '',
          nom: editData.nom || '',
          type: editData.type || 'client',
          compte: editData.compte || '',
          telephone: editData.telephone || '',
          email: editData.email || '',
        });
        const match = COUNTRIES.find(c => (editData.telephone || '').startsWith(c.code));
        setSelectedCountry(match ? match.code : '+243');
      } else {
        setFormData({
          code: '',
          nom: '',
          type: defaultType || 'client',
          compte: '',
          telephone: '',
          email: '',
        });
        setSelectedCountry('+243');
      }
      loadComptes();
    }
  }, [open, defaultType, editData]);

  const filteredComptes = useMemo(() => {
    const prefixes: Record<string, string> = {
      client: '411',
      fournisseur: '401',
      personnel: '422',
      etat: '44',
      associe: '46'
    };
    const prefix = prefixes[formData.type] || '4';
    return comptes.filter(c => c.numero.startsWith(prefix));
  }, [comptes, formData.type]);

  const loadComptes = async () => {
    try {
      const data = await fetchWithAuth('/plan_comptable/comptes/');
      // Filter for standard accounts that could be linked to tiers (usually 40, 41, 42, 43, 44, 46)
      const filtered = data.filter((c: any) => c.numero.startsWith('4'));
      setComptes(filtered);
    } catch (error) {
      console.error('Failed to load comptes', error);
    }
  };

  const generateCode = (type: string) => {
    const prefix = type.substring(0, 3).toUpperCase();
    return `${prefix}${Date.now().toString().slice(-4)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom) {
      toast.error('Le nom est requis');
      return;
    }

    const code = formData.code.trim() || generateCode(formData.type);

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('code', code);
      payload.append('nom', formData.nom);
      payload.append('type', formData.type);
      payload.append('telephone', formData.telephone || '');
      payload.append('email', formData.email || '');
      if (formData.compte && formData.compte !== 'none') {
        payload.append('compte', formData.compte);
      } else if (editData) {
        payload.append('compte', '');
      }

      const method = editData ? 'PATCH' : 'POST';
      const endpoint = editData ? `/plan_comptable/tiers/${editData.code}/` : '/plan_comptable/tiers/';

      const response = await fetchWithAuth(endpoint, {
        method: method,
        body: payload
      });

      toast.success(editData ? 'Tiers modifié avec succès !' : 'Tiers créé avec succès !');
      onOpenChange(false);
      if (onSuccess) onSuccess(response);
    } catch (error: any) {
      console.error('Failed to save tiers', error);
      toast.error('Erreur lors de l\'enregistrement du tiers', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-muted/50 shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary"></div>
        <DialogHeader className="pt-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {editData ? 'Modifier Tiers' : 'Nouveau Tiers'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type de tiers</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData({...formData, type: v as any})}
              >
                <SelectTrigger className="bg-muted/20">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {(!allowedTypes || allowedTypes.includes('client')) && <SelectItem value="client">Client</SelectItem>}
                  {(!allowedTypes || allowedTypes.includes('fournisseur')) && <SelectItem value="fournisseur">Fournisseur</SelectItem>}
                  {(!allowedTypes || allowedTypes.includes('personnel')) && <SelectItem value="personnel">Personnel</SelectItem>}
                  {(!allowedTypes || allowedTypes.includes('etat')) && <SelectItem value="etat">État & Organismes</SelectItem>}
                  {(!allowedTypes || allowedTypes.includes('associe')) && <SelectItem value="associe">Associé</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nom" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Raison sociale / Nom <span className="text-destructive">*</span></Label>
              <Input
                id="nom"
                placeholder="Ex: Entreprise XYZ / Jean Dupont"
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
                className="bg-muted/20"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="telephone" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Téléphone (Optionnel)</Label>
                <div className="flex rounded-md shadow-sm h-9">
                  <Select
                    value={selectedCountry}
                    onValueChange={(newCode) => {
                      setSelectedCountry(newCode);
                      const rawPhone = formData.telephone.startsWith(selectedCountry) ? formData.telephone.slice(selectedCountry.length).trim() : formData.telephone;
                      if (rawPhone) setFormData({...formData, telephone: `${newCode} ${rawPhone}`});
                    }}
                  >
                    <SelectTrigger className="w-[60px] h-full rounded-none rounded-l-md border-r-0 bg-muted/40 focus:ring-0 focus:ring-offset-0 px-2 flex justify-between items-center shadow-none border-input [&>span]:flex [&>span]:items-center">
                      <SelectValue>
                        {(() => {
                          const c = COUNTRIES.find(x => x.code === selectedCountry) || COUNTRIES[0];
                          return (
                            <img src={`https://flagcdn.com/w20/${c.countryId}.png`} alt={c.name} className="w-5 h-auto rounded-[2px]" />
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <div className="flex items-center gap-2">
                            <img src={`https://flagcdn.com/w20/${c.countryId}.png`} alt={c.name} className="w-4 h-auto rounded-[2px]" />
                            <span className="text-xs">{c.name} ({c.code})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="telephone"
                    placeholder="810 000 000"
                    value={formData.telephone.startsWith(selectedCountry) ? formData.telephone.slice(selectedCountry.length).trim() : formData.telephone}
                    onChange={(e) => {
                      const val = e.target.value.trimStart();
                      setFormData({...formData, telephone: val ? `${selectedCountry} ${val}` : ''});
                    }}
                    className="bg-muted/20 rounded-l-none border-l-0 focus-visible:ring-0 focus-visible:border-primary h-full"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email (Optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ex: contact@..."
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-muted/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Code (Optionnel)</Label>
                <Input
                  id="code"
                  placeholder="Auto généré"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="bg-muted/20 font-mono text-sm"
                  disabled={!!editData}
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="compte" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Compte rattaché</Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between bg-muted/20 font-normal hover:bg-muted/40 h-9 px-3 border-input overflow-hidden"
                    >
                      <span className="truncate flex-1 text-left mr-2">
                        {formData.compte && formData.compte !== 'none'
                          ? (() => {
                              const c = comptes.find((c) => c.numero === formData.compte);
                              return c ? `${c.numero} - ${c.libelle}` : formData.compte;
                            })()
                          : formData.compte === 'none' ? 'Aucun compte' : 'Sélectionner...'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start" side="bottom" sideOffset={4}>
                    <Command>
                      <CommandInput placeholder="Rechercher un compte..." />
                      <CommandList className="max-h-[200px] overflow-y-auto scrollbar-thin overscroll-contain pointer-events-auto">
                        <CommandEmpty>Aucun compte trouvé.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setFormData({ ...formData, compte: 'none' });
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.compte === 'none' ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Aucun compte
                          </CommandItem>
                          {filteredComptes.map((c) => (
                            <CommandItem
                              key={c.numero}
                              value={`${c.numero} ${c.libelle}`}
                              onSelect={() => {
                                setFormData({ ...formData, compte: c.numero });
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.compte === c.numero ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.numero} - {c.libelle}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 mt-4 border-t border-border/30 flex gap-2">
            <DialogClose asChild>
              <NeonButton type="button" variant="ghost" className="w-full sm:w-28">Annuler</NeonButton>
            </DialogClose>
            <NeonButton type="submit" disabled={loading || !formData.nom} className="w-full sm:w-32 shadow-md">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {editData ? 'Enregistrer' : 'Créer'}
            </NeonButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
