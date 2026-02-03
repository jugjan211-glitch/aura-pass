import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  useThemeContext, 
  type Theme, 
  type AccentColor, 
  type FontSize, 
  type BorderRadius,
  type PresetTheme,
  accentColors,
  presetThemes
} from '@/contexts/ThemeContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { Sun, Moon, Zap, Palette, Type, Square, Sparkles, Lock, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeCustomizer() {
  const {
    theme,
    accentColor,
    fontSize,
    borderRadius,
    glassEffect,
    presetTheme,
    setTheme,
    setAccentColor,
    setFontSize,
    setBorderRadius,
    setGlassEffect,
    applyPresetTheme,
    isCustomizing,
    setIsCustomizing,
  } = useThemeContext();

  const { autoLockEnabled, autoLockTimeout, setAutoLockEnabled, setAutoLockTimeout, panic } = useSecurity();

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'amoled', label: 'AMOLED', icon: <Zap className="h-4 w-4" /> },
  ];

  const colors: { value: AccentColor; label: string; class: string }[] = [
    { value: 'teal', label: 'Teal', class: 'bg-[hsl(168,76%,42%)]' },
    { value: 'blue', label: 'Blue', class: 'bg-[hsl(217,91%,60%)]' },
    { value: 'purple', label: 'Purple', class: 'bg-[hsl(262,83%,58%)]' },
    { value: 'orange', label: 'Orange', class: 'bg-[hsl(25,95%,53%)]' },
    { value: 'yellow', label: 'Yellow', class: 'bg-[hsl(48,96%,53%)]' },
    { value: 'rose', label: 'Rose', class: 'bg-[hsl(350,89%,60%)]' },
    { value: 'green', label: 'Green', class: 'bg-[hsl(142,76%,36%)]' },
  ];

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
  ];

  const radii: { value: BorderRadius; label: string; class: string }[] = [
    { value: 'none', label: 'None', class: 'rounded-none' },
    { value: 'small', label: 'Small', class: 'rounded' },
    { value: 'medium', label: 'Medium', class: 'rounded-lg' },
    { value: 'large', label: 'Large', class: 'rounded-xl' },
    { value: 'full', label: 'Full', class: 'rounded-full' },
  ];

  const presets: { value: PresetTheme; label: string; gradient: string }[] = [
    { value: 'ocean', label: 'Ocean', gradient: 'from-blue-500 to-cyan-500' },
    { value: 'sunset', label: 'Sunset', gradient: 'from-orange-500 to-pink-500' },
    { value: 'forest', label: 'Forest', gradient: 'from-green-500 to-emerald-500' },
    { value: 'midnight', label: 'Midnight', gradient: 'from-purple-500 to-indigo-500' },
    { value: 'lavender', label: 'Lavender', gradient: 'from-purple-400 to-pink-400' },
    { value: 'cyber', label: 'Cyber', gradient: 'from-teal-400 to-cyan-400' },
  ];

  return (
    <Sheet open={isCustomizing} onOpenChange={setIsCustomizing}>
      <SheetContent className="glass-strong overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Customize Appearance
          </SheetTitle>
          <SheetDescription>
            Personalize your vault experience
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 mt-6">
          {/* Preset Themes */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Preset Themes
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => applyPresetTheme(preset.value)}
                  className={cn(
                    'relative h-16 rounded-lg bg-gradient-to-br transition-all',
                    preset.gradient,
                    presetTheme === preset.value 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' 
                      : 'hover:scale-105'
                  )}
                >
                  <span className="absolute inset-x-0 bottom-1 text-xs font-medium text-white drop-shadow-lg">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Theme Mode
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <Button
                  key={t.value}
                  variant={theme === t.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(t.value)}
                  className="gap-2"
                >
                  {t.icon}
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Accent Color
            </Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAccentColor(color.value)}
                  className={cn(
                    'w-10 h-10 rounded-full transition-all',
                    color.class,
                    accentColor === color.value 
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' 
                      : 'hover:scale-110'
                  )}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size
            </Label>
            <div className="flex gap-2">
              {fontSizes.map((size) => (
                <Button
                  key={size.value}
                  variant={fontSize === size.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFontSize(size.value)}
                  className="flex-1"
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Border Radius
            </Label>
            <div className="flex gap-2">
              {radii.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setBorderRadius(r.value)}
                  className={cn(
                    'flex-1 h-10 border-2 transition-all',
                    r.class,
                    borderRadius === r.value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border bg-muted hover:border-primary/50'
                  )}
                  title={r.label}
                />
              ))}
            </div>
          </div>

          {/* Glass Effect */}
          <div className="flex items-center justify-between">
            <Label htmlFor="glass-effect" className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-4 w-4" />
              Glass Effect
            </Label>
            <Switch
              id="glass-effect"
              checked={glassEffect}
              onCheckedChange={setGlassEffect}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Security Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security Settings
            </h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-lock" className="flex items-center gap-2 cursor-pointer">
                <Clock className="h-4 w-4" />
                Auto-Lock
              </Label>
              <Switch
                id="auto-lock"
                checked={autoLockEnabled}
                onCheckedChange={setAutoLockEnabled}
              />
            </div>

            {autoLockEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lock after</span>
                  <span className="font-medium">{autoLockTimeout} min</span>
                </div>
                <Slider
                  value={[autoLockTimeout]}
                  onValueChange={([value]) => setAutoLockTimeout(value)}
                  min={1}
                  max={30}
                  step={1}
                />
              </div>
            )}

            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={panic}
            >
              <AlertTriangle className="h-4 w-4" />
              Panic Button (Lock & Clear)
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Instantly locks the app, clears clipboard, and signs you out
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
