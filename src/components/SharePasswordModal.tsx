import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Share2, Copy, Check, Loader2, Clock, Eye } from 'lucide-react';
import type { PasswordEntry } from '@/hooks/usePasswords';
import { encryptData } from '@/lib/crypto';

interface SharePasswordModalProps {
  open: boolean;
  onClose: () => void;
  entry: PasswordEntry | null;
}

export function SharePasswordModal({ open, onClose, entry }: SharePasswordModalProps) {
  const { user } = useAuth();
  const [expiry, setExpiry] = useState('1h');
  const [maxViews, setMaxViews] = useState('1');
  const [shareLink, setShareLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!user || !entry) return;
    setIsCreating(true);

    try {
      // Generate a random token
      const tokenArray = new Uint8Array(32);
      crypto.getRandomValues(tokenArray);
      const token = Array.from(tokenArray, b => b.toString(16).padStart(2, '0')).join('');

      // Calculate expiry
      const expiryMs: Record<string, number> = {
        '1h': 3600000,
        '24h': 86400000,
        '7d': 604800000,
      };
      const expiresAt = new Date(Date.now() + (expiryMs[expiry] || 3600000));

      // Encrypt data with AES-GCM using token as key material
      const data = JSON.stringify({
        title: entry.title,
        username: entry.username,
        password: entry.password,
        url: entry.url,
      });
      const encrypted = await encryptData(data, token);

      const { error } = await supabase.from('shared_passwords').insert({
        password_id: entry.id,
        shared_by: user.id,
        share_token: token,
        encrypted_data: encrypted,
        expires_at: expiresAt.toISOString(),
        max_views: parseInt(maxViews),
      });

      if (error) {
        toast.error('Failed to create share link');
      } else {
        const link = `${window.location.origin}/shared/${token}`;
        setShareLink(link);
        toast.success('Share link created!');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  const handleClose = () => {
    setShareLink('');
    setCopied(false);
    onClose();
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Password
          </DialogTitle>
          <DialogDescription>
            Create a temporary, self-destructing link for "{entry.title}"
          </DialogDescription>
        </DialogHeader>

        {shareLink ? (
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <p className="text-sm text-success font-medium mb-2">Share link created!</p>
              <div className="flex items-center gap-2">
                <Input value={shareLink} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires: {expiry}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Max views: {maxViews}
              </span>
            </div>

            <Button variant="outline" className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Expires After</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Views</Label>
              <Select value={maxViews} onValueChange={setMaxViews}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 View</SelectItem>
                  <SelectItem value="3">3 Views</SelectItem>
                  <SelectItem value="5">5 Views</SelectItem>
                  <SelectItem value="10">10 Views</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1 gradient-primary gap-2" onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Create Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
