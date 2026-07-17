'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Key,
  ShieldAlert,
  Trash2,
  Search,
  Lock,
  Users,
  ShieldCheck,
  BookOpen,
  FileSignature,
  Settings,
  Save,
  Briefcase,
  LayoutDashboard,
  FileText,
  ScrollText,
  Filter,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { AuditView } from './audit-view';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api';
import { cn } from '@/lib/utils';

type User = {
  id: string;
  nom: string;
  email: string;
  role: string;
  site: string;
  is_active: boolean;
  password?: string;
};

const ROLES = ['Agent', 'Comptable', 'Chef Comptable', 'Directeur', 'Auditeur', 'Super Admin'];

export default function UtilisateursPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'audit'>('users');

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex justify-end mb-2">
        <div className="flex items-center p-1 bg-muted/50 rounded-lg border border-border">
          <Button 
            variant={activeTab === 'users' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-md px-3 h-8 text-xs shadow-none"
            onClick={() => setActiveTab('users')}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Utilisateurs
          </Button>
          <Button 
            variant={activeTab === 'permissions' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-md px-3 h-8 text-xs shadow-none"
            onClick={() => setActiveTab('permissions')}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Matrice de Permissions
          </Button>
          <Button 
            variant={activeTab === 'audit' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-md px-3 h-8 text-xs shadow-none"
            onClick={() => setActiveTab('audit')}
          >
            <ScrollText className="w-3.5 h-3.5 mr-1.5" />
            Journal d'Audit
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'users' ? <UsersView /> : activeTab === 'permissions' ? <PermissionsMatrix /> : <AuditView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PERMISSIONS MATRIX COMPONENT (POWERFUL FRONTEND MOCK)
// ---------------------------------------------------------------------------
const CustomToggle = ({ checked, onChange, disabled }: { checked: boolean, onChange: (val: boolean) => void, disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${checked ? 'bg-primary' : 'bg-muted'}`}
  >
    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
  </button>
);

function PermissionsMatrix() {
  const [isSaving, setIsSaving] = useState(false);
  
  const PERMISSIONS_DATA = [
    {
      module: 'Pilotage',
      icon: LayoutDashboard,
      actions: [
        { id: 'dashboard_read', name: 'Consulter le Tableau de bord' },
      ]
    },
    {
      module: 'Comptabilité',
      icon: BookOpen,
      actions: [
        { id: 'compta_read', name: 'Consulter le Plan Comptable' },
        { id: 'compta_write', name: 'Modifier le Plan Comptable' },
        { id: 'saisie_create', name: 'Créer une Écriture' },
        { id: 'saisie_validate', name: 'Valider une Écriture (Brouillon -> Définitif)' },
        { id: 'restitutions_read', name: 'Consulter les Restitutions' },
        { id: 'rapprochement_read', name: 'Consulter le Rapprochement Bancaire' },
        { id: 'rapprochement_write', name: 'Effectuer un Rapprochement Bancaire' },
      ]
    },
    {
      module: 'Opérations',
      icon: Briefcase,
      actions: [
        { id: 'terrain_read', name: 'Consulter la Saisie Terrain' },
        { id: 'ventes_read', name: 'Consulter les Ventes & Facturation' },
        { id: 'logistique_read', name: 'Consulter le Suivi Logistique' },
        { id: 'paiements_read', name: 'Consulter la Gestion des Paiements' },
        { id: 'immo_read', name: 'Consulter les Immobilisations' },
      ]
    },
    {
      module: 'Ressources Humaines',
      icon: Users,
      actions: [
        { id: 'rh_read', name: 'Consulter la liste des Employés' },
        { id: 'rh_write', name: 'Créer/Modifier un Employé' },
        { id: 'paie_create', name: 'Générer un Bulletin de Paie' },
        { id: 'paie_validate', name: 'Valider la Paie' },
      ]
    },
    {
      module: 'Gestion Fiscale',
      icon: FileSignature,
      actions: [
        { id: 'fisc_read', name: 'Consulter les Déclarations' },
        { id: 'fisc_write', name: 'Générer une Déclaration' },
        { id: 'retenue_write', name: 'Saisir une Retenue à la Source' },
      ]
    },
    {
      module: 'Clôture',
      icon: FileText,
      actions: [
        { id: 'etats_financiers_read', name: 'Consulter les États Financiers OHADA' },
      ]
    },
    {
      module: 'Paramètres Système',
      icon: Settings,
      actions: [
        { id: 'users_read', name: 'Consulter les Utilisateurs' },
        { id: 'users_write', name: 'Gérer les Utilisateurs & Rôles' },
        { id: 'settings_write', name: 'Modifier les Paramètres Généraux' },
        { id: 'audit_read', name: "Consulter le Journal d'Audit" },
      ]
    }
  ];

  const defaultMatrix: Record<string, Record<string, boolean>> = {
    'Super Admin': { 'dashboard_read': true, 'compta_read': true, 'compta_write': true, 'saisie_create': true, 'saisie_validate': true, 'restitutions_read': true, 'rapprochement_read': true, 'rapprochement_write': true, 'rh_read': true, 'rh_write': true, 'paie_create': true, 'paie_validate': true, 'fisc_read': true, 'fisc_write': true, 'retenue_write': true, 'users_read': true, 'users_write': true, 'settings_write': true, 'terrain_read': true, 'ventes_read': true, 'logistique_read': true, 'paiements_read': true, 'immo_read': true, 'etats_financiers_read': true, 'audit_read': true },
    'Chef Comptable': { 'dashboard_read': true, 'compta_read': true, 'compta_write': true, 'saisie_create': true, 'saisie_validate': true, 'restitutions_read': true, 'rapprochement_read': true, 'rapprochement_write': true, 'rh_read': true, 'rh_write': false, 'paie_create': false, 'paie_validate': false, 'fisc_read': true, 'fisc_write': true, 'retenue_write': true, 'users_read': true, 'users_write': false, 'settings_write': false, 'terrain_read': true, 'ventes_read': true, 'logistique_read': true, 'paiements_read': true, 'immo_read': true, 'etats_financiers_read': true, 'audit_read': true },
    'Comptable': { 'dashboard_read': true, 'compta_read': true, 'compta_write': false, 'saisie_create': true, 'saisie_validate': false, 'restitutions_read': true, 'rapprochement_read': true, 'rapprochement_write': false, 'rh_read': true, 'rh_write': false, 'paie_create': false, 'paie_validate': false, 'fisc_read': true, 'fisc_write': false, 'retenue_write': false, 'users_read': false, 'users_write': false, 'settings_write': false, 'terrain_read': true, 'ventes_read': true, 'logistique_read': true, 'paiements_read': true, 'immo_read': true, 'etats_financiers_read': true, 'audit_read': false },
    'Auditeur': { 'dashboard_read': true, 'compta_read': true, 'compta_write': false, 'saisie_create': false, 'saisie_validate': false, 'restitutions_read': true, 'rapprochement_read': true, 'rapprochement_write': false, 'rh_read': true, 'rh_write': false, 'paie_create': false, 'paie_validate': false, 'fisc_read': true, 'fisc_write': false, 'retenue_write': false, 'users_read': true, 'users_write': false, 'settings_write': false, 'terrain_read': true, 'ventes_read': true, 'logistique_read': true, 'paiements_read': true, 'immo_read': true, 'etats_financiers_read': true, 'audit_read': true },
    'Agent': { 'dashboard_read': true, 'compta_read': false, 'compta_write': false, 'saisie_create': true, 'saisie_validate': false, 'restitutions_read': false, 'rapprochement_read': false, 'rapprochement_write': false, 'rh_read': false, 'rh_write': false, 'paie_create': false, 'paie_validate': false, 'fisc_read': false, 'fisc_write': false, 'retenue_write': false, 'users_read': false, 'users_write': false, 'settings_write': false, 'terrain_read': true, 'ventes_read': true, 'logistique_read': true, 'paiements_read': true, 'immo_read': false, 'etats_financiers_read': false, 'audit_read': false },
    'Directeur': { 'dashboard_read': true, 'compta_read': true, 'compta_write': false, 'saisie_create': false, 'saisie_validate': true, 'restitutions_read': true, 'rapprochement_read': true, 'rapprochement_write': false, 'rh_read': true, 'rh_write': false, 'paie_create': false, 'paie_validate': true, 'fisc_read': true, 'fisc_write': false, 'retenue_write': false, 'users_read': true, 'users_write': false, 'settings_write': false, 'terrain_read': true, 'ventes_read': true, 'logistique_read': true, 'paiements_read': true, 'immo_read': true, 'etats_financiers_read': true, 'audit_read': true },
  };

  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(defaultMatrix);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const data = await fetchWithAuth('/users/permissions/');
      if (data && data.length > 0) {
        const fetchedMatrix: Record<string, Record<string, boolean>> = {};
        data.forEach((item: any) => {
          fetchedMatrix[item.role] = item.permissions;
        });
        // Fusionner avec le défaut pour les rôles qui n'ont pas encore été configurés
        setMatrix({ ...defaultMatrix, ...fetchedMatrix });
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (role: string, actionId: string, checked: boolean) => {
    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [actionId]: checked
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetchWithAuth('/users/permissions/bulk_update/', {
        method: 'POST',
        body: JSON.stringify(matrix)
      });
      toast.success('Matrice des permissions mise à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-white/10 shadow-lg bg-background/50 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Configuration des Rôles</CardTitle>
          <CardDescription>
            Définissez précisément quelles actions sont autorisées pour chaque rôle. 
            Les modifications prendront effet lors de la prochaine connexion de l'utilisateur.
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="shadow-lg hover:shadow-primary/20 transition-all">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto scrollbar-thin">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-muted/50 border-white/5">
              <TableHead className="w-[300px] font-bold text-foreground">Ressource / Action</TableHead>
              {ROLES.map(role => (
                <TableHead key={role} className="text-center font-bold">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Badge variant={role === 'Super Admin' ? 'default' : 'outline'} className={role === 'Super Admin' ? 'bg-primary/20 text-primary border-none' : 'border-white/10'}>
                      {role}
                    </Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS_DATA.map((module, mIdx) => (
              <React.Fragment key={module.module}>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-t-2 border-border">
                  <TableCell colSpan={ROLES.length + 1} className="py-2">
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <module.icon className="w-4 h-4" />
                      {module.module}
                    </div>
                  </TableCell>
                </TableRow>
                {module.actions.map((action) => (
                  <TableRow key={action.id} className="hover:bg-white/5 transition-colors border-white/5">
                    <TableCell className="pl-8 text-sm font-medium text-muted-foreground">
                      {action.name}
                    </TableCell>
                    {ROLES.map(role => (
                      <TableCell key={`${role}-${action.id}`} className="text-center">
                        <CustomToggle 
                          checked={matrix[role]?.[action.id] || false}
                          onChange={(val) => handleToggle(role, action.id, val)}
                          disabled={role === 'Super Admin'} // Super Admin always has all permissions
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// USERS VIEW COMPONENT (ORIGINAL)
// ---------------------------------------------------------------------------
function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'role' | 'password'>('edit');
  
  // Form state
  const [form, setForm] = useState<Partial<User>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithAuth('/users/');
      setUsers(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const nom = u.nom || '';
    const email = u.email || '';
    const role = u.role || '';
    
    const matchesSearch = nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
           email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           role.toLowerCase().includes(searchQuery.toLowerCase());
           
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && u.is_active) || 
                          (statusFilter === 'inactive' && !u.is_active);
                          
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = users.filter(u => !u.is_active).length;

  const openEditDialog = (user: User) => {
    setForm(user);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const openRoleDialog = (user: User) => {
    setForm(user);
    setDialogMode('role');
    setIsDialogOpen(true);
  };

  const openPasswordDialog = (user: User) => {
    setForm({ id: user.id });
    setDialogMode('password');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await fetchWithAuth(`/users/${id}/`, { method: 'DELETE' });
        setUsers(users.filter(u => u.id !== id));
        toast.success('Utilisateur supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (dialogMode === 'edit') {
        if (form.id) {
          // Update
          const data = await fetchWithAuth(`/users/${form.id}/`, {
            method: 'PATCH',
            body: JSON.stringify(form)
          });
          setUsers(users.map(u => u.id === form.id ? data : u));
          toast.success('Informations mises à jour');
        } else {
          if (!form.email) {
            toast.error("L'adresse e-mail est obligatoire");
            setIsSaving(false);
            return;
          }
          if (!form.password) {
            toast.error('Le mot de passe est obligatoire pour un nouvel utilisateur');
            setIsSaving(false);
            return;
          }
          const payload = {
            ...form,
            is_active: true,
          };
          const data = await fetchWithAuth('/users/', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          setUsers([...users, data]);
          toast.success('Utilisateur ajouté avec succès');
        }
      } else if (dialogMode === 'role') {
        // Change role
        const data = await fetchWithAuth(`/users/${form.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ role: form.role })
        });
        setUsers(users.map(u => u.id === form.id ? data : u));
        toast.success('Rôle mis à jour avec succès');
      } else if (dialogMode === 'password') {
        // Change password
        if (!form.password) {
          toast.error('Le mot de passe ne peut pas être vide');
          setIsSaving(false);
          return;
        }
        await fetchWithAuth(`/users/${form.id}/reset_password/`, {
          method: 'POST',
          body: JSON.stringify({ password: form.password })
        });
        toast.success('Mot de passe mis à jour avec succès');
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = () => {
    setForm({ role: 'Agent', site: 'Lubumbashi', is_active: true, password: '' });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const toggleActive = async (user: User) => {
    try {
      const data = await fetchWithAuth(`/users/${user.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !user.is_active })
      });
      setUsers(users.map(u => u.id === user.id ? data : u));
      toast.success(`Utilisateur ${data.is_active ? 'activé' : 'désactivé'}`);
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  return (
    <div className="space-y-3">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-2.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Utilisateurs</span>
              <span className="text-base font-bold leading-none mt-1">{totalUsers}</span>
            </div>
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Users className="h-3.5 w-3.5" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-2.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Actifs</span>
              <span className="text-base font-bold leading-none mt-1">{activeUsers}</span>
            </div>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-white/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-2.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Inactifs</span>
              <span className="text-base font-bold leading-none mt-1">{inactiveUsers}</span>
            </div>
            <div className="p-1.5 rounded-md bg-destructive/10 text-destructive">
              <XCircle className="h-3.5 w-3.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-border/50 mb-1">
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <span>Gestion des accès et permissions</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg shadow-sm hover:bg-accent group", searchQuery && "bg-accent")} title="Rechercher">
                <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher un utilisateur..." 
                  className="pl-8 h-9 text-xs" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg shadow-sm hover:bg-accent group", (roleFilter !== 'all' || statusFilter !== 'all') && "bg-accent")} title="Filtrer">
                <Filter className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {(roleFilter !== 'all' || statusFilter !== 'all') && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                    {(roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm leading-none">Filtrer les utilisateurs</h4>
                
                <div className="space-y-1.5">
                  <Label className="text-xs">Rôle</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-8 text-xs border-white/10 bg-white/5">
                      <SelectValue placeholder="Tous les rôles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      {ROLES.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs border-white/10 bg-white/5">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(roleFilter !== 'all' || statusFilter !== 'all') && (
                  <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={handleCreate} className="h-8 rounded-lg px-3 text-xs font-semibold shadow-sm hover:shadow-primary/20 transition-all">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>

      <Card className="border-white/10 shadow-lg bg-background/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Chargement des données...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-white/5 border-white/5 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shrink-0 ${user.is_active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {(user.nom || user.email).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold">{user.nom || 'Sans nom'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium border-white/10 bg-white/5">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.site || '-'}</TableCell>
                      <TableCell>
                        <button 
                          onClick={() => user.email !== 'a@gmail.com' && toggleActive(user)} 
                          className={`focus:outline-none ${user.email === 'a@gmail.com' ? 'cursor-not-allowed opacity-80' : ''}`}
                          disabled={user.email === 'a@gmail.com'}
                        >
                          {user.is_active ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Actif</Badge>
                          ) : (
                            <Badge variant="secondary" className="hover:bg-muted">Inactif</Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.email === 'a@gmail.com' ? (
                          <Button variant="ghost" className="h-8 w-8 p-0 cursor-not-allowed" disabled>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground">
                                <span className="sr-only">Ouvrir le menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] bg-background/95 backdrop-blur-xl border-white/10">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(user)} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier informations
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRoleDialog(user)} className="cursor-pointer">
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Changer le rôle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPasswordDialog(user)} className="cursor-pointer">
                                <Key className="mr-2 h-4 w-4" />
                                Réinitialiser mot de passe
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-destructive focus:text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer l'accès
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'edit' && (form.id ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur')}
              {dialogMode === 'role' && 'Changer le rôle'}
              {dialogMode === 'password' && 'Réinitialiser le mot de passe'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {dialogMode === 'edit' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="nom">Nom complet</Label>
                  <Input 
                    id="nom" 
                    value={form.nom || ''} 
                    onChange={(e) => setForm({...form, nom: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email de connexion</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={form.email || ''} 
                    onChange={(e) => setForm({...form, email: e.target.value})} 
                  />
                </div>
                {!form.id && (
                  <div className="grid gap-2">
                    <Label htmlFor="password">Mot de passe initial</Label>
                    <Input 
                      id="password" 
                      type="password"
                      value={form.password || ''} 
                      onChange={(e) => setForm({...form, password: e.target.value})} 
                      placeholder="Saisissez un mot de passe"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="site">Site d'affectation</Label>
                  <Select value={form.site || ''} onValueChange={(v) => setForm({...form, site: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
                      <SelectItem value="Zambie">Zambie</SelectItem>
                      <SelectItem value="Sabri">Sabri</SelectItem>
                      <SelectItem value="Frontiere">Frontiere</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {dialogMode === 'role' && (
              <div className="grid gap-2">
                <Label htmlFor="role">Nouveau rôle</Label>
                <Select value={form.role || ''} onValueChange={(v) => setForm({...form, role: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  La modification du rôle prendra effet immédiatement et affectera les permissions de l'utilisateur.
                </p>
              </div>
            )}

            {dialogMode === 'password' && (
              <div className="grid gap-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={form.password || ''} 
                  onChange={(e) => setForm({...form, password: e.target.value})} 
                  placeholder="Saisissez le nouveau mot de passe"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Ce mot de passe remplacera l'ancien pour cet utilisateur.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={isSaving}>Annuler</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
