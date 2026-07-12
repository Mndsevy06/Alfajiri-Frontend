'use client';

import { useState, useRef } from 'react';
import {
  Smartphone,
  Camera,
  Save,
  DollarSign,
  Tag,
  FileText,
  X,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

const NATURES_DEPENSE = [
  { value: 'carburant', label: 'Carburant', compte: '611', auxiliaire: '' },
  { value: 'transports', label: 'Transport marchandises', compte: '612', auxiliaire: '' },
  { value: 'fournisseurs', label: 'Achat fournisseur', compte: '601', auxiliaire: '401-DANGOTE' },
  { value: 'frais', label: 'Frais de mission', compte: '65', auxiliaire: '' },
  { value: 'douane', label: 'Frais de douane', compte: '64', auxiliaire: '' },
  { value: 'salaires', label: 'Avance salaire', compte: '422', auxiliaire: '' },
  { value: 'entretien', label: 'Entretien materiel', compte: '62', auxiliaire: '' },
];

export default function TerrainPage() {
  const [typeOp, setTypeOp] = useState<'depense' | 'recette'>('depense');
  const [montant, setMontant] = useState('');
  const [nature, setNature] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [historiqueOpen, setHistoriqueOpen] = useState(false);
  const [historique, setHistorique] = useState<
    { id: string; typeOp: 'depense' | 'recette'; montant: number; nature: string; date: string; photo: boolean }[]
  >([
    { id: 't1', typeOp: 'depense', montant: 850, nature: 'Carburant camion', date: '2025-07-08T08:30', photo: true },
    { id: 't2', typeOp: 'depense', montant: 1200, nature: 'Frais de douane', date: '2025-07-08T07:15', photo: true },
    { id: 't3', typeOp: 'depense', montant: 45, nature: 'Frais de mission', date: '2025-07-07T18:00', photo: false },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(URL.createObjectURL(file));
      toast.success('Reçu attaché', { description: file.name });
    }
  };

  const handleSubmit = () => {
    const m = parseFloat(montant);
    if (!m || m <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }
    if (!nature) {
      toast.error(typeOp === 'depense' ? 'Veuillez sélectionner une nature' : 'Veuillez préciser la source');
      return;
    }
    const natureLabel = typeOp === 'depense' ? (NATURES_DEPENSE.find((n) => n.value === nature)?.label || nature) : nature;
    setHistorique([
      {
        id: `t${Date.now()}`,
        typeOp,
        montant: m,
        nature: natureLabel,
        date: new Date().toISOString(),
        photo: !!photo,
      },
      ...historique,
    ]);
    toast.success('Saisie enregistrée (brouillard)', {
      description: `${typeOp === 'recette' ? '+' : '-'}${formatCurrency(m)} - ${natureLabel}`,
    });
    setMontant('');
    setNature('');
    setPhoto(null);
    setNotes('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Saisie Terrain</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Opérateurs en déplacement
          </p>
        </div>
        
        <Dialog open={historiqueOpen} onOpenChange={setHistoriqueOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Historique</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Historique récent</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 overflow-y-auto pr-2 mt-4">
              {historique.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{h.nature}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold ${h.typeOp === 'recette' ? 'text-success' : 'text-foreground'}`}>
                      {h.typeOp === 'recette' ? '+' : '-'}{formatCurrency(h.montant)}
                    </p>
                    {h.photo && (
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        <Camera className="h-3 w-3 mr-1" />
                        Reçu
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {historique.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">Aucun historique.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" />
            Nouvelle opération
          </CardTitle>
          <CardDescription>Saisissez vos opérations directement depuis le terrain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Type d'opération</Label>
            <Select value={typeOp} onValueChange={(val: 'recette' | 'depense') => { setTypeOp(val); setNature(''); }}>
              <SelectTrigger className="h-14 text-base font-medium">
                <SelectValue placeholder="Type d'opération" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="depense">Dépense</SelectItem>
                <SelectItem value="recette">Recette</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {typeOp === 'depense' ? (
            <div className="space-y-2">
              <Label>Nature de l'opération</Label>
              <Select value={nature} onValueChange={setNature}>
                <SelectTrigger className="h-14 text-base">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Sélectionner une nature" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {NATURES_DEPENSE.map((n, i) => (
                    <SelectItem key={i} value={n.value}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Source de la recette</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Ex: Client XYZ, Caisse centrale..."
                  value={nature}
                  onChange={(e) => setNature(e.target.value)}
                  className="pl-10 h-14 text-base font-medium"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{typeOp === 'recette' ? 'Montant reçu (USD)' : 'Montant (USD)'}</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="pl-10 h-14 text-2xl font-bold"
              />
            </div>
          </div>

          {typeOp === 'depense' && (
            <div className="space-y-2">
              <Label>Photo du reçu</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
                className="hidden"
              />
              {photo ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={photo} alt="Reçu" className="w-full h-48 object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setPhoto(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/20"
                >
                  <Camera className="h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">Prendre une photo du reçu</span>
                  <span className="text-xs">L'IA Gemini pré-remplira les champs (V2)</span>
                </button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Input
              placeholder="Commentaire ou référence..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-12"
            />
          </div>

          <Button className="w-full h-14 text-lg font-bold shadow-md mt-2" onClick={handleSubmit}>
            <Save className="h-5 w-5 mr-2" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
