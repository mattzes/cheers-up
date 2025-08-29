// Local storage for anonymous user votes
const VOTES_STORAGE_KEY = 'cheers-up-user-votes';
const SEEN_TOASTS_STORAGE_KEY = 'cheers-up-seen-toasts';

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
  try {
    localStorage.removeItem(VOTES_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear local votes:', error);
  }
};

// Seen toasts management
export const getSeenToasts = (): Set<string> => {
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

export const saveSeenToasts = (seenToastIds: Set<string>): void => {
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

export const markToastAsSeen = (toastId: string): void => {
  const seenToasts = getSeenToasts();
  seenToasts.add(toastId);
  saveSeenToasts(seenToasts);
};

export const clearSeenToasts = (): void => {
  try {
    localStorage.removeItem(SEEN_TOASTS_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear seen toasts:', error);
  }
};

export const getUnseenToasts = (allToastIds: string[]): string[] => {
  const seenToasts = getSeenToasts();
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
