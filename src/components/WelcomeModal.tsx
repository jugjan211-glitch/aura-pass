import { useState, useEffect } from 'react';
import { Shield, Key, Lock, Eye, Share2, Fingerprint, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

const slides = [
  {
    icon: Shield,
    title: 'Welcome to SecureVault',
    description: 'Your all-in-one password manager built with military-grade encryption. Keep your digital life safe and organized.',
    features: [
      '256-bit AES encryption',
      'Zero-knowledge architecture',
      'Cloud sync across devices',
    ],
  },
  {
    icon: Key,
    title: 'How It Works',
    description: 'Generate, store, and manage your passwords effortlessly.',
    features: [
      'Generate strong passwords with one click',
      'Save and organize passwords by category',
      'Auto-fill and quick copy to clipboard',
    ],
  },
  {
    icon: Lock,
    title: 'Security First',
    description: 'Your data is protected with industry-leading security measures.',
    features: [
      'End-to-end encryption on all data',
      'Two-factor authentication (2FA)',
      'Auto-lock vault after inactivity',
      'Breach monitoring for compromised passwords',
    ],
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      setOpen(false);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg glass-strong p-0 overflow-hidden border-primary/20">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header gradient */}
          <div className="gradient-primary p-6 pb-10 md:p-8 md:pb-12 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Icon className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-primary-foreground">{slide.title}</h2>
          </div>

          {/* Content */}
          <div className="p-6 -mt-4">
            <div className="bg-card rounded-xl p-5 border border-border/50 shadow-card">
              <p className="text-muted-foreground text-sm mb-4">{slide.description}</p>
              <ul className="space-y-3">
                {slide.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ChevronRight className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between">
            {/* Dots */}
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? 'w-6 bg-primary'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentSlide < slides.length - 1 && (
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Skip
                </Button>
              )}
              <Button variant="gradient" size="sm" onClick={handleNext} className="gap-1">
                {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
