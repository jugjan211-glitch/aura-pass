import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generatePassword, calculateStrength } from '@/lib/passwordGenerator';
import type { PasswordEntry } from '@/hooks/usePasswords';

interface AddPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'storageType'>) => void;
  editEntry?: PasswordEntry | null;
  generatedPassword?: string;
}

const CATEGORIES = [
  'Uncategorized',
  'Social',
  'Work',
  'Finance',
  'Shopping',
  'Entertainment',
  'Development',
  'Email',
  'Other',
];

export function AddPasswordModal({ open, onClose, onSave, editEntry, generatedPassword }: AddPasswordModalProps) {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const strength = password ? calculateStrength(password) : null;

  useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title);
      setUsername(editEntry.username);
      setPassword(editEntry.password);
      setUrl(editEntry.url || '');
      setCategory(editEntry.category);
      setNotes(editEntry.notes || '');
    } else if (generatedPassword) {
      setPassword(generatedPassword);
    } else {
      setTitle('');
      setUsername('');
      setPassword('');
      setUrl('');
      setCategory('Uncategorized');
      setNotes('');
    }
  }, [editEntry, generatedPassword, open]);

  const handleGeneratePassword = () => {
    const newPassword = generatePassword({
      length: 20,
      includeLetters: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
      excludeSimilar: false,
    });
    setPassword(newPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !username || !password) return;

    const strengthResult = calculateStrength(password);
    
    onSave({
      title,
      username,
      password,
      url: url || undefined,
      category,
      tags: [],
      strength: strengthResult.label,
      notes,
      isFavorite: editEntry?.isFavorite || false,
      lastUsed: editEntry?.lastUsed,
    });

    onClose();
  };

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-strong">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editEntry ? 'Edit Password' : 'Add New Password'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Google Account"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username / Email *</Label>
            <Input
              id="username"
              placeholder="e.g. john@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter or generate password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 font-mono"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleGeneratePassword}
                title="Generate Password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Strength indicator */}
            {strength && (
              <div className="space-y-1">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength.label]} ${strengthWidths[strength.label]}`}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Strength</span>
                  <span className={`capitalize ${
                    strength.label === 'weak' ? 'text-destructive' :
                    strength.label === 'medium' ? 'text-warning' : 'text-success'
                  }`}>
                    {strength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              {editEntry ? 'Update' : 'Save'} Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
