import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SecurityContextType {
  isLocked: boolean;
  autoLockEnabled: boolean;
  autoLockTimeout: number;
  lastActivity: Date;
  lock: () => void;
  unlock: () => void;
  panic: () => void;
  setAutoLockEnabled: (enabled: boolean) => void;
  setAutoLockTimeout: (minutes: number) => void;
  updateActivity: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [autoLockEnabled, setAutoLockEnabledState] = useState(true);
  const [autoLockTimeout, setAutoLockTimeoutState] = useState(5); // minutes
  const [lastActivity, setLastActivity] = useState(new Date());

  // Load security settings from database
  useEffect(() => {
    if (user) {
      supabase
        .from('user_preferences')
        .select('auto_lock_enabled, auto_lock_timeout')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setAutoLockEnabledState(data.auto_lock_enabled);
            setAutoLockTimeoutState(data.auto_lock_timeout);
          }
        });
    }
  }, [user]);

  // Auto-lock timer
  useEffect(() => {
    if (!autoLockEnabled || !user || isLocked) return;

    const checkLock = () => {
      const now = new Date();
      const diff = (now.getTime() - lastActivity.getTime()) / 1000 / 60; // minutes
      if (diff >= autoLockTimeout) {
        setIsLocked(true);
      }
    };

    const interval = setInterval(checkLock, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [autoLockEnabled, autoLockTimeout, lastActivity, user, isLocked]);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => setLastActivity(new Date());
    
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  const lock = useCallback(() => {
    setIsLocked(true);
    // Clear clipboard
    navigator.clipboard?.writeText('');
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    setLastActivity(new Date());
  }, []);

  const panic = useCallback(async () => {
    // Immediate lock
    setIsLocked(true);
    // Clear clipboard
    navigator.clipboard?.writeText('');
    // Clear local storage passwords
    localStorage.removeItem('securevault_passwords');
    // Sign out
    await signOut();
    // Reload page
    window.location.reload();
  }, [signOut]);

  const setAutoLockEnabled = useCallback((enabled: boolean) => {
    setAutoLockEnabledState(enabled);
    if (user) {
      supabase
        .from('user_preferences')
        .update({ auto_lock_enabled: enabled })
        .eq('user_id', user.id);
    }
  }, [user]);

  const setAutoLockTimeout = useCallback((minutes: number) => {
    setAutoLockTimeoutState(minutes);
    if (user) {
      supabase
        .from('user_preferences')
        .update({ auto_lock_timeout: minutes })
        .eq('user_id', user.id);
    }
  }, [user]);

  const updateActivity = useCallback(() => {
    setLastActivity(new Date());
  }, []);

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        autoLockEnabled,
        autoLockTimeout,
        lastActivity,
        lock,
        unlock,
        panic,
        setAutoLockEnabled,
        setAutoLockTimeout,
        updateActivity,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
