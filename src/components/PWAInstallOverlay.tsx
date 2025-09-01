'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share2, Smartphone, ArrowRight } from 'lucide-react';

// Extend Navigator interface for iOS standalone mode
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// Interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: string }>;
  userChoice: Promise<{ outcome: string }>;
}

export default function PWAInstallOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Detect Safari on iOS
    const detectSafari = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      return isIOS && isSafari;
    };

    setIsSafari(detectSafari());

    // Check if the app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (!isInstalled) {
      // Show overlay after a short delay to let the page load
      const timer = setTimeout(() => {
        setShowOverlay(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Listen for the beforeinstallprompt event to capture the prompt (Chrome only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
      }

      setDeferredPrompt(null);
      setShowOverlay(false);
    } else {
      // Fallback: Show instructions if no prompt is available
      alert('Bitte installiere die App über das Menü deines Browsers (drei Punkte → "App installieren")');
      setShowOverlay(false);
    }
  };

  const handleDismiss = () => {
    setShowOverlay(false);
  };

  if (!showOverlay) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 max-w-sm rounded-lg bg-background/95 p-6 shadow-lg border border-border">
        {/* Content */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {isSafari ? (
              <Smartphone className="w-12 h-12 text-primary animate-pulse" />
            ) : (
              <Download className="w-12 h-12 text-primary animate-pulse" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">App installieren 📱</h3>

            {isSafari ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Füge Cheers Up zu deinem Startbildschirm hinzu für eine App-ähnliche Erfahrung.
                </p>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                      1
                    </span>
                    <span>
                      Tippe auf das <Share2 className="w-4 h-4 inline" /> Teilen-Symbol
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 mx-auto text-primary" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                      2
                    </span>
                    <span>Wähle &quot;Zum Startbildschirm hinzufügen&quot;</span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Tipp:</strong> Das Teilen-Symbol findest du in der unteren Leiste von Safari.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Installiere Cheers Up als App auf deinem Gerät für eine bessere Erfahrung und Offline-Funktionalität.
                </p>

                <div className="bg-muted/50 rounded-lg p-3 mt-4">
                  <p className="text-xs text-muted-foreground">
                    <strong>Vorteile:</strong> Schnellerer Zugriff, Offline-Nutzung und App-ähnliches Gefühl.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          <Button onClick={handleDismiss} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Abbrechen
          </Button>
          {!isSafari && (
            <Button onClick={handleInstall} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Installieren
            </Button>
          )}
          {isSafari && (
            <Button onClick={handleDismiss} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Verstanden
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
