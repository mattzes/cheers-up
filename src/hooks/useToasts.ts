import { useState, useEffect, useCallback } from 'react';
import { Toast, ToastWithUserVote } from '@/lib/types';
import { 
  getAllToasts, 
  getRandomToast, 
  getRandomToastFromIds,
  getToastById,
  createToast, 
  updateToastVote, 
  getToastWithUserVote,
} from '@/lib/toastService';
import { 
  getLocalVote, 
  setLocalVote, 
  getUnseenToasts, 
  markToastAsSeen, 
  resetSeenToastsIfAllSeen,
  getAllLocalVotes
} from '@/lib/localVoteStorage';

export type ToastFilter = 'all' | 'liked' | 'popular';

export const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentToast, setCurrentToast] = useState<ToastWithUserVote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<ToastFilter>('all');

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

  // Get filtered toast IDs based on current filter
  const getFilteredToastIds = useCallback((allToasts: Toast[]): string[] => {
    switch (currentFilter) {
      case 'liked':
        const localVotes = getAllLocalVotes();
        return allToasts
          .filter(toast => localVotes[toast.id]?.vote === 'like')
          .map(toast => toast.id);
      
      case 'popular':
        // Sort by likes (descending) and take top 50%
        const sortedByLikes = [...allToasts].sort((a, b) => b.likes - a.likes);
        const topHalf = sortedByLikes.slice(0, Math.ceil(sortedByLikes.length / 2));
        return topHalf.map(toast => toast.id);
      
      case 'all':
      default:
        return allToasts.map(toast => toast.id);
    }
  }, [currentFilter]);

  // Load random toast with unseen logic and filtering
  const loadRandomToast = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get filtered toast IDs
      const filteredToastIds = getFilteredToastIds(toasts);
      
      if (filteredToastIds.length === 0) {
        // No toasts available for current filter
        setCurrentToast(null);
        return;
      }
      
      // Get unseen toast IDs from filtered pool
      const unseenToastIds = getUnseenToasts(filteredToastIds);
      
      // Check if we need to reset seen toasts (all filtered toasts have been seen)
      const wasReset = resetSeenToastsIfAllSeen(filteredToastIds);
      
      let randomToast: Toast | null;
      
      if (unseenToastIds.length > 0) {
        // Get random toast from unseen filtered pool
        randomToast = await getRandomToastFromIds(unseenToastIds);
      } else {
        // Fallback to any random toast from filtered pool
        const randomIndex = Math.floor(Math.random() * filteredToastIds.length);
        const randomToastId = filteredToastIds[randomIndex];
        randomToast = await getToastById(randomToastId);
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
  }, [toasts, currentFilter, getFilteredToastIds]);

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

  // Change filter
  const changeFilter = useCallback((newFilter: ToastFilter) => {
    setCurrentFilter(newFilter);
  }, []);

  // Load initial data
  useEffect(() => {
    loadToasts();
  }, [loadToasts]);

  // Reload toast when filter changes
  useEffect(() => {
    if (toasts.length > 0) {
      loadRandomToast();
    }
  }, [currentFilter, loadRandomToast]);

  return {
    toasts,
    currentToast,
    loading,
    error,
    currentFilter,
    loadToasts,
    loadRandomToast,
    handleVote,
    addToast,
    changeFilter,
  };
};
