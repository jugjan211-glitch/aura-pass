import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreachResult {
  password: string;
  isBreached: boolean;
  breachCount: number;
  checkedAt: Date;
}

// SHA-1 hash function using Web Crypto API
async function sha1(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function BreachChecker() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<BreachResult | null>(null);

  const checkBreach = async () => {
    if (!password.trim()) {
      toast.error('Please enter a password to check');
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      // Hash the password using SHA-1
      const hash = await sha1(password);
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Query the HIBP API with k-anonymity
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      
      if (!response.ok) {
        throw new Error('Failed to check password');
      }

      const text = await response.text();
      const lines = text.split('\n');
      
      let breachCount = 0;
      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix.trim() === suffix) {
          breachCount = parseInt(count.trim(), 10);
          break;
        }
      }

      setResult({
        password: password.substring(0, 3) + '***',
        isBreached: breachCount > 0,
        breachCount,
        checkedAt: new Date(),
      });

      if (breachCount > 0) {
        toast.error(`This password was found in ${breachCount.toLocaleString()} data breaches!`);
      } else {
        toast.success('Good news! This password was not found in any known breaches.');
      }
    } catch (error) {
      toast.error('Failed to check password. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const getRiskLevel = (count: number) => {
    if (count === 0) return { label: 'Safe', color: 'text-success', bg: 'bg-success/10' };
    if (count < 100) return { label: 'Low Risk', color: 'text-warning', bg: 'bg-warning/10' };
    if (count < 1000) return { label: 'Medium Risk', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { label: 'High Risk', color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Breach Checker</CardTitle>
            <CardDescription>Check if your password has been exposed</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter a password to check..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              onKeyDown={(e) => e.key === 'Enter' && checkBreach()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button onClick={checkBreach} disabled={isChecking} className="gap-2">
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Check
          </Button>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your password is never sent to any server. We use the Have I Been Pwned API with k-anonymity to check securely.
          </p>
        </div>

        {result && (
          <div
            className={cn(
              'p-4 rounded-xl transition-all animate-fade-in',
              result.isBreached ? 'bg-destructive/10 border border-destructive/20' : 'bg-success/10 border border-success/20'
            )}
          >
            <div className="flex items-start gap-3">
              {result.isBreached ? (
                <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              ) : (
                <CheckCircle className="h-6 w-6 text-success shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className={cn('font-semibold', result.isBreached ? 'text-destructive' : 'text-success')}>
                    {result.isBreached ? 'Password Compromised!' : 'Password Not Found'}
                  </h4>
                  <Badge variant="outline" className={getRiskLevel(result.breachCount).color}>
                    {getRiskLevel(result.breachCount).label}
                  </Badge>
                </div>
                
                {result.isBreached ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      This password has been seen <strong>{result.breachCount.toLocaleString()}</strong> times in data breaches. 
                      You should change it immediately.
                    </p>
                    <Progress 
                      value={Math.min(result.breachCount / 100, 100)} 
                      className="h-2 bg-destructive/20"
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Great news! This password hasn't appeared in any known data breaches. 
                    However, this doesn't guarantee it's secure—use strong, unique passwords.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
