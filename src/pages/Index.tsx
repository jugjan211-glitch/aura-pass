import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { PasswordGenerator } from '@/components/PasswordGenerator';
import { QuickActionsPanel } from '@/components/QuickActionsPanel';
import { PasswordList } from '@/components/PasswordList';
import { AddPasswordModal } from '@/components/AddPasswordModal';
import { SecurityDashboard } from '@/components/SecurityDashboard';
import { SecureNotes } from '@/components/SecureNotes';
import { BreachChecker } from '@/components/BreachChecker';
import { Footer } from '@/components/Footer';
import { usePasswords, type PasswordEntry } from '@/hooks/usePasswords';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, FileText, ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Index() {
  const { passwords, addPassword, updatePassword, deletePassword, markAsUsed, toggleFavorite } = usePasswords();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('passwords');

  const weakPasswordCount = passwords.filter(p => p.strength === 'weak').length;
  const favoriteCount = passwords.filter(p => p.isFavorite).length;

  const handlePasswordGenerated = useCallback((password: string) => {
    setGeneratedPassword(password);
  }, []);

  const handleAddPassword = useCallback(() => {
    setEditEntry(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((entry: PasswordEntry) => {
    setEditEntry(entry);
    setGeneratedPassword('');
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback((entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'storageType'>) => {
    if (editEntry) {
      updatePassword(editEntry.id, entry);
      toast.success('Password updated successfully');
    } else {
      addPassword(entry);
      toast.success('Password saved to vault');
    }
    setGeneratedPassword('');
  }, [editEntry, addPassword, updatePassword]);

  const handleDelete = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteId) {
      deletePassword(deleteId);
      toast.success('Password deleted');
      setDeleteId(null);
    }
  }, [deleteId, deletePassword]);

  const handleCopy = useCallback((id: string) => {
    markAsUsed(id);
  }, [markAsUsed]);

  return (
    <div className="min-h-screen flex flex-col gradient-hero">
      <Header />
      
      <main className="flex-1">
        <HeroSection />

        {/* Main Content */}
        <section className="container mx-auto px-4 pb-16">
          {/* Generator & Quick Actions */}
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            <PasswordGenerator onPasswordGenerated={handlePasswordGenerated} />
            <QuickActionsPanel 
              onAddPassword={handleAddPassword}
              passwordCount={passwords.length}
              weakPasswordCount={weakPasswordCount}
              favoriteCount={favoriteCount}
            />
          </div>

          {/* Security Dashboard */}
          {passwords.length > 0 && (
            <div className="mb-12">
              <SecurityDashboard passwords={passwords} />
            </div>
          )}

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="glass h-12 p-1 w-full sm:w-auto">
              <TabsTrigger value="passwords" className="gap-2 flex-1 sm:flex-none data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                <Key className="h-4 w-4" />
                Passwords
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2 flex-1 sm:flex-none data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4" />
                Secure Notes
              </TabsTrigger>
              <TabsTrigger value="breach" className="gap-2 flex-1 sm:flex-none data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                <ShieldAlert className="h-4 w-4" />
                Breach Check
              </TabsTrigger>
            </TabsList>

            <TabsContent value="passwords" className="mt-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Your Vault</h2>
              <PasswordList
                passwords={passwords}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFavorite={toggleFavorite}
                onCopy={handleCopy}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <SecureNotes />
            </TabsContent>

            <TabsContent value="breach" className="mt-6">
              <div className="max-w-2xl">
                <BreachChecker />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <Footer />

      {/* Modals */}
      <AddPasswordModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditEntry(null);
        }}
        onSave={handleSave}
        editEntry={editEntry}
        generatedPassword={generatedPassword}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this password? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
