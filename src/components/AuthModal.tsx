import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye, EyeOff, Shield, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Check your email to verify your account!');
          onClose();
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
          return;
        }

        // Check if user has 2FA enabled
        const { data: statusData, error: statusError } = await supabase.functions.invoke('verify-totp', {
          body: { action: 'check-status' },
        });

        if (statusError || !statusData) {
          // If we can't check, just proceed (fail open for status check only)
          toast.success('Welcome back!');
          onClose();
          return;
        }

        if (statusData.enabled) {
          // 2FA is enabled — require TOTP before granting access
          setStep('totp');
        } else {
          toast.success('Welcome back!');
          onClose();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpVerify = async () => {
    if (totpCode.length !== 6) return;
    setIsVerifying(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('verify-totp', {
        body: { action: 'verify', code: totpCode },
      });

      if (error || !result?.valid) {
        toast.error('Invalid code. Please try again.');
        setTotpCode('');
      } else {
        toast.success('Welcome back!');
        onClose();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelTotp = async () => {
    // Sign out since the user didn't complete 2FA
    await signOut();
    setStep('credentials');
    setTotpCode('');
    toast.info('Sign-in cancelled');
  };

  const handleClose = async () => {
    if (step === 'totp') {
      await handleCancelTotp();
    }
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setTotpCode('');
    setStep('credentials');
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  if (step === 'totp') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="glass-strong sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <DialogTitle className="text-center text-xl">Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-center">
              Enter the 6-digit code from your authenticator app to complete sign-in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="totpCode">Verification Code</Label>
              <Input
                id="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleTotpVerify()}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCancelTotp}>
                Cancel
              </Button>
              <Button
                className="flex-1 gradient-primary"
                onClick={handleTotpVerify}
                disabled={totpCode.length !== 6 || isVerifying}
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Open Google Authenticator, Authy, or your preferred app to find the code for SecureVault.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'signin'
              ? 'Sign in to access your vault across all devices'
              : 'Create an account to sync your passwords securely'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
