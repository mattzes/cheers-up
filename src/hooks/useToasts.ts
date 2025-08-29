import { useState, useEffect, useCallback } from 'react';
import { Toast, ToastWithUserVote } from '@/lib/types';
import { 
  getAllToasts, 
  getRandomToast, 
  getRandomToastFromIds,
  createToast, 
  updateToastVote, 
  getToastWithUserVote,
} from '@/lib/toastService';
import { 
  getLocalVote, 
  setLocalVote, 
  getUnseenToasts, 
  markToastAsSeen, 
  resetSeenToastsIfAllSeen 
} from '@/lib/localVoteStorage';

export const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentToast, setCurrentToast] = useState<ToastWithUserVote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all toasts
  const loadToasts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedToasts = await getAllToasts();
      setToasts(fetchedToasts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load toasts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load random toast with unseen logic
  const loadRandomToast = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all toast IDs
      const allToastIds = toasts.map(toast => toast.id);
      
      if (allToastIds.length === 0) {
        // No toasts available
        setCurrentToast(null);
        return;
      }
      
      // Check if we need to reset seen toasts (all have been seen)
      const wasReset = resetSeenToastsIfAllSeen(allToastIds);
      
      // Get unseen toast IDs
      const unseenToastIds = getUnseenToasts(allToastIds);
      
      let randomToast: Toast | null;
      
      if (unseenToastIds.length > 0) {
        // Get random toast from unseen pool
        randomToast = await getRandomToastFromIds(unseenToastIds);
      } else {
        // Fallback to any random toast (shouldn't happen after reset)
        randomToast = await getRandomToast();
      }
      
      if (randomToast) {
        // Mark this toast as seen
        markToastAsSeen(randomToast.id);
        
        // Get local vote for this toast
        const localVote = getLocalVote(randomToast.id);
        
        // Create ToastWithUserVote object with local vote
        const toastWithVote: ToastWithUserVote = {
          ...randomToast,
          userVote: localVote
        };
        
        setCurrentToast(toastWithVote);
      } else {
        setCurrentToast(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load random toast');
    } finally {
      setLoading(false);
    }
  }, [toasts]);

  // Handle like/dislike with local storage
  const handleVote = useCallback(async (toastId: string, vote: 'like' | 'dislike' | null) => {
    try {
      setError(null);
      
      // Update local storage first
      setLocalVote(toastId, vote);
      
      // Update Firebase vote counts (without user tracking)
      await updateToastVote({ toastId, vote });
      
      // Update current toast if it's the one being voted on
      if (currentToast && currentToast.id === toastId) {
        const updatedToast: ToastWithUserVote = {
          ...currentToast,
          userVote: vote,
          likes: vote === 'like' 
            ? (currentToast.userVote === 'like' ? currentToast.likes : currentToast.likes + 1)
            : (currentToast.userVote === 'like' ? currentToast.likes - 1 : currentToast.likes),
          dislikes: vote === 'dislike'
            ? (currentToast.userVote === 'dislike' ? currentToast.dislikes : currentToast.dislikes + 1)
            : (currentToast.userVote === 'dislike' ? currentToast.dislikes - 1 : currentToast.dislikes)
        };
        setCurrentToast(updatedToast);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vote');
    }
  }, [currentToast]);

  // Create new toast
  const addToast = useCallback(async (text: string, createdBy?: string) => {
    try {
      setError(null);
      const newToast = await createToast({ text, createdBy });
      setToasts(prev => [newToast, ...prev]);
      return newToast;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create toast');
      throw err;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadToasts();
  }, [loadToasts]);

  return {
    toasts,
    currentToast,
    loading,
    error,
    loadToasts,
    loadRandomToast,
    handleVote,
    addToast,
  };
};
