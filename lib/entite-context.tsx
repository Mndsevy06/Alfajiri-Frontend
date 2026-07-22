'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dossier } from './types';
import { fetchWithAuth } from './api';

type EntiteContextType = {
  activeEntite: Dossier | null;
  setActiveEntite: (entite: Dossier) => void;
  entites: Dossier[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

const EntiteContext = createContext<EntiteContextType>({
  activeEntite: null,
  setActiveEntite: () => {},
  entites: [],
  isLoading: true,
  error: null,
  reload: () => {},
});

export const useEntite = () => useContext(EntiteContext);

export function EntiteProvider({ children }: { children: React.ReactNode }) {
  const [entites, setEntites] = useState<Dossier[]>([]);
  const [activeEntite, setActiveEntiteState] = useState<Dossier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth('/parametres/dossiers/');
      if (Array.isArray(data)) {
        setEntites(data);
        // Try to restore active entity from localStorage
        const savedId = localStorage.getItem('activeEntiteId');
        if (savedId) {
          // Compare as strings (UUIDs come back as strings from API)
          const savedEntite = data.find((e: Dossier) => String(e.id) === String(savedId));
          if (savedEntite) {
            setActiveEntiteState(savedEntite);
            setIsLoading(false);
            return;
          }
        }
        // Default to first entity
        if (data.length > 0) {
          setActiveEntiteState(data[0]);
          localStorage.setItem('activeEntiteId', String(data[0].id));
        }
      }
    } catch (err: any) {
      // Don't crash the app — store error for display
      if (err?.message !== 'Non autorisé') {
        setError(err?.message || 'Impossible de charger les entités');
        console.error('[EntiteProvider] Failed to load entities:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntites();
  }, []);

  const setActiveEntite = (entite: Dossier) => {
    if (activeEntite && activeEntite.id === entite.id) {
      return; // Do nothing if it's already the active entity
    }

    setActiveEntiteState(entite);
    if (entite && entite.id) {
      localStorage.setItem('activeEntiteId', String(entite.id));
    } else {
      localStorage.removeItem('activeEntiteId');
    }
  };

  return (
    <EntiteContext.Provider value={{ activeEntite, setActiveEntite, entites, isLoading, error, reload: loadEntites }}>
      {children}
    </EntiteContext.Provider>
  );
}
