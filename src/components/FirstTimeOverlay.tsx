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

            {/* Miniature card with tapping fingers */}
            <div className="relative mb-3">
              {/* Miniature card */}
              <div className="w-56 h-48 mx-auto bg-card border border-border rounded-lg shadow-sm flex items-center justify-center relative">
                <div className="text-xs text-muted-foreground text-center px-2">Trinkspruch</div>

                {/* Vertical divider line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border"></div>

                {/* Left tapping finger */}
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-2xl">👆</div>

                {/* Left label under finger */}
                <div className="absolute left-2 top-3/4 text-[10px] text-muted-foreground text-center">Vorheriger</div>

                {/* Right tapping finger */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-2xl">👆</div>

                {/* Right label under finger */}
                <div className="absolute right-2 top-3/4 text-[10px] text-muted-foreground text-center">Nächster</div>
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
