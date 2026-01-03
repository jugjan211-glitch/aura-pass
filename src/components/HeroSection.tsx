import { Shield, Lock, Key, Fingerprint } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-accent-foreground text-sm font-medium mb-6 animate-fade-in">
            <Lock className="h-4 w-4" />
            End-to-end encrypted
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up">
            Secure Your{' '}
            <span className="text-gradient">Digital Life</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in delay-200 max-w-2xl mx-auto">
            Generate unbreakable passwords, store them safely, and access your vault from anywhere. 
            Your security starts here.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 animate-fade-in delay-300">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-success" />
              </div>
              <span className="text-sm">256-bit AES</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Zero Knowledge</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Fingerprint className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-sm">Biometric Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
