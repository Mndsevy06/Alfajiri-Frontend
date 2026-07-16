'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dossier } from './types'; // Assuming Dossier type is there, we'll use any for now or fetch it
import { fetchWithAuth } from './api';

type EntiteContextType = {
  activeEntite: any | null;
  setActiveEntite: (entite: any) => void;
  entites: any[];
  isLoading: boolean;
};

const EntiteContext = createContext<EntiteContextType>({
  activeEntite: null,
  setActiveEntite: () => {},
  entites: [],
  isLoading: true,
});

export const useEntite = () => useContext(EntiteContext);

export function EntiteProvider({ children }: { children: React.ReactNode }) {
  const [entites, setEntites] = useState<any[]>([]);
  const [activeEntite, setActiveEntiteState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We should fetch from the backend: /dossiers/
    const loadEntites = async () => {
      try {
        const data = await fetchWithAuth('/parametres/dossiers/');
        if (Array.isArray(data)) {
          setEntites(data);
          // Try to load active entity from localStorage
          const savedId = localStorage.getItem('activeEntiteId');
          if (savedId) {
            const savedEntite = data.find(e => e.id === savedId);
            if (savedEntite) {
              setActiveEntiteState(savedEntite);
              return;
            }
          }
          // Default to first entity
          if (data.length > 0) {
            setActiveEntiteState(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load entities', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEntites();
  }, []);

  const setActiveEntite = (entite: any) => {
    setActiveEntiteState(entite);
    if (entite && entite.id) {
      localStorage.setItem('activeEntiteId', entite.id);
    } else {
      localStorage.removeItem('activeEntiteId');
    }
  };

  return (
    <EntiteContext.Provider value={{ activeEntite, setActiveEntite, entites, isLoading }}>
      {children}
    </EntiteContext.Provider>
  );
}
