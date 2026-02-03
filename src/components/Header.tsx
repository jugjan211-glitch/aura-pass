import { Shield, Sun, Moon, Zap, LogIn, Menu, X, Palette, User, LogOut, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useThemeContext, type Theme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { useState } from 'react';
import { AuthModal } from './AuthModal';
import { toast } from 'sonner';

export function Header() {
  const { theme, setTheme, setIsCustomizing } = useThemeContext();
  const { user, signOut } = useAuth();
  const { lock } = useSecurity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const themeIcon: Record<Theme, React.ReactNode> = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    amoled: <Zap className="h-4 w-4" />,
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  const handleLock = () => {
    lock();
    toast.success('Vault locked');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">SecureVault</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">Password Manager</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {/* Theme Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                    {themeIcon[theme]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('amoled')} className="gap-2">
                    <Zap className="h-4 w-4" />
                    AMOLED
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Customize Button */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsCustomizing(true)}
              >
                <Palette className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-2" />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                        <User className="h-3 w-3 text-primary-foreground" />
                      </div>
                      <span className="max-w-24 truncate">{user.email?.split('@')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLock} className="gap-2">
                      <Lock className="h-4 w-4" />
                      Lock Vault
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setAuthModalOpen(true)}>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-border animate-fade-in">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex-1"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex-1"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'amoled' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('amoled')}
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  AMOLED
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => {
                  setIsCustomizing(true);
                  setMobileMenuOpen(false);
                }}
              >
                <Palette className="h-4 w-4" />
                Customize Appearance
              </Button>

              {user ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground text-center truncate px-2">
                    {user.email}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        handleLock();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Lock className="h-4 w-4" />
                      Lock
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="default" 
                  className="w-full gap-2"
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
