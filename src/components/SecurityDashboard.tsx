import { useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { PasswordEntry } from '@/hooks/usePasswords';
import { differenceInDays } from 'date-fns';

interface SecurityDashboardProps {
  passwords: PasswordEntry[];
}

export function SecurityDashboard({ passwords }: SecurityDashboardProps) {
  const stats = useMemo(() => {
    const total = passwords.length;
    const weak = passwords.filter(p => p.strength === 'weak').length;
    const medium = passwords.filter(p => p.strength === 'medium').length;
    const strong = passwords.filter(p => p.strength === 'strong').length;
    
    // Check for reused passwords
    const passwordCounts = new Map<string, number>();
    passwords.forEach(p => {
      const count = passwordCounts.get(p.password) || 0;
      passwordCounts.set(p.password, count + 1);
    });
    const reused = Array.from(passwordCounts.values()).filter(c => c > 1).length;
    
    // Check for old passwords (>90 days)
    const old = passwords.filter(p => {
      const age = differenceInDays(new Date(), p.createdAt);
      return age > 90;
    }).length;

    // Calculate security score
    let score = 100;
    if (total > 0) {
      score -= (weak / total) * 40;
      score -= (medium / total) * 10;
      score -= (reused / total) * 20;
      score -= (old / total) * 10;
    }
    score = Math.max(0, Math.round(score));

    return { total, weak, medium, strong, reused, old, score };
  }, [passwords]);

  if (passwords.length === 0) return null;

  const scoreColor = stats.score >= 80 ? 'text-success' : stats.score >= 50 ? 'text-warning' : 'text-destructive';
  const scoreLabel = stats.score >= 80 ? 'Excellent' : stats.score >= 50 ? 'Fair' : 'Needs Improvement';

  return (
    <div className="glass rounded-2xl p-6 shadow-card animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Security Dashboard</h2>
          <p className="text-sm text-muted-foreground">Your vault health at a glance</p>
        </div>
      </div>

      {/* Security Score */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 p-4 rounded-xl bg-secondary/30 border border-border/50">
        <div className="relative">
          <svg className="w-20 h-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={stats.score >= 80 ? 'hsl(var(--success))' : stats.score >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(stats.score / 100) * 226} 226`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${scoreColor}`}>{stats.score}</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm text-muted-foreground mb-1">Security Score</p>
          <p className={`text-lg font-semibold ${scoreColor}`}>{scoreLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on password strength, age, and uniqueness
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Strong</span>
          </div>
          <span className="text-xl font-bold text-success">{stats.strong}</span>
        </div>
        <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground">Medium</span>
          </div>
          <span className="text-xl font-bold text-warning">{stats.medium}</span>
        </div>
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Weak</span>
          </div>
          <span className="text-xl font-bold text-destructive">{stats.weak}</span>
        </div>
        <div className="p-3 rounded-xl bg-secondary border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Old (90d+)</span>
          </div>
          <span className="text-xl font-bold text-foreground">{stats.old}</span>
        </div>
      </div>

      {/* Alerts */}
      {(stats.weak > 0 || stats.reused > 0 || stats.old > 0) && (
        <div className="space-y-2">
          {stats.weak > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-foreground flex-1">
                {stats.weak} weak password{stats.weak > 1 ? 's' : ''} detected
              </p>
              <Button variant="outline" size="sm" className="text-xs">
                Fix Now
              </Button>
            </div>
          )}
          {stats.reused > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <RefreshCw className="h-4 w-4 text-warning flex-shrink-0" />
              <p className="text-sm text-foreground flex-1">
                {stats.reused} reused password{stats.reused > 1 ? 's' : ''} found
              </p>
              <Button variant="outline" size="sm" className="text-xs">
                Review
              </Button>
            </div>
          )}
          {stats.old > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border/50">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-foreground flex-1">
                {stats.old} password{stats.old > 1 ? 's' : ''} older than 90 days
              </p>
              <Button variant="outline" size="sm" className="text-xs">
                Update
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
