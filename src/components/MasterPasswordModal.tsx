import { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, HardDrive } from 'lucide-react';
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

interface MasterPasswordModalProps {
  open: boolean;
  /** true = first-time setup (show confirm field), false = unlock existing */
  isSetup: boolean;
  onSubmit: (password: string) => Promise<void>;
  onCancel?: () => void;
}

export function MasterPasswordModal({ open, isSetup, onSubmit, onCancel }: MasterPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSetup) {
      if (password.length < 8) { setError('Master password must be at least 8 characters.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
    } else {
      if (!password) { setError('Please enter your master password.'); return; }
    }

    setIsLoading(true);
    try {
      await onSubmit(password);
      setPassword('');
      setConfirm('');
    } catch {
      setError('Incorrect master password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-sm glass-strong">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              {isSetup ? <HardDrive className="h-5 w-5 text-primary-foreground" /> : <Lock className="h-5 w-5 text-primary-foreground" />}
            </div>
            <DialogTitle className="text-lg font-semibold">
              {isSetup ? 'Create Master Password' : 'Unlock Local Vault'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {isSetup
              ? 'Your locally stored passwords will be encrypted with this master password. It is never sent anywhere — keep it safe.'
              : 'Enter your master password to decrypt your locally stored passwords.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="master-pw">Master Password</Label>
            <div className="relative">
              <Input
                id="master-pw"
                type={show ? 'text' : 'password'}
                placeholder={isSetup ? 'Min. 8 characters' : 'Enter master password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pr-10 font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSetup && (
            <div className="space-y-2">
              <Label htmlFor="master-pw-confirm">Confirm Master Password</Label>
              <Input
                id="master-pw-confirm"
                type={show ? 'text' : 'password'}
                placeholder="Repeat master password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="font-mono"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="gradient" className="flex-1 gap-2" disabled={isLoading}>
              <Shield className="h-4 w-4" />
              {isSetup ? 'Set Master Password' : 'Unlock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
