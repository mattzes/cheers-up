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
          <div className="space-y-2">
            <h3 className="text-lg mb-8 mt-4 font-semibold text-foreground">Willkommen bei Cheers Up! 🍻</h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Tippe auf die <strong>Trinkspruch-Karte</strong> in der Mitte, um den nächsten Trinkspruch zu sehen.
            </p>

            {/* Miniature card with tapping fingers */}
            <div className="relative mb-3">
              {/* Miniature card */}
              <div className="w-56 h-48 mx-auto bg-card border border-border rounded-lg shadow-sm flex items-center justify-center relative">
                <div className="text-xs mt-8text-muted-foreground text-center px-2">Trinkspruch</div>

                {/* Finger above center to keep text readable */}
                <div className="absolute left-1/2 top-[35%] transform -translate-x-1/2 -translate-y-1/2">
                  <Pointer className="w-8 h-8 text-primary animate-bounce" />
                </div>
              </div>
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
