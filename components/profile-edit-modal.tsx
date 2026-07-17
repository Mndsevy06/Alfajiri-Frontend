'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, User, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onProfileUpdated: () => void;
}

export function ProfileEditModal({ isOpen, onClose, currentUser, onProfileUpdated }: ProfileEditModalProps) {
  const [nom, setNom] = useState('');
  const [site, setSite] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser && isOpen) {
      setNom(currentUser.nom || '');
      setSite(currentUser.site || '');
      
      let avatarUrl = null;
      if (currentUser.photo_profil) {
        avatarUrl = currentUser.photo_profil.startsWith('http') 
          ? currentUser.photo_profil 
          : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${currentUser.photo_profil.startsWith('/') ? '' : '/'}${currentUser.photo_profil}`;
      }
      
      setAvatarPreview(avatarUrl);
      setAvatarFile(null);
    }
  }, [currentUser, isOpen]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('nom', nom);
      formData.append('site', site);
      if (avatarFile) {
        formData.append('photo_profil', avatarFile);
      }

      await fetchWithAuth(`/users/${currentUser.id}/`, {
        method: 'PATCH',
        body: formData,
      });

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      });
      onProfileUpdated();
      onClose();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier mon profil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group cursor-pointer w-24 h-24">
              <div className="w-24 h-24 rounded-full bg-muted border-4 border-background shadow-sm overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input 
                type="file" 
                className="hidden" 
                id="avatar-upload"
                accept="image/*" 
                onChange={handleAvatarChange} 
              />
              <div 
                className="absolute inset-0 z-10 cursor-pointer" 
                onClick={() => document.getElementById('avatar-upload')?.click()} 
              />
            </div>
            <p className="text-xs text-muted-foreground">Cliquez pour changer la photo</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom">Nom complet</Label>
            <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="site">Site / Affectation</Label>
            <Input id="site" value={site} onChange={(e) => setSite(e.target.value)} placeholder="Votre site (ex: Lubumbashi)" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
