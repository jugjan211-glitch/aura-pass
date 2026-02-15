import { useState, useCallback } from 'react';
import { Copy, RefreshCw, Check, Eye, EyeOff, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { generatePassword, calculateStrength, generatePassphrase, type GeneratorOptions } from '@/lib/passwordGenerator';
import { toast } from 'sonner';

interface PasswordGeneratorProps {
  onPasswordGenerated?: (password: string) => void;
}

export function PasswordGenerator({ onPasswordGenerated }: PasswordGeneratorProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    includeLetters: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: false,
    excludeSimilar: false,
  });

  const strength = password ? calculateStrength(password) : null;

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const newPassword = generatePassword(options);
      setPassword(newPassword);
      onPasswordGenerated?.(newPassword);
      setIsGenerating(false);
    }, 150);
  }, [options, onPasswordGenerated]);

  const handleGeneratePassphrase = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const passphrase = generatePassphrase(4);
      setPassword(passphrase);
      onPasswordGenerated?.(passphrase);
      setIsGenerating(false);
    }, 150);
  }, [onPasswordGenerated]);

  const handleCopy = useCallback(async () => {
    if (!password) return;
    
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success('Password copied to clipboard', {
        description: 'Clipboard will be cleared in 30 seconds',
      });
      
      // Clear clipboard after 30 seconds
      setTimeout(() => {
        navigator.clipboard.writeText('');
      }, 30000);

      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy password');
    }
  }, [password]);

  const strengthColors = {
    weak: 'bg-destructive',
    medium: 'bg-warning',
    strong: 'bg-success',
  };

  const strengthWidths = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full',
  };

  return (
    <div className="glass rounded-2xl p-6 shadow-card animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Password Generator</h2>
          <p className="text-sm text-muted-foreground">Create strong, unique passwords</p>
        </div>
      </div>

      {/* Password Display */}
      <div className="relative mb-6">
        <div className="flex items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            readOnly
            placeholder="Click generate to create a password"
            className="flex-1 bg-transparent font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              disabled={!password}
              className="text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Strength Indicator */}
        {strength && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Password Strength</span>
              <span className={`text-xs font-medium capitalize ${
                strength.label === 'weak' ? 'text-destructive' :
                strength.label === 'medium' ? 'text-warning' : 'text-success'
              }`}>
                {strength.label}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${strengthColors[strength.label]} ${strengthWidths[strength.label]}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-5 mb-6">
        {/* Length Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-foreground">Password Length</Label>
            <span className="text-sm font-mono font-medium text-primary">{options.length}</span>
          </div>
          <Slider
            value={[options.length]}
            onValueChange={([value]) => setOptions(prev => ({ ...prev, length: value }))}
            min={8}
            max={64}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        {/* Character Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
            <Label htmlFor="letters" className="text-sm cursor-pointer">Letters (A-z)</Label>
            <Switch
              id="letters"
              checked={options.includeLetters}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeLetters: checked }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
            <Label htmlFor="numbers" className="text-sm cursor-pointer">Numbers (0-9)</Label>
            <Switch
              id="numbers"
              checked={options.includeNumbers}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeNumbers: checked }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
            <Label htmlFor="symbols" className="text-sm cursor-pointer">Symbols (!@#)</Label>
            <Switch
              id="symbols"
              checked={options.includeSymbols}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSymbols: checked }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
            <Label htmlFor="ambiguous" className="text-sm cursor-pointer">No Ambiguous</Label>
            <Switch
              id="ambiguous"
              checked={options.excludeAmbiguous}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excludeAmbiguous: checked }))}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="gradient"
          size="lg"
          className="flex-1 gap-2"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Generate Password
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleGeneratePassphrase}
          disabled={isGenerating}
          className="gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Passphrase
        </Button>
      </div>
    </div>
  );
}
