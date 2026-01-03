import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'amoled';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      if (stored) return stored;
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'amoled');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
