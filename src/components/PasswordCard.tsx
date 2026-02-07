import { useState } from 'react';
import { 
  Copy, Eye, EyeOff, MoreVertical, Trash2, Edit2, 
  ExternalLink, Star, Globe, User, Clock, Check, Share2, HardDrive, Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { PasswordEntry } from '@/hooks/usePasswords';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PasswordCardProps {
  entry: PasswordEntry;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (id: string) => void;
  onShare?: (entry: PasswordEntry) => void;
}

export function PasswordCard({ entry, onEdit, onDelete, onToggleFavorite, onCopy, onShare }: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(entry.password);
      setCopied(true);
      onCopy(entry.id);
      toast.success('Password copied', {
        description: 'Clipboard will be cleared in 30 seconds',
      });
      setTimeout(() => navigator.clipboard.writeText(''), 30000);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy password');
    }
  };

  const strengthBarColors = {
    weak: 'bg-destructive', medium: 'bg-warning', strong: 'bg-success',
  };
  const strengthWidths = {
    weak: 'w-1/3', medium: 'w-2/3', strong: 'w-full',
  };

  return (
    <div className="group glass rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-primary/20 animate-scale-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            {entry.url ? <Globe className="h-5 w-5 text-muted-foreground" /> : <User className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">{entry.title}</h3>
              {entry.isFavorite && <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground truncate">{entry.username}</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs font-mono bg-secondary/50 px-2 py-1 rounded text-muted-foreground">
                {showPassword ? entry.password : '••••••••••••'}
              </code>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowPassword(!showPassword)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 bg-secondary rounded-full overflow-hidden max-w-20">
                <div className={`h-full rounded-full ${strengthBarColors[entry.strength]} ${strengthWidths[entry.strength]}`} />
              </div>
              <span className="text-[10px] text-muted-foreground capitalize">{entry.strength}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(entry)} className="gap-2">
                <Edit2 className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleFavorite(entry.id)} className="gap-2">
                <Star className={`h-4 w-4 ${entry.isFavorite ? 'fill-warning text-warning' : ''}`} />
                {entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </DropdownMenuItem>
              {entry.url && (
                <DropdownMenuItem className="gap-2" asChild>
                  <a href={entry.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Open Website
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" onClick={() => onShare?.(entry)}>
                <Share2 className="h-4 w-4" /> Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(entry.id)} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
        <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">{entry.category}</Badge>
        <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 gap-1">
          {entry.storageType === 'local' ? <HardDrive className="h-2.5 w-2.5" /> : <Cloud className="h-2.5 w-2.5" />}
          {entry.storageType === 'local' ? 'Local' : 'Cloud'}
        </Badge>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
