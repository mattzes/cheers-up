'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, RotateCcw, Sun, Moon, Plus, AlertCircle } from 'lucide-react';
import { useToasts } from '@/hooks/useToasts';

export default function ToastApp() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showAddToast, setShowAddToast] = useState(false);
  const [newToastText, setNewToastText] = useState('');

  const { toasts, currentToast, loading, error, loadRandomToast, handleVote, addToast, initializeData } = useToasts();

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

  // Load random toast on mount
  useEffect(() => {
    loadRandomToast();
  }, [loadRandomToast]);

  const handleLike = () => {
    if (currentToast) {
      const newVote = currentToast.userVote === 'like' ? null : 'like';
      handleVote(currentToast.id, newVote);
    }
  };

  const handleDislike = () => {
    if (currentToast) {
      const newVote = currentToast.userVote === 'dislike' ? null : 'dislike';
      handleVote(currentToast.id, newVote);
    }
  };

  const handleNextToast = () => {
    loadRandomToast();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleAddToast = async () => {
    if (newToastText.trim()) {
      try {
        await addToast(newToastText.trim());
        setNewToastText('');
        setShowAddToast(false);
      } catch (error) {
        console.error('Failed to add toast:', error);
      }
    }
  };

  const handleInitializeData = async () => {
    try {
      await initializeData();
      loadRandomToast();
    } catch (error) {
      console.error('Failed to initialize data:', error);
    }
  };

  const isLiked = currentToast?.userVote === 'like';
  const isDisliked = currentToast?.userVote === 'dislike';

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between">
            {/* Add toast button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAddToast(!showAddToast)}
              className="w-10 h-10"
              aria-label={showAddToast ? 'Cancel adding toast' : 'Add new toast'}>
              <Plus className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cheers Up 🍻</h1>
              <p className="text-muted-foreground">
                {toasts.length > 0 ? `${toasts.length} toasts available` : 'No toasts available'}
              </p>
            </div>
            {/* Dark mode toggle button */}
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="w-10 h-10" aria-label="Toggle dark mode">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Toast Card */}
        <Card className="shadow-lg mt-16 mb-16  flex items-center justify-center">
          <div onClick={handleNextToast}>
            <CardContent className="h-72 flex flex-col justify-center">
              {loading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : currentToast ? (
                <div className="space-y-4">
                  <p className="text-lg leading-relaxed text-center text-balance">{currentToast.text}</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">No toasts available</p>
                  <Button onClick={handleInitializeData} variant="outline">
                    Initialize Sample Data
                  </Button>
                </div>
              )}
            </CardContent>
            {currentToast && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Created by: {currentToast.createdBy}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Add Toast Section */}
        {showAddToast && (
          <Card className="shadow-lg">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <h3 className="text-lg font-semibold">Add New Toast</h3>
              <Textarea
                value={newToastText}
                onChange={e => setNewToastText(e.target.value)}
                placeholder="Enter your toast text..."
                className="resize-none h-24 text-base"
                maxLength={500}
                aria-label="Toast text input"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleAddToast}
                  disabled={!newToastText.trim()}
                  className="flex-1 h-12 text-base font-medium">
                  Add Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddToast(false)}
                  className="flex-1 h-12 text-base font-medium">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Like/Dislike Buttons */}
          {currentToast && (
            <div className="flex gap-4 justify-center">
              <Button variant={isLiked ? 'default' : 'outline'} size="lg" onClick={handleLike} className="flex-1 gap-2">
                <ThumbsUp className="w-5 h-5" />
                {currentToast.likes}
              </Button>
              <Button
                variant={isDisliked ? 'default' : 'outline'}
                size="lg"
                onClick={handleDislike}
                className="flex-1 gap-2">
                <ThumbsDown className="w-5 h-5" />
                {currentToast.dislikes}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
