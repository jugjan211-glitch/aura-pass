import { useState, useMemo } from 'react';
import { Search, Filter, Grid, List, SortAsc, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { PasswordCard } from './PasswordCard';
import type { PasswordEntry } from '@/hooks/usePasswords';

interface PasswordListProps {
  passwords: PasswordEntry[];
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (id: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'name' | 'strength';
type FilterStrength = 'all' | 'weak' | 'medium' | 'strong';

export function PasswordList({ passwords, onEdit, onDelete, onToggleFavorite, onCopy }: PasswordListProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterStrength, setFilterStrength] = useState<FilterStrength>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredPasswords = useMemo(() => {
    let result = [...passwords];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.username.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Strength filter
    if (filterStrength !== 'all') {
      result = result.filter(p => p.strength === filterStrength);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      result = result.filter(p => p.isFavorite);
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'oldest':
        result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'strength':
        const strengthOrder = { weak: 0, medium: 1, strong: 2 };
        result.sort((a, b) => strengthOrder[a.strength] - strengthOrder[b.strength]);
        break;
    }

    return result;
  }, [passwords, search, sortBy, filterStrength, showFavoritesOnly]);

  const categories = useMemo(() => {
    const cats = new Set(passwords.map(p => p.category));
    return Array.from(cats);
  }, [passwords]);

  if (passwords.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No passwords yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Start by generating a password and saving it to your vault, or import existing passwords.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search passwords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Strength Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuCheckboxItem
                checked={showFavoritesOnly}
                onCheckedChange={setShowFavoritesOnly}
              >
                Favorites only
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStrength('all')}>
                All Strengths
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStrength('weak')}>
                Weak
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStrength('medium')}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStrength('strong')}>
                Strong
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SortAsc className="h-4 w-4" />
                <span className="hidden sm:inline">Sort</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('newest')}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('strength')}>
                Strength
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex border border-input rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredPasswords.length} password{filteredPasswords.length !== 1 ? 's' : ''}</span>
        {(search || filterStrength !== 'all' || showFavoritesOnly) && (
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0"
            onClick={() => {
              setSearch('');
              setFilterStrength('all');
              setShowFavoritesOnly(false);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Password Grid/List */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
        : 'space-y-3'
      }>
        {filteredPasswords.map((entry, index) => (
          <div 
            key={entry.id} 
            style={{ animationDelay: `${index * 50}ms` }}
            className="opacity-0 animate-fade-in"
          >
            <PasswordCard
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
              onCopy={onCopy}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
