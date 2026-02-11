import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Copy, Check, Eye, EyeOff, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { decryptData, isLegacyEncryption, decodeLegacy } from '@/lib/crypto';

interface SharedData {
  title: string;
  username: string;
  password: string;
  url?: string;
}

export default function SharedPassword() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token) loadShared();
  }, [token]);

  const loadShared = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // Use the atomic RPC - validates expiry, view count, and increments atomically
      const { data: rpcData, error: rpcError } = await supabase.rpc('view_shared_password', {
        p_share_token: token,
      });

      if (rpcError || !rpcData || rpcData.length === 0) {
        const msg = rpcError?.message || '';
        if (msg.includes('expired')) {
          setError('This share link has expired.');
        } else if (msg.includes('limit')) {
          setError('This link has reached its maximum number of views.');
        } else {
          setError('This link is invalid or has expired.');
        }
        return;
      }

      const encryptedData = rpcData[0].encrypted_data;

      // Decrypt - support both legacy (base64) and new (AES-GCM) formats
      try {
        let decryptedJson: string;
        if (isLegacyEncryption(encryptedData)) {
          decryptedJson = decodeLegacy(encryptedData);
        } else {
          decryptedJson = await decryptData(encryptedData, token);
        }
        const decrypted = JSON.parse(decryptedJson);
        setData(decrypted);
      } catch {
        setError('Failed to decrypt shared data.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied! Clipboard clears in 30s.');
    setTimeout(() => navigator.clipboard.writeText(''), 30000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <Card className="glass-strong w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-3">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>Shared Password</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center space-y-3 py-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="font-medium text-foreground">{data.title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Username</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-foreground flex-1">{data.username}</p>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(data.username)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Password</p>
                <div className="flex items-center gap-2">
                  <code className={cn('font-mono text-sm flex-1', !showPassword && 'blur-sm select-none')}>
                    {data.password}
                  </code>
                  <Button variant="ghost" size="icon-sm" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(data.password)}>
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              {data.url && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Website</p>
                  <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {data.url}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mt-4">
                <Clock className="h-4 w-4 text-warning shrink-0" />
                <p className="text-xs text-muted-foreground">
                  This link will expire after the set time or maximum views.
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
