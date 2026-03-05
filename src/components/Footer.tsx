import { Shield, Lock, Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground tracking-tight">SecureVault</span>
              <p className="text-xs text-muted-foreground">Your passwords, protected.</p>
            </div>
          </div>

          {/* Security message */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground glass rounded-full px-4 py-2">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>All data is encrypted and stored securely</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-3">
            <a href="#" className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} SecureVault. Built with security in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}
