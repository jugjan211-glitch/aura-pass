import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  Eye,
  EyeOff,
  Search,
  Lock,
  CreditCard,
  Key,
  FileCode,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecureNote {
  id: string;
  title: string;
  content: string;
  category: string;
  is_favorite: boolean;
  created_at: string;
}

const categories = [
  { value: 'General', icon: FileText },
  { value: 'Recovery Codes', icon: Key },
  { value: 'Credit Cards', icon: CreditCard },
  { value: 'Private Keys', icon: Lock },
  { value: 'API Keys', icon: FileCode },
];

export function SecureNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editNote, setEditNote] = useState<SecureNote | null>(null);
  const [search, setSearch] = useState('');
  const [visibleNotes, setVisibleNotes] = useState<Set<string>>(new Set());

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('secure_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load notes');
    } else {
      setNotes(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editNote) {
      const { error } = await supabase
        .from('secure_notes')
        .update({ title, content, category })
        .eq('id', editNote.id);

      if (error) {
        toast.error('Failed to update note');
      } else {
        toast.success('Note updated');
        loadNotes();
      }
    } else {
      const { error } = await supabase
        .from('secure_notes')
        .insert({ user_id: user.id, title, content, category });

      if (error) {
        toast.error('Failed to save note');
      } else {
        toast.success('Note saved');
        loadNotes();
      }
    }

    closeModal();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('secure_notes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete note');
    } else {
      toast.success('Note deleted');
      loadNotes();
    }
  };

  const toggleFavorite = async (note: SecureNote) => {
    const { error } = await supabase
      .from('secure_notes')
      .update({ is_favorite: !note.is_favorite })
      .eq('id', note.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      loadNotes();
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openEdit = (note: SecureNote) => {
    setEditNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditNote(null);
    setTitle('');
    setContent('');
    setCategory('General');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditNote(null);
    setTitle('');
    setContent('');
    setCategory('General');
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(search.toLowerCase()) ||
    note.content.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryIcon = (cat: string) => {
    const found = categories.find(c => c.value === cat);
    return found ? found.icon : FileText;
  };

  if (!user) {
    return (
      <Card className="glass">
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign in Required</h3>
          <p className="text-muted-foreground">
            Sign in to access secure notes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Secure Notes
        </h2>
        <Button onClick={openNew} className="gradient-primary gap-2">
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Notes Yet</h3>
            <p className="text-muted-foreground mb-4">
              Store sensitive information securely
            </p>
            <Button onClick={openNew} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredNotes.map((note) => {
            const Icon = getCategoryIcon(note.category);
            const isVisible = visibleNotes.has(note.id);

            return (
              <Card key={note.id} className="glass group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{note.title}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {note.category}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(note)}
                      className="text-muted-foreground hover:text-yellow-500 transition-colors"
                    >
                      {note.is_favorite ? (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre
                      className={cn(
                        'text-sm font-mono bg-muted/50 rounded-lg p-3 whitespace-pre-wrap break-words max-h-32 overflow-hidden',
                        !isVisible && 'blur-sm select-none'
                      )}
                    >
                      {note.content}
                    </pre>
                    <button
                      onClick={() => toggleVisibility(note.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(note)}>
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{editNote ? 'Edit Note' : 'New Secure Note'}</DialogTitle>
            <DialogDescription>
              Store sensitive information securely encrypted
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                placeholder="Recovery codes, API key, etc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.value}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                placeholder="Enter your secure content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="font-mono"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gradient-primary">
                {editNote ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
