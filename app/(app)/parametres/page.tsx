'use client';

import { useState } from 'react';
import {
  Building2,
  Palette,
  Bell,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Sun,
  Moon,
  Globe,
  Mail,
  Check,
  Coins,
  Bot,
  ShieldCheck,
  Database,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { DOSSIERS } from '@/lib/mock-data';
import type { Dossier } from '@/lib/types';
import { cn } from '@/lib/utils';



export default function ParametresPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>(DOSSIERS);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);
  const [notifSettings, setNotifSettings] = useState({
    email: true,
    push: true,
    anomalies: true,
    cloture: false,
  });


  const saveDossier = (dossier: Dossier) => {
    setDossiers(dossiers.map((d) => (d.id === dossier.id ? dossier : d)));
    setEditingDossier(null);
    toast.success('Dossier mis a jour');
  };



  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground mt-1">
          Configuration des dossiers, habilitations et preferences systeme
        </p>
      </div>

      <Tabs defaultValue="dossiers">
        <TabsList className="flex flex-wrap items-center gap-1 p-1 rounded-md bg-muted/50 border border-border/50 h-auto">
          <TabsTrigger value="dossiers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all flex-1 sm:flex-none">
            <Building2 className="h-3.5 w-3.5" />
            Dossiers
          </TabsTrigger>

          <TabsTrigger value="apparence" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all flex-1 sm:flex-none">
            <Palette className="h-3.5 w-3.5" />
            Apparence
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all flex-1 sm:flex-none">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="taux-change" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all flex-1 sm:flex-none">
            <Coins className="h-3.5 w-3.5" />
            Taux de change
          </TabsTrigger>
          <TabsTrigger value="ia-gemini" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all flex-1 sm:flex-none">
            <Bot className="h-3.5 w-3.5" />
            IA Gemini
          </TabsTrigger>
          <TabsTrigger value="securite" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all flex-1 sm:flex-none">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dossiers" className="space-y-4">
          {dossiers.map((d) => (
            <Card key={d.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{d.raisonSociale}</p>
                        <p className="text-sm text-muted-foreground">{d.sigle} - Exercice {d.exerciceEnCours}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">RCCM</p>
                        <p className="font-mono font-medium">{d.rccm}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ID National</p>
                        <p className="font-mono font-medium">{d.idNat}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">N Impot</p>
                        <p className="font-mono font-medium">{d.nImpot}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Adresse</p>
                        <p className="font-medium">{d.adresse}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Devise</p>
                        <p className="font-medium">{d.devise}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Periode</p>
                        <p className="font-medium">{d.dateDebut} - {d.dateFin}</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditingDossier(d)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>



        <TabsContent value="apparence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Theme et apparence
              </CardTitle>
              <CardDescription>Personnalisez l'interface de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Mode clair / sombre</p>
                    <p className="text-sm text-muted-foreground">Basculer entre les themes</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Langue</p>
                    <p className="text-sm text-muted-foreground">Langue de l'interface</p>
                  </div>
                </div>
                <Select defaultValue="fr" onValueChange={() => toast.info('Langue modifiee')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Francais</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Bleu', color: 'hsl(221 83% 53%)', active: true },
                  { name: 'Vert', color: 'hsl(142 71% 45%)', active: false },
                  { name: 'Orange', color: 'hsl(38 92% 50%)', active: false },
                  { name: 'Rouge', color: 'hsl(0 84% 60%)', active: false },
                ].map((c) => (
                  <button
                    key={c.name}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      c.active ? 'border-primary' : 'border-border hover:border-muted-foreground/30'
                    )}
                    onClick={() => toast.info(`Theme ${c.name} selectionne`)}
                  >
                    <div className="h-10 w-10 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-sm font-medium">{c.name}</span>
                    {c.active && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Preferences de notifications
              </CardTitle>
              <CardDescription>Choisissez les alertes a recevoir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { key: 'email', label: 'Notifications par email', desc: 'Recevoir les alertes par email', icon: Mail },
                { key: 'push', label: 'Notifications push', desc: 'Alertes en temps reel sur le navigateur', icon: Bell },
                { key: 'anomalies', label: 'Detection d anomalies', desc: 'Anomalies comptables et logistiques', icon: Shield },
                { key: 'cloture', label: 'Rappels de cloture', desc: 'Notifications pour les periodes de cloture', icon: Check },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifSettings[item.key as keyof typeof notifSettings]}
                      onCheckedChange={(v) => {
                        setNotifSettings({ ...notifSettings, [item.key]: v });
                        toast.success(`${item.label} ${v ? 'activee' : 'desactivee'}`);
                      }}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="taux-change" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Gestion des taux de change (Devise de référence : USD)</p>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Taux
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { devise: 'CDF', nom: 'Franc Congolais', taux: '2850.50', date: '2025-07-08', source: 'BCC' },
                  { devise: 'EUR', nom: 'Euro', taux: '0.92', date: '2025-07-08', source: 'BCE' },
                  { devise: 'ZMW', nom: 'Kwacha Zambien', taux: '25.40', date: '2025-07-08', source: 'BOZ' }
                ].map((t) => (
                  <div key={t.devise} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {t.devise}
                      </div>
                      <div>
                        <p className="font-medium">{t.nom}</p>
                        <p className="text-sm text-muted-foreground">Source: {t.source} • Mis à jour le {t.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-mono font-medium">1 USD = {t.taux} {t.devise}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ia-gemini" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Configuration IA (Gemini OCR)
              </CardTitle>
              <CardDescription>Paramètres de l'intelligence artificielle pour l'extraction automatique des données de factures et de reçus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Extraction Automatique (OCR)</p>
                    <p className="text-sm text-muted-foreground">Pré-remplissage des champs comptables via Gemini Vision</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={(v) => toast.success(`OCR Gemini ${v ? 'activé' : 'désactivé'}`)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Détection d'Anomalies Avancée</p>
                    <p className="text-sm text-muted-foreground">Alerte IA sur des montants ou fréquences inhabituels</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={(v) => toast.success(`Détection IA ${v ? 'activée' : 'désactivée'}`)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Smart Matching Bancaire</p>
                    <p className="text-sm text-muted-foreground">Rapprochement automatique intelligent entre paiements et factures</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={(v) => toast.success(`Smart Matching ${v ? 'activé' : 'désactivé'}`)} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Niveau de confiance minimal requis pour la validation automatique</Label>
                  <div className="flex items-center gap-4">
                    <Input type="number" defaultValue={95} min={50} max={100} className="w-24" />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="securite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Sécurité & Sauvegardes
              </CardTitle>
              <CardDescription>Gérez la sécurité de votre base de données et les sauvegardes automatiques.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Authentification à double facteur (2FA)</p>
                      <p className="text-sm text-muted-foreground">Renforcer l'accès aux données sensibles (Obligatoire pour les administrateurs)</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Sauvegardes Automatiques</p>
                      <p className="text-sm text-muted-foreground">Fréquence de sauvegarde dans le Cloud</p>
                    </div>
                  </div>
                  <Select defaultValue="quotidien">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horaire">Chaque heure</SelectItem>
                      <SelectItem value="quotidien">Quotidienne</SelectItem>
                      <SelectItem value="hebdo">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dossier edit dialog */}
      <Dialog open={!!editingDossier} onOpenChange={(o) => !o && setEditingDossier(null)}>
        <DialogContent className="sm:max-w-lg">
          {editingDossier && (
            <>
              <DialogHeader>
                <DialogTitle>Modifier le dossier</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                <div className="space-y-2">
                  <Label>Raison sociale</Label>
                  <Input
                    value={editingDossier.raisonSociale}
                    onChange={(e) => setEditingDossier({ ...editingDossier, raisonSociale: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Sigle</Label>
                    <Input
                      value={editingDossier.sigle}
                      onChange={(e) => setEditingDossier({ ...editingDossier, sigle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select
                      value={editingDossier.devise}
                      onValueChange={(v) => setEditingDossier({ ...editingDossier, devise: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CDF">CDF</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input
                    value={editingDossier.adresse}
                    onChange={(e) => setEditingDossier({ ...editingDossier, adresse: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>RCCM</Label>
                    <Input
                      value={editingDossier.rccm}
                      onChange={(e) => setEditingDossier({ ...editingDossier, rccm: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID National</Label>
                    <Input
                      value={editingDossier.idNat}
                      onChange={(e) => setEditingDossier({ ...editingDossier, idNat: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={() => saveDossier(editingDossier)}>Enregistrer</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}
