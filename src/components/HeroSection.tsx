import { Shield, Lock, Key, Fingerprint, CheckCircle2 } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-12 md:pt-36 md:pb-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-[500px] md:h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 md:w-72 md:h-72 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-primary/20 text-accent-foreground text-sm font-medium mb-8 animate-fade-in shadow-sm">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            End-to-end encrypted
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-5 md:mb-7 animate-slide-up tracking-tight leading-[1.1]">
            Secure Your{' '}
            <span className="text-gradient">Digital Life</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-muted-foreground mb-8 md:mb-10 animate-fade-in delay-200 max-w-xl mx-auto px-2 leading-relaxed">
            Generate unbreakable passwords, store them safely, and access your vault from anywhere.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 animate-fade-in delay-300">
            {[
              { icon: Shield, label: '256-bit AES', color: 'text-success' },
              { icon: Key, label: 'Zero Knowledge', color: 'text-primary' },
              { icon: Fingerprint, label: 'Biometric Ready', color: 'text-accent-foreground' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2.5 text-muted-foreground glass rounded-full px-4 py-2 border border-border/50">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
