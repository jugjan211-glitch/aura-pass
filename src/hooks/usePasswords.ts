import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  useVaultKey,
  encryptWithKey,
  decryptWithKey,
  isEncryptedBundle,
} from '@/hooks/useVaultKey';

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

// ---------------------------------------------------------------------------
// Helper: safely decrypt a password field. If decryption fails (wrong key,
// plaintext legacy data, etc.) return a sentinel so the UI can show a warning.
// ---------------------------------------------------------------------------
async function safeDecrypt(value: string, key: CryptoKey | null): Promise<string> {
  if (!isEncryptedBundle(value)) {
    // Legacy plaintext – return as-is (will be re-encrypted on next save)
    return value;
  }
  if (!key) return '🔒 (locked)';
  try {
    return await decryptWithKey(value, key);
  } catch {
    return '🔒 (wrong key)';
  }
}

export function usePasswords() {
  const { user } = useAuth();
  const { cloudKey, localKey, setCloudKey } = useVaultKey();

  const [localPasswords, setLocalPasswords] = useState<PasswordEntry[]>([]);
  const [cloudPasswords, setCloudPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Track whether we've performed the initial local load
  const [localLoaded, setLocalLoaded] = useState(false);

  // Derive cloud key whenever user changes
  useEffect(() => {
    if (user) {
      setCloudKey(user.id);
    }
  }, [user, setCloudKey]);

  // Load (and decrypt) local passwords whenever localKey changes.
  // This covers both: initial mount (key may be null) AND after the user
  // unlocks the vault by entering their master password.
  useEffect(() => {
    const loadLocal = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed: PasswordEntry[] = JSON.parse(stored);
          const decrypted = await Promise.all(
            parsed.map(async p => ({
              ...p,
              storageType: 'local' as const,
              createdAt: new Date(p.createdAt),
              lastUsed: p.lastUsed ? new Date(p.lastUsed) : undefined,
              password: await safeDecrypt(p.password, localKey),
            }))
          );
          setLocalPasswords(decrypted);
        } catch (e) {
          console.error('Failed to parse local passwords:', e);
        }
      } else {
        setLocalPasswords([]);
      }
      setIsLoading(false);
      setLocalLoaded(true);
    };
    loadLocal();
    // Re-run when local key becomes available (vault unlock)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localKey]);

  // Load cloud passwords (decrypt on load)
  useEffect(() => {
    if (user && cloudKey) {
      loadCloudPasswords();
    } else if (!user) {
      setCloudPasswords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cloudKey]);

  const loadCloudPasswords = async () => {
    if (!user || !cloudKey) return;
    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const decrypted = await Promise.all(
        data.map(async p => ({
          id: p.id,
          title: p.title,
          username: p.username,
          password: await safeDecrypt(p.password, cloudKey),
          url: p.url || undefined,
          category: p.category,
          tags: p.tags || [],
          strength: p.strength as 'weak' | 'medium' | 'strong',
          storageType: 'cloud' as const,
          createdAt: new Date(p.created_at),
          lastUsed: p.last_used ? new Date(p.last_used) : undefined,
          notes: p.notes || undefined,
          isFavorite: p.is_favorite,
        }))
      );
      setCloudPasswords(decrypted);
    }
  };

  // Persist local passwords (encrypt on save).
  // Only run after the initial local load so we don't wipe stored data
  // with an empty array on the very first render.
  useEffect(() => {
    if (!localLoaded) return;

    const persist = async () => {
      const toStore = await Promise.all(
        localPasswords.map(async p => {
          let encPw = p.password;
          // Encrypt any plaintext password that isn't a sentinel value
          if (localKey && encPw && !encPw.startsWith('🔒') && !isEncryptedBundle(encPw)) {
            encPw = await encryptWithKey(encPw, localKey);
          }
          return { ...p, password: encPw };
        })
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    };

    persist();
  }, [localPasswords, localKey, localLoaded]);

  const passwords = [...cloudPasswords, ...localPasswords];

  const addPassword = useCallback(
    async (
      entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'storageType'> & {
        storageType?: 'local' | 'cloud';
      }
    ) => {
      const storage = entry.storageType || 'local';

      if (storage === 'cloud' && user && cloudKey) {
        const encryptedPassword = await encryptWithKey(entry.password, cloudKey);
        const { data, error } = await supabase
          .from('passwords')
          .insert({
            user_id: user.id,
            title: entry.title,
            username: entry.username,
            password: encryptedPassword,
            url: entry.url,
            category: entry.category,
            tags: entry.tags,
            strength: entry.strength,
            notes: entry.notes,
            is_favorite: entry.isFavorite,
          })
          .select()
          .single();

        if (!error && data) {
          await loadCloudPasswords();
          return {
            ...entry,
            id: data.id,
            createdAt: new Date(data.created_at),
            storageType: 'cloud' as const,
          };
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
    },
    [user, cloudKey, localKey]
  );

  const updatePassword = useCallback(
    async (id: string, updates: Partial<PasswordEntry>) => {
      const cloudMatch = cloudPasswords.find(p => p.id === id);
      if (cloudMatch && user && cloudKey) {
        let encPw = updates.password;
        if (encPw && !encPw.startsWith('🔒')) {
          encPw = await encryptWithKey(encPw, cloudKey);
        }
        await supabase
          .from('passwords')
          .update({
            title: updates.title,
            username: updates.username,
            password: encPw,
            url: updates.url,
            category: updates.category,
            tags: updates.tags,
            strength: updates.strength,
            notes: updates.notes,
            is_favorite: updates.isFavorite,
            last_used: updates.lastUsed?.toISOString(),
          })
          .eq('id', id);
        await loadCloudPasswords();
      } else {
        setLocalPasswords(prev =>
          prev.map(p => (p.id === id ? { ...p, ...updates } : p))
        );
      }
    },
    [cloudPasswords, user, cloudKey]
  );

  const deletePassword = useCallback(
    async (id: string) => {
      const cloudMatch = cloudPasswords.find(p => p.id === id);
      if (cloudMatch && user) {
        await supabase.from('passwords').delete().eq('id', id);
        await loadCloudPasswords();
      } else {
        setLocalPasswords(prev => prev.filter(p => p.id !== id));
      }
    },
    [cloudPasswords, user]
  );

  const markAsUsed = useCallback(
    (id: string) => {
      updatePassword(id, { lastUsed: new Date() });
    },
    [updatePassword]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const entry = passwords.find(p => p.id === id);
      if (entry) {
        await updatePassword(id, { isFavorite: !entry.isFavorite });
      }
    },
    [passwords, updatePassword]
  );

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
