// Local storage for anonymous user votes
const VOTES_STORAGE_KEY = 'cheers-up-user-votes';
const SEEN_TOASTS_STORAGE_KEY = 'cheers-up-seen-toasts';
const SEEN_TOASTS_ALL_STORAGE_KEY = 'cheers-up-seen-toasts-all';
const SEEN_TOASTS_LIKED_STORAGE_KEY = 'cheers-up-seen-toasts-liked';
const SEEN_TOASTS_POPULAR_STORAGE_KEY = 'cheers-up-seen-toasts-popular';

// Helper function to safely check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.localStorage !== undefined;
  } catch {
    return false;
  }
};

export interface LocalVote {
  toastId: string;
  vote: 'like' | 'dislike';
  timestamp: number;
}

export interface LocalVoteStorage {
  votes: Record<string, LocalVote>;
  lastUpdated: number;
}

export interface SeenToastsStorage {
  seenToastIds: Set<string>;
  lastUpdated: number;
}

// Get votes from localStorage
export const getLocalVotes = (): LocalVoteStorage => {
  if (!isLocalStorageAvailable()) {
    return {
      votes: {},
      lastUpdated: Date.now()
    };
  }
  
  try {
    const stored = localStorage.getItem(VOTES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load local votes:', error);
  }
  
  return {
    votes: {},
    lastUpdated: Date.now()
  };
};

// Save votes to localStorage
export const saveLocalVotes = (votes: LocalVoteStorage): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  try {
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes));
  } catch (error) {
    console.warn('Failed to save local votes:', error);
  }
};

// Get user vote for a specific toast
export const getLocalVote = (toastId: string): 'like' | 'dislike' | null => {
  const storage = getLocalVotes();
  const vote = storage.votes[toastId];
  return vote ? vote.vote : null;
};

// Set user vote for a specific toast
export const setLocalVote = (toastId: string, vote: 'like' | 'dislike' | null): void => {
  const storage = getLocalVotes();
  
  if (vote === null) {
    // Remove vote
    delete storage.votes[toastId];
  } else {
    // Set vote
    storage.votes[toastId] = {
      toastId,
      vote,
      timestamp: Date.now()
    };
  }
  
  storage.lastUpdated = Date.now();
  saveLocalVotes(storage);
};

// Get all local votes
export const getAllLocalVotes = (): Record<string, LocalVote> => {
  return getLocalVotes().votes;
};

// Clear all local votes (for testing/debugging)
export const clearLocalVotes = (): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  try {
    localStorage.removeItem(VOTES_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear local votes:', error);
  }
};

// Seen toasts management - Legacy function for backward compatibility
export const getSeenToasts = (): Set<string> => {
  if (!isLocalStorageAvailable()) {
    return new Set<string>();
  }
  
  try {
    const stored = localStorage.getItem(SEEN_TOASTS_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return new Set(data.seenToastIds || []);
    }
  } catch (error) {
    console.warn('Failed to load seen toasts:', error);
  }
  
  return new Set<string>();
};

// Get seen toasts for a specific filter
export const getSeenToastsForFilter = (filter: 'all' | 'liked' | 'top25'): Set<string> => {
  if (!isLocalStorageAvailable()) {
    return new Set<string>();
  }
  
  const storageKey = getStorageKeyForFilter(filter);
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      return new Set(data.seenToastIds || []);
    }
  } catch (error) {
    console.warn(`Failed to load seen toasts for filter ${filter}:`, error);
  }
  
  return new Set<string>();
};

// Get storage key for a specific filter
const getStorageKeyForFilter = (filter: 'all' | 'liked' | 'top25'): string => {
  switch (filter) {
    case 'all':
      return SEEN_TOASTS_ALL_STORAGE_KEY;
    case 'liked':
      return SEEN_TOASTS_LIKED_STORAGE_KEY;
    case 'top25':
      return SEEN_TOASTS_POPULAR_STORAGE_KEY;
    default:
      return SEEN_TOASTS_ALL_STORAGE_KEY;
  }
};

export const saveSeenToasts = (seenToastIds: Set<string>): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  try {
    const data = {
      seenToastIds: Array.from(seenToastIds),
      lastUpdated: Date.now()
    };
    localStorage.setItem(SEEN_TOASTS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save seen toasts:', error);
  }
};

// Save seen toasts for a specific filter
export const saveSeenToastsForFilter = (filter: 'all' | 'liked' | 'top25', seenToastIds: Set<string>): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  const storageKey = getStorageKeyForFilter(filter);
  try {
    const data = {
      seenToastIds: Array.from(seenToastIds),
      lastUpdated: Date.now()
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save seen toasts for filter ${filter}:`, error);
  }
};

export const markToastAsSeen = (toastId: string): void => {
  const seenToasts = getSeenToasts();
  seenToasts.add(toastId);
  saveSeenToasts(seenToasts);
};

// Mark toast as seen for a specific filter
export const markToastAsSeenForFilter = (filter: 'all' | 'liked' | 'top25', toastId: string): void => {
  const seenToasts = getSeenToastsForFilter(filter);
  seenToasts.add(toastId);
  saveSeenToastsForFilter(filter, seenToasts);
};

export const clearSeenToasts = (): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  try {
    localStorage.removeItem(SEEN_TOASTS_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear seen toasts:', error);
  }
};

// Clear seen toasts for a specific filter
export const clearSeenToastsForFilter = (filter: 'all' | 'liked' | 'top25'): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  const storageKey = getStorageKeyForFilter(filter);
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn(`Failed to clear seen toasts for filter ${filter}:`, error);
  }
};

// Clear all seen toasts for all filters
export const clearAllSeenToasts = (): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  try {
    localStorage.removeItem(SEEN_TOASTS_STORAGE_KEY);
    localStorage.removeItem(SEEN_TOASTS_ALL_STORAGE_KEY);
    localStorage.removeItem(SEEN_TOASTS_LIKED_STORAGE_KEY);
    localStorage.removeItem(SEEN_TOASTS_POPULAR_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear all seen toasts:', error);
  }
};

export const getUnseenToasts = (allToastIds: string[]): string[] => {
  const seenToasts = getSeenToasts();
  return allToastIds.filter(id => !seenToasts.has(id));
};

// Get unseen toasts for a specific filter
export const getUnseenToastsForFilter = (filter: 'all' | 'liked' | 'top25', allToastIds: string[]): string[] => {
  const seenToasts = getSeenToastsForFilter(filter);
  return allToastIds.filter(id => !seenToasts.has(id));
};

export const resetSeenToastsIfAllSeen = (allToastIds: string[]): boolean => {
  const unseenToasts = getUnseenToasts(allToastIds);
  
  if (unseenToasts.length === 0 && allToastIds.length > 0) {
    // All toasts have been seen, reset the seen list
    clearSeenToasts();
    return true;
  }
  
  return false;
};

// Reset seen toasts for a specific filter if all toasts have been seen
export const resetSeenToastsIfAllSeenForFilter = (filter: 'all' | 'liked' | 'top25', allToastIds: string[]): boolean => {
  const unseenToasts = getUnseenToastsForFilter(filter, allToastIds);
  
  if (unseenToasts.length === 0 && allToastIds.length > 0) {
    // All toasts have been seen for this filter, reset the seen list
    clearSeenToastsForFilter(filter);
    return true;
  }
  
  return false;
};
