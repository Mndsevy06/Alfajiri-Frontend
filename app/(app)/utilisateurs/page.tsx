'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Key,
  ShieldAlert,
  Trash2,
  Search,
  Lock,
} from 'lucide-react';
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

type User = {
  id: string;
  nom: string;
  email: string;
  role: string;
  site: string;
  is_active: boolean;
  password?: string; // Utilisé pour le formulaire uniquement
};

const ROLES = ['Agent', 'Comptable', 'Chef Comptable', 'Directeur', 'Auditeur', 'Super Admin'];

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
    return nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
           email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           role.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les accès, les rôles et les informations des utilisateurs en base de données.
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>Tous les collaborateurs ayant accès au système.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={5} className="h-24 text-center">
                      Chargement des données...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0 ${user.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {(user.nom || user.email).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.nom || 'Sans nom'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.site || '-'}</TableCell>
                      <TableCell>
                        <button 
                          onClick={() => user.email !== 'a@gmail.com' && toggleActive(user)} 
                          className={`focus:outline-none ${user.email === 'a@gmail.com' ? 'cursor-not-allowed opacity-80' : ''}`}
                          disabled={user.email === 'a@gmail.com'}
                        >
                          {user.is_active ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0">Actif</Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
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
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Ouvrir le menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                Réinitialiser mot de passe
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Changer rôles
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
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

      {/* Shared Dialog for Edit / Change Role / Password */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="site">Site</Label>
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
              <Button variant="outline" disabled={isSaving}>Annuler</Button>
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
