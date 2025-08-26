'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, RotateCcw, Sun, Moon } from 'lucide-react';

const toasts = [
  "Why don't scientists trust atoms? Because they make up everything!",
  'I told my wife she was drawing her eyebrows too high. She looked surprised.',
  "Why don't eggs tell toasts? They'd crack each other up!",
  'What do you call a fake noodle? An impasta!',
  'Why did the scarecrow win an award? He was outstanding in his field!',
  'What do you call a bear with no teeth? A gummy bear!',
  "Why don't skeletons fight each other? They don't have the guts!",
  "What's the best thing about Switzerland? I don't know, but the flag is a big plus!",
  'Why did the math book look so sad? Because it had too many problems!',
  'What do you call a sleeping bull? A bulldozer!',
];

export default function ToastApp() {
  const [currentToastIndex, setCurrentToastIndex] = useState(0);
  const [likedToasts, setLikedToasts] = useState<Set<number>>(new Set());
  const [dislikedToasts, setDislikedToasts] = useState<Set<number>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const currentToast = toasts[currentToastIndex];

  const handleLike = () => {
    const newLiked = new Set(likedToasts);
    const newDisliked = new Set(dislikedToasts);

    if (likedToasts.has(currentToastIndex)) {
      newLiked.delete(currentToastIndex);
    } else {
      newLiked.add(currentToastIndex);
      newDisliked.delete(currentToastIndex);
    }

    setLikedToasts(newLiked);
    setDislikedToasts(newDisliked);
  };

  const handleDislike = () => {
    const newLiked = new Set(likedToasts);
    const newDisliked = new Set(dislikedToasts);

    if (dislikedToasts.has(currentToastIndex)) {
      newDisliked.delete(currentToastIndex);
    } else {
      newDisliked.add(currentToastIndex);
      newLiked.delete(currentToastIndex);
    }

    setLikedToasts(newLiked);
    setDislikedToasts(newDisliked);
  };

  const handleNextToast = () => {
    setCurrentToastIndex(prev => (prev + 1) % toasts.length);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const isLiked = likedToasts.has(currentToastIndex);
  const isDisliked = dislikedToasts.has(currentToastIndex);

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10" /> {/* Spacer for centering */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">😄 Toast App</h1>
              <p className="text-muted-foreground">
                Toast {currentToastIndex + 1} of {toasts.length}
              </p>
            </div>
            {/* Dark mode toggle button */}
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="w-10 h-10" aria-label="Toggle dark mode">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Toast Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <p className="text-lg leading-relaxed text-center text-balance">{currentToast}</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Like/Dislike Buttons */}
          <div className="flex gap-4 justify-center">
            <Button variant={isLiked ? 'default' : 'outline'} size="lg" onClick={handleLike} className="flex-1 gap-2">
              <ThumbsUp className="w-5 h-5" />
              Like
            </Button>
            <Button
              variant={isDisliked ? 'destructive' : 'outline'}
              size="lg"
              onClick={handleDislike}
              className="flex-1 gap-2">
              <ThumbsDown className="w-5 h-5" />
              Dislike
            </Button>
          </div>

          {/* Next Toast Button */}
          <Button onClick={handleNextToast} size="lg" className="w-full gap-2" variant="secondary">
            <RotateCcw className="w-5 h-5" />
            Next Toast
          </Button>
        </div>

        {/* Stats */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Liked: {likedToasts.size} toasts</p>
          <p>Disliked: {dislikedToasts.size} toasts</p>
        </div>
      </div>
    </div>
  );
}
