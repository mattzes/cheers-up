'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pointer } from 'lucide-react';

const FIRST_TIME_KEY = 'cheers-up-first-time';

export default function FirstTimeOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Check if user has seen the overlay before
    const hasSeenOverlay = localStorage.getItem(FIRST_TIME_KEY);

    if (!hasSeenOverlay) {
      // Show overlay after a short delay to let the page load
      const timer = setTimeout(() => {
        setShowOverlay(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowOverlay(false);
    // Mark as seen
    localStorage.setItem(FIRST_TIME_KEY, 'true');
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
            <Pointer className="w-12 h-12 text-primary animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Willkommen bei Cheers Up! 🍻</h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Tippe auf die <strong>Toast-Karte</strong> in der Mitte, um den nächsten Trinkspruch zu sehen.
            </p>

            <div className="bg-muted/50 rounded-lg p-3 mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Tipp:</strong> Du kannst auch die Like/Dislike Buttons verwenden, um deine Favoriten zu markieren.
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-6 flex justify-center">
          <Button onClick={handleDismiss} className="w-full">
            Verstanden!
          </Button>
        </div>
      </div>
    </div>
  );
}
