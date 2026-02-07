import { Plus, Upload, Cloud, Shield, History, Star, AlertTriangle, Folder, CloudOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { AuthModal } from './AuthModal';

interface QuickActionsPanelProps {
  onAddPassword: () => void;
  passwordCount: number;
  weakPasswordCount: number;
  favoriteCount: number;
}

export function QuickActionsPanel({ 
  onAddPassword, 
  passwordCount, 
  weakPasswordCount,
  favoriteCount 
}: QuickActionsPanelProps) {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <div className="glass rounded-2xl p-6 shadow-card animate-slide-up delay-100 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Shield className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">Manage your vault</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{passwordCount}</span>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">Favorites</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{favoriteCount}</span>
          </div>
          {weakPasswordCount > 0 && (
            <div className="col-span-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">
                  {weakPasswordCount} weak password{weakPasswordCount > 1 ? 's' : ''} found
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 flex-1">
          <Button
            variant="gradient"
            size="lg"
            className="w-full gap-2 justify-start"
            onClick={onAddPassword}
          >
            <Plus className="h-4 w-4" />
            Add Password
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full gap-2 justify-start"
          >
            <Upload className="h-4 w-4" />
            Import Passwords
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full gap-2 justify-start"
          >
            <History className="h-4 w-4" />
            Password History
          </Button>
        </div>

        {/* Cloud Sync Status */}
        {user ? (
          <div className="mt-6 p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Cloud Sync Active</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your passwords are synced securely across devices.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <Cloud className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Enable Cloud Sync</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sign in to sync passwords across devices and enable backup protection.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-auto mt-2 text-primary"
                  onClick={() => setAuthOpen(true)}
                >
                  Sign in to sync →
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
