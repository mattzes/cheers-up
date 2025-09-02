'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Sun, Moon, Plus, X, AlertCircle } from 'lucide-react';
import { useToasts } from '@/hooks/useToasts';
import { getUnseenToastsForFilter, getAllLocalVotes } from '@/lib/localVoteStorage';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import FirstTimeOverlay from '@/components/FirstTimeOverlay';
import PWAInstallOverlay from '@/components/PWAInstallOverlay';

signInAnonymously(auth)
  .then(() => {
    console.log('Signed in anonymously');
  })
  .catch(error => {
    console.error('Anonymous sign-in error:', error);
  });

export default function ToastApp() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showAddToast, setShowAddToast] = useState(false);
  const [newToastText, setNewToastText] = useState('');
  const [newToastCreator, setNewToastCreator] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    toasts,
    currentToast,
    loading,
    error,
    currentFilter,
    toastHistory,
    loadRandomToast,
    loadNextRandomToast,
    loadPreviousToast,
    handleVote,
    addToast,
    changeFilter,
  } = useToasts();

  useEffect(() => {
    signInAnonymously(auth)
      .then(() => {
        console.log('Signed in anonymously');
      })
      .catch(error => {
        console.error('Anonymous sign-in error:', error);
      });
  }, []);

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

  // Load random toast on mount after toasts are loaded
  useEffect(() => {
    if (toasts.length > 0 && !currentToast) {
      loadRandomToast();
    }
  }, [toasts.length, currentToast, loadRandomToast]);

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
    loadNextRandomToast();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleAddToast = async () => {
    if (newToastText.trim()) {
      try {
        await addToast(newToastText.trim(), newToastCreator.trim() || undefined);
        setNewToastText('');
        setNewToastCreator('');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setShowAddToast(false);
        }, 2500);
      } catch (error) {
        console.error('Failed to add toast:', error);
      }
    }
  };

  const isLiked = currentToast?.userVote === 'like';
  const isDisliked = currentToast?.userVote === 'dislike';

  // Calculate unseen toasts count for current filter
  const getFilteredToastIds = (): string[] => {
    switch (currentFilter) {
      case 'liked':
        const localVotes = getAllLocalVotes();
        return toasts.filter(toast => localVotes[toast.id]?.vote === 'like').map(toast => toast.id);

      case 'top25':
        // Sort by likes (descending) and take top 25, or all with at least 1 like if less than 25
        const sortedByLikes = [...toasts].sort((a, b) => b.likes - a.likes);
        const toastsWithLikes = sortedByLikes.filter(toast => toast.likes > 0);
        const top25 = toastsWithLikes.slice(0, 25);
        return top25.map(toast => toast.id);

      case 'all':
      default:
        return toasts.map(toast => toast.id);
    }
  };

  const filteredToastIds = getFilteredToastIds();
  const unseenToastsCount = getUnseenToastsForFilter(currentFilter, filteredToastIds).length;

  return (
    <div className="pt-10 pb-14 pl-4 pr-4 flex flex-col w-screen max-w-[600px] h-dvh max-h-[900px] justify-self-center space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between text-center">
        {/* Add toast button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowAddToast(!showAddToast)}
          className="w-10 h-10"
          aria-label={showAddToast ? 'Cancel adding toast' : 'Add new toast'}>
          {showAddToast ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cheers Up 🍻</h1>
          <p className="text-muted-foreground mt-2">
            {toasts.length > 0 ? `${filteredToastIds.length} Trinksprüche verfügbar` : 'Keine Trinksprüche verfügbar'}
          </p>
          {toasts.length > 0 && <p className="text-xs text-muted-foreground">{`${unseenToastsCount} ungesehen`}</p>}
        </div>
        {/* Dark mode toggle button */}
        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="w-10 h-10" aria-label="Toggle dark mode">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
      {/* Conditional Render: Add Toast Section OR Toast Card with Actions */}
      {showAddToast ? (
        /* Add Toast Section */
        <>
          <div className="flex-grow flex items-center justify-center">
            <Card className="shadow-lg flex items-center justify-center w-full h-full max-h-102">
              {showSuccess ? (
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">Erfolgreich!</h3>
                  <p className="text-muted-foreground">Trinkspruch hinzugefügt</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-center">Neuen Trinkspruch hinzufügen</h3>
                  <CardContent className="flex flex-grow w-full flex-col justify-center">
                    <Textarea
                      value={newToastText}
                      onChange={e => setNewToastText(e.target.value)}
                      placeholder="Trinkspruch eingeben..."
                      className="resize-none bg-transparent text-center text-lg h-full"
                      maxLength={300}
                      aria-label="Toast text input"
                    />
                    <input
                      type="text"
                      value={newToastCreator}
                      onChange={e => setNewToastCreator(e.target.value)}
                      placeholder="Dein Name (optional)"
                      className="mt-4 mb-2 px-3 py-2 border rounded-md w-full text-center bg-transparent text-base"
                      maxLength={30}
                      aria-label="Creator name input"
                    />
                  </CardContent>
                </>
              )}
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <Button variant="outline" size="lg" onClick={() => setShowAddToast(false)} className="flex-1 gap-2">
                Abbrechen
              </Button>
              <Button
                onClick={handleAddToast}
                disabled={!newToastText.trim()}
                variant="default"
                size="lg"
                className="flex-1 gap-2">
                Hinzufügen
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Toast Card with Action Buttons */
        <>
          {/* Filter Buttons */}
          <div className="flex gap-2 justify-center mb-4">
            <Button
              variant={currentFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeFilter('all')}
              className="flex-1">
              Alle
            </Button>
            <Button
              variant={currentFilter === 'liked' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeFilter('liked')}
              className="flex-1">
              ❤️ Liked
            </Button>
            <Button
              variant={currentFilter === 'top25' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeFilter('top25')}
              className="flex-1">
              🔥 Top 25
            </Button>
          </div>

          <div className="flex-grow flex items-center justify-center relative">
            {/* Left half - Previous toast */}
            <div
              className={`absolute left-0 top-0 w-1/2 h-full`}
              onClick={currentToast && toastHistory.length > 1 ? loadPreviousToast : undefined}
              title={toastHistory.length > 1 ? 'Click to go back' : ''}
            />

            {/* Right half - Next toast */}
            <div
              className={`absolute right-0 top-0 w-1/2 h-full`}
              onClick={currentToast ? handleNextToast : undefined}
              title="Click for next toast"
            />
            <Card className="shadow-lg flex items-center justify-center w-full h-full max-h-90">
              <CardContent className="flex flex-grow flex-col justify-center">
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : !currentToast ? (
                  <div className="text-center">
                    {currentFilter === 'liked' ? (
                      <p className="text-muted-foreground">Du hast noch keinen Trinkspruch geliked.</p>
                    ) : currentFilter === 'top25' ? (
                      <p className="text-muted-foreground">Es wurden noch keine Trinksprüche geliked.</p>
                    ) : (
                      <p className="text-muted-foreground">Keine Trinksprüche verfügbar.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg leading-relaxed text-center text-balance">{currentToast.text}</p>
                  </div>
                )}
              </CardContent>
              {loading || !currentToast ? null : (
                <div className="text-center text-sm text-muted-foreground">
                  <p>Erstellt von: {currentToast.createdBy}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Like/Dislike Buttons */}
            {currentToast ? (
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
            ) : (
              <div className="flex gap-4 justify-center">
                <Button variant="outline" size="lg" onClick={handleNextToast} className="flex-1 gap-2">
                  Erneut versuchen
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* First Time User Overlay */}
      <FirstTimeOverlay />

      {/* PWA Install Overlay */}
      <PWAInstallOverlay />
    </div>
  );
}
