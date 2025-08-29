// Local storage for anonymous user votes
const VOTES_STORAGE_KEY = 'cheers-up-user-votes';

export interface LocalVote {
  toastId: string;
  vote: 'like' | 'dislike';
  timestamp: number;
}

export interface LocalVoteStorage {
  votes: Record<string, LocalVote>;
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
