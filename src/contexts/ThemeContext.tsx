import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type Theme = 'light' | 'dark' | 'amoled';
export type AccentColor = 'teal' | 'blue' | 'purple' | 'orange' | 'yellow' | 'rose' | 'green';
export type FontSize = 'small' | 'medium' | 'large';
export type BorderRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
export type PresetTheme = 'ocean' | 'sunset' | 'forest' | 'midnight' | 'lavender' | 'cyber' | null;

interface ThemePreferences {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  borderRadius: BorderRadius;
  glassEffect: boolean;
  presetTheme: PresetTheme;
}

interface ThemeContextType extends ThemePreferences {
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: FontSize) => void;
  setBorderRadius: (radius: BorderRadius) => void;
  setGlassEffect: (enabled: boolean) => void;
  applyPresetTheme: (preset: PresetTheme) => void;
  isCustomizing: boolean;
  setIsCustomizing: (open: boolean) => void;
}

const defaultPreferences: ThemePreferences = {
  theme: 'dark',
  accentColor: 'teal',
  fontSize: 'medium',
  borderRadius: 'medium',
  glassEffect: true,
  presetTheme: null,
};

const presetThemes: Record<string, Partial<ThemePreferences>> = {
  ocean: { theme: 'dark', accentColor: 'blue', glassEffect: true, borderRadius: 'large' },
  sunset: { theme: 'light', accentColor: 'orange', glassEffect: false, borderRadius: 'medium' },
  forest: { theme: 'dark', accentColor: 'green', glassEffect: true, borderRadius: 'medium' },
  midnight: { theme: 'amoled', accentColor: 'purple', glassEffect: true, borderRadius: 'small' },
  lavender: { theme: 'light', accentColor: 'purple', glassEffect: true, borderRadius: 'large' },
  cyber: { theme: 'amoled', accentColor: 'teal', glassEffect: true, borderRadius: 'none' },
};

const accentColors: Record<AccentColor, { hue: string; sat: string; light: string }> = {
  teal: { hue: '168', sat: '76%', light: '42%' },
  blue: { hue: '217', sat: '91%', light: '60%' },
  purple: { hue: '262', sat: '83%', light: '58%' },
  orange: { hue: '25', sat: '95%', light: '53%' },
  yellow: { hue: '48', sat: '96%', light: '53%' },
  rose: { hue: '350', sat: '89%', light: '60%' },
  green: { hue: '142', sat: '76%', light: '36%' },
};

const fontSizes: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

const borderRadii: Record<BorderRadius, string> = {
  none: '0',
  small: '0.375rem',
  medium: '0.75rem',
  large: '1rem',
  full: '9999px',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme_preferences');
      if (stored) {
        try {
          return { ...defaultPreferences, ...JSON.parse(stored) };
        } catch {
          return defaultPreferences;
        }
      }
    }
    return defaultPreferences;
  });
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Load preferences from database when user logs in
  useEffect(() => {
    if (user) {
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            const dbPrefs: ThemePreferences = {
              theme: data.theme as Theme,
              accentColor: data.accent_color as AccentColor,
              fontSize: data.font_size as FontSize,
              borderRadius: data.border_radius as BorderRadius,
              glassEffect: data.glass_effect,
              presetTheme: data.preset_theme as PresetTheme,
            };
            setPreferences(dbPrefs);
            localStorage.setItem('theme_preferences', JSON.stringify(dbPrefs));
          }
        });
    }
  }, [user]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class
    root.classList.remove('light', 'dark', 'amoled');
    root.classList.add(preferences.theme);
    
    // Apply accent color CSS variables
    const accent = accentColors[preferences.accentColor];
    const h = accent.hue;
    const s = accent.sat;
    const l = accent.light;
    root.style.setProperty('--primary', `${h} ${s} ${l}`);
    root.style.setProperty('--ring', `${h} ${s} ${l}`);
    
    // Update accent/highlight colors based on selected accent
    const lNum = parseInt(l);
    root.style.setProperty('--accent', `${h} 50% ${preferences.theme === 'light' ? '94%' : preferences.theme === 'dark' ? '15%' : '10%'}`);
    root.style.setProperty('--accent-foreground', `${h} ${s} ${preferences.theme === 'light' ? '26%' : '60%'}`);
    
    // Update gradient-primary dynamically
    const gradientEnd = Math.min(lNum + 10, 65);
    const hEnd = parseInt(h) + 4;
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${h} ${s} ${l}) 0%, hsl(${hEnd} 66% ${gradientEnd}%) 100%)`);
    root.style.setProperty('--shadow-glow', `0 0 60px hsl(${h} ${s} ${l} / 0.2)`);
    
    // Update sidebar colors
    root.style.setProperty('--sidebar-primary', `${h} ${s} ${l}`);
    root.style.setProperty('--sidebar-ring', `${h} ${s} ${l}`);
    
    // Apply font size
    root.style.setProperty('--font-size-base', fontSizes[preferences.fontSize]);
    root.style.fontSize = fontSizes[preferences.fontSize];
    
    // Apply border radius
    root.style.setProperty('--radius', borderRadii[preferences.borderRadius]);
    
    // Apply glass effect
    if (!preferences.glassEffect) {
      root.classList.add('no-glass');
    } else {
      root.classList.remove('no-glass');
    }
    
    // Save to localStorage
    localStorage.setItem('theme_preferences', JSON.stringify(preferences));
    localStorage.setItem('theme', preferences.theme);
    
    // Save to database if user is logged in
    if (user) {
      supabase
        .from('user_preferences')
        .update({
          theme: preferences.theme,
          accent_color: preferences.accentColor,
          font_size: preferences.fontSize,
          border_radius: preferences.borderRadius,
          glass_effect: preferences.glassEffect,
          preset_theme: preferences.presetTheme,
        })
        .eq('user_id', user.id);
    }
  }, [preferences, user]);

  const updatePreference = <K extends keyof ThemePreferences>(
    key: K,
    value: ThemePreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value, presetTheme: null }));
  };

  const applyPresetTheme = (preset: PresetTheme) => {
    if (preset && presetThemes[preset]) {
      setPreferences(prev => ({
        ...prev,
        ...presetThemes[preset],
        presetTheme: preset,
      }));
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        ...preferences,
        setTheme: (theme) => updatePreference('theme', theme),
        setAccentColor: (color) => updatePreference('accentColor', color),
        setFontSize: (size) => updatePreference('fontSize', size),
        setBorderRadius: (radius) => updatePreference('borderRadius', radius),
        setGlassEffect: (enabled) => updatePreference('glassEffect', enabled),
        applyPresetTheme,
        isCustomizing,
        setIsCustomizing,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export { accentColors, presetThemes };
