'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Circle,
  Lock,
  Scale,
  TrendingUp,
  PieChart,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

const CLOTURE_STEPS = [
  { id: 's1', label: 'Centralisation des journaux', done: true },
  { id: 's2', label: 'Rapprochement bancaire', done: true },
  { id: 's3', label: 'Inventaire des stocks', done: true },
  { id: 's4', label: 'Amortissements et provisions', done: true },
  { id: 's5', label: 'Régularisation des charges et produits', done: false },
  { id: 's6', label: 'Arrêté des comptes de tiers', done: false },
  { id: 's7', label: 'Validation par le commissaire aux comptes', done: false },
];

const BILAN_ACTIF = [
  { poste: '211', libelle: 'Immobilisations corporelles', brut: 320000, amort: 125000, net: 195000 },
  { poste: '210', libelle: 'Terrains', brut: 120000, amort: 0, net: 120000 },
  { poste: '31', libelle: 'Stocks de marchandises', brut: 180000, amort: 0, net: 180000 },
  { poste: '36', libelle: 'Stocks en transit', brut: 65000, amort: 0, net: 65000 },
  { poste: '411', libelle: 'Clients et comptes rattachés', brut: 320000, amort: 0, net: 320000 },
  { poste: '521', libelle: 'Banque Rawbank USD', brut: 285000, amort: 0, net: 285000 },
  { poste: '522', libelle: 'Banque Rawbank CDF', brut: 45000, amort: 0, net: 45000 },
  { poste: '53', libelle: 'Caisses', brut: 38500, amort: 0, net: 38500 },
];

const BILAN_PASSIF = [
  { poste: '101', libelle: 'Capital social', montant: 500000 },
  { poste: '12', libelle: 'Report à nouveau', montant: 45000 },
  { poste: '13', libelle: 'Résultats nets en instance', montant: 78000 },
  { poste: '16', libelle: 'Emprunts et dettes', montant: 120000 },
  { poste: '401', libelle: 'Fournisseurs et comptes rattachés', montant: 245000 },
  { poste: '422', libelle: 'Remunérations dues au personnel', montant: 38000 },
  { poste: '43', libelle: 'Organismes sociaux', montant: 12000 },
  { poste: '441', libelle: 'Impôts et taxes à payer', montant: 28000 },
  { poste: '442', libelle: 'TVA collectée', montant: 42000 },
];

const COMPTE_RESULTAT = [
  { type: 'produit', poste: '701', libelle: 'Ventes de ciment', montant: 780000 },
  { type: 'produit', poste: '75', libelle: 'Autres produits', montant: 12000 },
  { type: 'produit', poste: '76', libelle: 'Produits financiers', montant: 4500 },
  { type: 'produit', poste: '77', libelle: 'Gains de change', montant: 1800 },
  { type: 'charge', poste: '601', libelle: 'Achats de marchandises (Ciment)', montant: 520000 },
  { type: 'charge', poste: '61', libelle: 'Transports', montant: 145000 },
  { type: 'charge', poste: '62', libelle: 'Services extérieurs', montant: 38000 },
  { type: 'charge', poste: '63', libelle: 'Frais de personnel', montant: 62000 },
  { type: 'charge', poste: '64', libelle: 'Impôts et taxes', montant: 28000 },
  { type: 'charge', poste: '65', libelle: 'Autres charges', montant: 15000 },
  { type: 'charge', poste: '66', libelle: 'Charges financières', montant: 8500 },
  { type: 'charge', poste: '67', libelle: 'Pertes de change', montant: 3200 },
  { type: 'charge', poste: '68', libelle: 'Dotations aux amortissements', montant: 25000 },
];

const TAFIRE = [
  { rubrique: "Marge brute sur marchandises", calcul: "Ventes - Achats", montant: 260000 },
  { rubrique: "Consommations en provenance de tiers", calcul: "Transports + Services ext.", montant: 183000 },
  { rubrique: "Valeur ajoutée", calcul: "Marge brute - Consommations", montant: 77000 },
  { rubrique: "Impôts et taxes", calcul: "Classe 64", montant: 28000 },
  { rubrique: "Charges de personnel", calcul: "Classe 63", montant: 62000 },
  { rubrique: "Excédent brut d'exploitation (EBE)", calcul: "VA - Impôts - Personnel", montant: -13000 },
  { rubrique: "Reprises et transferts de charges", calcul: "—", montant: 0 },
  { rubrique: "Autres produits", calcul: "Classe 75", montant: 12000 },
  { rubrique: "Autres charges", calcul: "Classe 65", montant: 15000 },
  { rubrique: "Résultat d'exploitation", calcul: "EBE + Autres", montant: -16000 },
  { rubrique: "Produits financiers", calcul: "Classes 76 + 77", montant: 6300 },
  { rubrique: "Charges financières", calcul: "Classes 66 + 67", montant: 11700 },
  { rubrique: "Résultat financier", calcul: "Produits fin. - Charges fin.", montant: -5400 },
  { rubrique: "Résultat net de l'exercice", calcul: "Résultat exploitation + financier", montant: -21400 },
];

export default function EtatsFinanciersPage() {
  const [steps, setSteps] = useState(CLOTURE_STEPS);
  const [activeTab, setActiveTab] = useState('bilan');

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const progress = Math.round((doneCount / steps.length) * 100);

  const toggleStep = (id: string) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  };

  const totalActifNet = BILAN_ACTIF.reduce((s, r) => s + r.net, 0);
  const totalPassif = BILAN_PASSIF.reduce((s, r) => s + r.montant, 0);
  const totalProduits = COMPTE_RESULTAT.filter((r) => r.type === 'produit').reduce((s, r) => s + r.montant, 0);
  const totalCharges = COMPTE_RESULTAT.filter((r) => r.type === 'charge').reduce((s, r) => s + r.montant, 0);
  const resultatNet = totalProduits - totalCharges;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Etats Financiers OHADA</h1>
          <p className="text-muted-foreground mt-1">
            Bilan, Compte de resultat et TAFIRE - Exercice 2025
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info('Apercu avant impression...')}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button size="sm" onClick={() => toast.success('PDF genere', { description: 'Etats financiers 2025.pdf' })}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Checklist de cloture
              </CardTitle>
              <CardDescription>Etapes obligatoires avant generation des etats</CardDescription>
            </div>
            <Badge className={cn(allDone ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
              {doneCount}/{steps.length} completees
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {steps.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  s.done ? 'border-success/30 bg-success/5' : 'border-border hover:bg-muted/50'
                )}
                onClick={() => toggleStep(s.id)}
              >
                {s.done ? (
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className={cn('text-sm font-medium', !s.done && 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          {!allDone && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
              <Lock className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">
                Generation bloquee - Completez les etapes restantes pour generer les etats financiers
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">Total Actif Net</p>
            </div>
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalActifNet)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
                <PieChart className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">Total Passif</p>
            </div>
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalPassif)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', resultatNet >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">Resultat Net</p>
            </div>
            <p className={cn('text-2xl font-bold font-mono', resultatNet >= 0 ? 'text-success' : 'text-destructive')}>
              {formatCurrency(resultatNet)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="bilan" className="flex-1 sm:flex-none">
            <Scale className="h-4 w-4 mr-2" />
            Bilan
          </TabsTrigger>
          <TabsTrigger value="resultat" className="flex-1 sm:flex-none">
            <TrendingUp className="h-4 w-4 mr-2" />
            Compte de resultat
          </TabsTrigger>
          <TabsTrigger value="tafire" className="flex-1 sm:flex-none">
            <FileText className="h-4 w-4 mr-2" />
            TAFIRE
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bilan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actif</CardTitle>
                <CardDescription>Immobilisations, stocks, creances, tresorerie</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Compte</TableHead>
                      <TableHead>Libelle</TableHead>
                      <TableHead className="text-right">Brut</TableHead>
                      <TableHead className="text-right">Amort.</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {BILAN_ACTIF.map((r) => (
                      <TableRow key={r.poste}>
                        <TableCell className="font-mono text-xs">{r.poste}</TableCell>
                        <TableCell className="font-medium">{r.libelle}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(r.brut)}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {r.amort > 0 ? formatCurrency(r.amort) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(r.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-bold">Total Actif Net</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatCurrency(totalActifNet)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Passif</CardTitle>
                <CardDescription>Capitaux propres, dettes financieres, dettes d'exploitation</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Compte</TableHead>
                      <TableHead>Libelle</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {BILAN_PASSIF.map((r) => (
                      <TableRow key={r.poste}>
                        <TableCell className="font-mono text-xs">{r.poste}</TableCell>
                        <TableCell className="font-medium">{r.libelle}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(r.montant)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-bold">Total Passif</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatCurrency(totalPassif)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resultat">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compte de resultat SYSCOHADA</CardTitle>
              <CardDescription>Produits et charges de l'exercice 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">Produits</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Compte</TableHead>
                        <TableHead>Libelle</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {COMPTE_RESULTAT.filter((r) => r.type === 'produit').map((r) => (
                        <TableRow key={r.poste}>
                          <TableCell className="font-mono text-xs">{r.poste}</TableCell>
                          <TableCell className="font-medium">{r.libelle}</TableCell>
                          <TableCell className="text-right font-mono text-success">{formatCurrency(r.montant)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-bold">Total Produits</TableCell>
                        <TableCell className="text-right font-mono font-bold text-success">
                          {formatCurrency(totalProduits)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <ArrowRight className="h-4 w-4 rotate-180" />
                    </div>
                    <h3 className="font-semibold">Charges</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Compte</TableHead>
                        <TableHead>Libelle</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {COMPTE_RESULTAT.filter((r) => r.type === 'charge').map((r) => (
                        <TableRow key={r.poste}>
                          <TableCell className="font-mono text-xs">{r.poste}</TableCell>
                          <TableCell className="font-medium">{r.libelle}</TableCell>
                          <TableCell className="text-right font-mono text-destructive">{formatCurrency(r.montant)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-bold">Total Charges</TableCell>
                        <TableCell className="text-right font-mono font-bold text-destructive">
                          {formatCurrency(totalCharges)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              <div className={cn(
                'flex items-center justify-between p-4 rounded-lg mt-4',
                resultatNet >= 0 ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    resultatNet >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  )}>
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resultat net de l'exercice</p>
                    <p className="text-xs text-muted-foreground">Total produits - Total charges</p>
                  </div>
                </div>
                <p className={cn(
                  'text-2xl font-bold font-mono',
                  resultatNet >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {formatCurrency(resultatNet)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tafire">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tableau d'Analyse Financier des Ressources et Emplois (TAFIRE)</CardTitle>
              <CardDescription>Capacite de l'entreprise a generer des ressources internes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Rubrique</TableHead>
                    <TableHead>Calcul</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TAFIRE.map((r, i) => {
                    const isSubtotal = [
                      'Valeur ajoutée',
                      "Excédent brut d'exploitation (EBE)",
                      "Résultat d'exploitation",
                      'Résultat financier',
                      "Résultat net de l'exercice",
                    ].includes(r.rubrique);
                    return (
                      <TableRow key={i} className={cn(isSubtotal && 'bg-muted/50 font-semibold')}>
                        <TableCell className={cn(isSubtotal && 'font-bold')}>{r.rubrique}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.calcul}</TableCell>
                        <TableCell className={cn(
                          'text-right font-mono',
                          isSubtotal && 'font-bold',
                          r.montant < 0 ? 'text-destructive' : ''
                        )}>
                          {formatCurrency(r.montant)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
