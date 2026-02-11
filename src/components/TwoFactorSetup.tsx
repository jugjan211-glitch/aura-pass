import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldCheck, ShieldOff, Copy, Loader2, Check } from 'lucide-react';
import * as OTPAuth from 'otpauth';

interface TwoFactorSetupProps {
  open: boolean;
  onClose: () => void;
}

export function TwoFactorSetup({ open, onClose }: TwoFactorSetupProps) {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpUri, setOtpUri] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'status' | 'setup' | 'verify'>('status');

  useEffect(() => {
    if (user && open) {
      loadStatus();
    }
  }, [user, open]);

  const loadStatus = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('totp_secrets')
      .select('is_enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    setIsEnabled(data?.is_enabled ?? false);
    setStep('status');
    setIsLoading(false);
  };

  const generateSecret = () => {
    const totp = new OTPAuth.TOTP({
      issuer: 'SecureVault',
      label: user?.email || 'user',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    setSecret(totp.secret.base32);
    setOtpUri(totp.toString());
    setStep('setup');
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Secret copied to clipboard');
  };

  const handleVerify = async () => {
    if (!user || verifyCode.length !== 6) return;
    setIsVerifying(true);

    try {
      // Validate TOTP server-side via edge function
      const { data: result, error } = await supabase.functions.invoke('verify-totp', {
        body: {
          action: 'verify-and-enable',
          code: verifyCode,
          secret: secret,
        },
      });

      if (error || result?.error) {
        toast.error(result?.error || 'Invalid code. Please try again.');
      } else {
        setIsEnabled(true);
        setStep('status');
        toast.success('Two-factor authentication enabled!');
      }
    } finally {
      setIsVerifying(false);
      setVerifyCode('');
    }
  };

  const handleDisable = async () => {
    if (!user) return;

    const { data: result, error } = await supabase.functions.invoke('verify-totp', {
      body: { action: 'disable' },
    });

    if (error || result?.error) {
      toast.error('Failed to disable 2FA');
    } else {
      setIsEnabled(false);
      toast.success('Two-factor authentication disabled');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : step === 'status' ? (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-3">
                {isEnabled ? (
                  <ShieldCheck className="h-6 w-6 text-success" />
                ) : (
                  <ShieldOff className="h-6 w-6 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {isEnabled ? '2FA Enabled' : '2FA Disabled'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEnabled ? 'Your account is protected' : 'Add extra security'}
                  </p>
                </div>
              </div>
              <Badge variant={isEnabled ? 'default' : 'secondary'}>
                {isEnabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {isEnabled ? (
              <Button variant="destructive" className="w-full" onClick={handleDisable}>
                Disable 2FA
              </Button>
            ) : (
              <Button className="w-full gradient-primary" onClick={generateSecret}>
                Enable 2FA
              </Button>
            )}
          </div>
        ) : step === 'setup' ? (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Copy this secret key into your authenticator app (Google Authenticator, Authy, etc.):
            </p>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 font-mono text-sm break-all">
              <span className="flex-1">{secret}</span>
              <Button variant="ghost" size="icon-sm" onClick={handleCopySecret}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Or scan this URI in your app: <code className="text-[10px] break-all">{otpUri}</code>
            </p>

            <Button className="w-full" onClick={() => setStep('verify')}>
              I've added it → Verify
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app to verify setup:
            </p>

            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('setup')}>
                Back
              </Button>
              <Button
                className="flex-1 gradient-primary"
                onClick={handleVerify}
                disabled={verifyCode.length !== 6 || isVerifying}
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
