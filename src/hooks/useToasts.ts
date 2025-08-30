import { useState, useEffect, useCallback } from 'react';
import { Toast, ToastWithUserVote } from '@/lib/types';
import { 
  getAllToasts, 
  getRandomToastFromIds,
  getToastById,
  createToast, 
  updateToastVote,
} from '@/lib/toastService';
import { 
  getLocalVote, 
  setLocalVote, 
  getUnseenToastsForFilter, 
  markToastAsSeenForFilter, 
  resetSeenToastsIfAllSeenForFilter,
  getAllLocalVotes
} from '@/lib/localVoteStorage';

export type ToastFilter = 'all' | 'liked' | 'top25';

export const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentToast, setCurrentToast] = useState<ToastWithUserVote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<ToastFilter>('all');
  const [localVotesVersion, setLocalVotesVersion] = useState(0);
  const [seenToastsResetVersion, setSeenToastsResetVersion] = useState(0);

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
      
      case 'top25':
        // Sort by likes (descending) and take top 25, or all with at least 1 like if less than 25
        const sortedByLikes = [...allToasts].sort((a, b) => b.likes - a.likes);
        const toastsWithLikes = sortedByLikes.filter(toast => toast.likes > 0);
        const top25 = toastsWithLikes.slice(0, 25);
        return top25.map(toast => toast.id);
      
      case 'all':
      default:
        return allToasts.map(toast => toast.id);
    }
  }, [currentFilter]);

  // Internal function to load random toast (without marking as seen)
  const loadRandomToastInternal = useCallback(async () => {
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
      
      // Get unseen toast IDs from filtered pool for current filter
      let unseenToastIds = getUnseenToastsForFilter(currentFilter, filteredToastIds);

      // If all toasts have been seen, reset the seen list for this filter
      if (unseenToastIds.length === 0 && filteredToastIds.length > 0) {
        resetSeenToastsIfAllSeenForFilter(currentFilter, filteredToastIds);
        unseenToastIds = getUnseenToastsForFilter(currentFilter, filteredToastIds);
        setSeenToastsResetVersion(prev => prev + 1);
      }

      let randomToast: Toast | null;
      
      if (unseenToastIds.length > 0) {
        // Get random toast from unseen filtered pool
        randomToast = await getRandomToastFromIds(unseenToastIds);
      } else {
        // Fallback to any random toast from filtered pool (should not happen after reset)
        const randomIndex = Math.floor(Math.random() * filteredToastIds.length);
        const randomToastId = filteredToastIds[randomIndex];
        randomToast = await getToastById(randomToastId);
      }
      
      if (randomToast) {
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
  }, [toasts, currentFilter, getFilteredToastIds, seenToastsResetVersion]);

  // Mark current toast as seen and load next random toast
  const loadNextRandomToast = useCallback(async () => {
    // Mark current toast as seen before loading next one
    if (currentToast) {
      markToastAsSeenForFilter(currentFilter, currentToast.id);
    }
    
    // Call the internal loadRandomToast logic directly
    await loadRandomToastInternal();
  }, [currentToast, currentFilter, loadRandomToastInternal]);

  // Load random toast with unseen logic and filtering (public API)
  const loadRandomToast = useCallback(async () => {
    await loadRandomToastInternal();
  }, [loadRandomToastInternal]);

  // Handle like/dislike with local storage
  const handleVote = useCallback(async (toastId: string, vote: 'like' | 'dislike' | null) => {
    try {
      setError(null);
      
      // Get the previous vote before updating
      const previousVote = getLocalVote(toastId);
      
      // Update local storage first
      setLocalVote(toastId, vote);
      
      // Update Firebase vote counts with previous vote consideration
      await updateToastVote({ toastId, vote, previousVote });
      
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
      
      // Reload toasts if we're in a filter that depends on vote counts
      if (currentFilter === 'liked' || currentFilter === 'top25') {
        // Use setTimeout to avoid blocking the UI update
        setTimeout(() => {
          setLocalVotesVersion(prev => prev + 1);
        }, 100);
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
    
    // If switching to liked or top25 filter, reload toasts to get fresh data
    if (newFilter === 'liked' || newFilter === 'top25') {
      setLocalVotesVersion(prev => prev + 1);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadToasts();
  }, [loadToasts]);

  // Reload toasts when local votes change (for liked filter)
  useEffect(() => {
    if (localVotesVersion > 0) {
      loadToasts();
    }
  }, [localVotesVersion, loadToasts]);

  // Reload toast when filter changes
  useEffect(() => {
    if (toasts.length > 0) {
      loadRandomToastInternal();
    }
  }, [currentFilter, localVotesVersion, seenToastsResetVersion, loadRandomToastInternal]);

  return {
    toasts,
    currentToast,
    loading,
    error,
    currentFilter,
    loadToasts,
    loadRandomToast,
    loadNextRandomToast,
    handleVote,
    addToast,
    changeFilter,
  };
};
