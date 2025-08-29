import { useState, useEffect, useCallback } from 'react';
import { Toast, ToastWithUserVote } from '@/lib/types';
import { 
  getAllToasts, 
  getRandomToast, 
  createToast, 
  updateToastVote, 
  getToastWithUserVote,
  initializeSampleData 
} from '@/lib/toastService';

export const useToasts = (userId: string = 'anonymous') => {
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

  // Load random toast
  const loadRandomToast = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const randomToast = await getRandomToast();
      
      if (randomToast) {
        const toastWithVote = await getToastWithUserVote(randomToast.id, userId);
        setCurrentToast(toastWithVote);
      } else {
        setCurrentToast(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load random toast');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Handle like/dislike
  const handleVote = useCallback(async (toastId: string, vote: 'like' | 'dislike' | null) => {
    try {
      setError(null);
      await updateToastVote({ toastId, userId, vote });
      
      // Update current toast if it's the one being voted on
      if (currentToast && currentToast.id === toastId) {
        const updatedToast = await getToastWithUserVote(toastId, userId);
        setCurrentToast(updatedToast);
      }
      
      // Refresh all toasts to get updated counts
      await loadToasts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vote');
    }
  }, [currentToast, userId, loadToasts]);

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

  // Initialize sample data
  const initializeData = useCallback(async () => {
    try {
      setError(null);
      await initializeSampleData();
      await loadToasts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize data');
    }
  }, [loadToasts]);

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
    initializeData,
  };
};
