import { useState, useEffect } from 'react';

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  tags: string[];
  strength: 'weak' | 'medium' | 'strong';
  storageType: 'local' | 'cloud';
  createdAt: Date;
  lastUsed?: Date;
  notes?: string;
  isFavorite: boolean;
}

const STORAGE_KEY = 'securevault_passwords';

export function usePasswords() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPasswords(parsed.map((p: PasswordEntry) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          lastUsed: p.lastUsed ? new Date(p.lastUsed) : undefined,
        })));
      } catch (e) {
        console.error('Failed to parse passwords:', e);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(passwords));
    }
  }, [passwords, isLoading]);

  const addPassword = (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'storageType'>) => {
    const newEntry: PasswordEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      storageType: 'local',
    };
    setPasswords(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const updatePassword = (id: string, updates: Partial<PasswordEntry>) => {
    setPasswords(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const deletePassword = (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
  };

  const markAsUsed = (id: string) => {
    updatePassword(id, { lastUsed: new Date() });
  };

  const toggleFavorite = (id: string) => {
    setPasswords(prev => prev.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  return {
    passwords,
    isLoading,
    addPassword,
    updatePassword,
    deletePassword,
    markAsUsed,
    toggleFavorite,
  };
}
