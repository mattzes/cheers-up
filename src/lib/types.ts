export interface Toast {
  id: string;
  text: string;
  likes: number;
  dislikes: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Vote summary for quick access
  voteSummary?: {
    totalVotes: number;
    lastVoteAt?: Date;
  };
}

export interface ToastWithUserVote extends Toast {
  userVote?: 'like' | 'dislike' | null;
}

export interface CreateToastData {
  text: string;
  createdBy?: string;
}

export interface UpdateToastVoteData {
  toastId: string;
  userId: string;
  vote: 'like' | 'dislike' | null;
}

// Individual vote record (for audit trail if needed)
export interface VoteRecord {
  id: string;
  toastId: string;
  userId: string;
  vote: 'like' | 'dislike';
  createdAt: Date;
}
