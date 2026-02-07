import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useAuth();
  const [localPasswords, setLocalPasswords] = useState<PasswordEntry[]>([]);
  const [cloudPasswords, setCloudPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load local passwords
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalPasswords(parsed.map((p: PasswordEntry) => ({
          ...p,
          storageType: 'local' as const,
          createdAt: new Date(p.createdAt),
          lastUsed: p.lastUsed ? new Date(p.lastUsed) : undefined,
        })));
      } catch (e) {
        console.error('Failed to parse passwords:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Load cloud passwords
  useEffect(() => {
    if (user) {
      loadCloudPasswords();
    } else {
      setCloudPasswords([]);
    }
  }, [user]);

  const loadCloudPasswords = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCloudPasswords(data.map(p => ({
        id: p.id,
        title: p.title,
        username: p.username,
        password: p.password,
        url: p.url || undefined,
        category: p.category,
        tags: p.tags || [],
        strength: p.strength as 'weak' | 'medium' | 'strong',
        storageType: 'cloud' as const,
        createdAt: new Date(p.created_at),
        lastUsed: p.last_used ? new Date(p.last_used) : undefined,
        notes: p.notes || undefined,
        isFavorite: p.is_favorite,
      })));
    }
  };

  // Save local passwords
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localPasswords));
    }
  }, [localPasswords, isLoading]);

  const passwords = [...cloudPasswords, ...localPasswords];

  const addPassword = useCallback(async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'storageType'> & { storageType?: 'local' | 'cloud' }) => {
    const storage = entry.storageType || 'local';

    if (storage === 'cloud' && user) {
      const { data, error } = await supabase.from('passwords').insert({
        user_id: user.id,
        title: entry.title,
        username: entry.username,
        password: entry.password,
        url: entry.url,
        category: entry.category,
        tags: entry.tags,
        strength: entry.strength,
        notes: entry.notes,
        is_favorite: entry.isFavorite,
      }).select().single();

      if (!error && data) {
        await loadCloudPasswords();
        return { ...entry, id: data.id, createdAt: new Date(data.created_at), storageType: 'cloud' as const };
      }
    }

    // Local storage
    const newEntry: PasswordEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      storageType: 'local',
    };
    setLocalPasswords(prev => [newEntry, ...prev]);
    return newEntry;
  }, [user]);

  const updatePassword = useCallback(async (id: string, updates: Partial<PasswordEntry>) => {
    // Check if cloud
    const cloudMatch = cloudPasswords.find(p => p.id === id);
    if (cloudMatch && user) {
      await supabase.from('passwords').update({
        title: updates.title,
        username: updates.username,
        password: updates.password,
        url: updates.url,
        category: updates.category,
        tags: updates.tags,
        strength: updates.strength,
        notes: updates.notes,
        is_favorite: updates.isFavorite,
        last_used: updates.lastUsed?.toISOString(),
      }).eq('id', id);
      await loadCloudPasswords();
    } else {
      setLocalPasswords(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  }, [cloudPasswords, user]);

  const deletePassword = useCallback(async (id: string) => {
    const cloudMatch = cloudPasswords.find(p => p.id === id);
    if (cloudMatch && user) {
      await supabase.from('passwords').delete().eq('id', id);
      await loadCloudPasswords();
    } else {
      setLocalPasswords(prev => prev.filter(p => p.id !== id));
    }
  }, [cloudPasswords, user]);

  const markAsUsed = useCallback((id: string) => {
    updatePassword(id, { lastUsed: new Date() });
  }, [updatePassword]);

  const toggleFavorite = useCallback(async (id: string) => {
    const entry = passwords.find(p => p.id === id);
    if (entry) {
      await updatePassword(id, { isFavorite: !entry.isFavorite });
    }
  }, [passwords, updatePassword]);

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
