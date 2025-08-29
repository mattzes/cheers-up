import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  increment,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Toast, CreateToastData, UpdateToastVoteData, ToastWithUserVote, VoteRecord } from './types';

const TOASTS_COLLECTION = 'toasts';
const VOTES_COLLECTION = 'votes'; // Optional: for audit trail

// Get all toasts
export const getAllToasts = async (): Promise<Toast[]> => {
  try {
    const q = query(collection(db, TOASTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Toast[];
  } catch (error) {
    console.error('Error fetching toasts:', error);
    throw error;
  }
};

// Get a single toast by ID
export const getToastById = async (id: string): Promise<Toast | null> => {
  try {
    const docRef = doc(db, TOASTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Toast;
    }
    return null;
  } catch (error) {
    console.error('Error fetching toast:', error);
    throw error;
  }
};

// Get a random toast
export const getRandomToast = async (): Promise<Toast | null> => {
  try {
    // Get all toasts first, then select random one
    const q = query(collection(db, TOASTS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const randomIndex = Math.floor(Math.random() * querySnapshot.docs.length);
      const doc = querySnapshot.docs[randomIndex];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Toast;
    }
    return null;
  } catch (error) {
    console.error('Error fetching random toast:', error);
    throw error;
  }
};

// Create a new toast
export const createToast = async (toastData: CreateToastData): Promise<Toast> => {
  try {
    const newToast = {
      text: toastData.text,
      likes: 0,
      dislikes: 0,
      createdBy: toastData.createdBy || 'anonymous',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      voteSummary: {
        totalVotes: 0,
      },
    };
    
    const docRef = await addDoc(collection(db, TOASTS_COLLECTION), newToast);
    
    return {
      id: docRef.id,
      ...newToast,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Toast;
  } catch (error) {
    console.error('Error creating toast:', error);
    throw error;
  }
};

// Update toast vote (Simplified - only counts, no individual user tracking)
export const updateToastVote = async (voteData: UpdateToastVoteData): Promise<void> => {
  try {
    const { toastId, vote } = voteData;
    
    const toastRef = doc(db, TOASTS_COLLECTION, toastId);
    
    // Simple increment/decrement based on vote
    if (vote === 'like') {
      await updateDoc(toastRef, {
        'likes': increment(1),
        'voteSummary.totalVotes': increment(1),
        'voteSummary.lastVoteAt': serverTimestamp(),
        'updatedAt': serverTimestamp(),
      });
    } else if (vote === 'dislike') {
      await updateDoc(toastRef, {
        'dislikes': increment(1),
        'voteSummary.totalVotes': increment(1),
        'voteSummary.lastVoteAt': serverTimestamp(),
        'updatedAt': serverTimestamp(),
      });
    } else if (vote === null) {
      // This case is handled by the frontend logic
      // We don't need to decrement here since we don't track individual votes
      await updateDoc(toastRef, {
        'updatedAt': serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating toast vote:', error);
    throw error;
  }
};

// Get user's vote for a specific toast
export const getUserVote = async (toastId: string, userId: string): Promise<'like' | 'dislike' | null> => {
  try {
    const voteQuery = query(
      collection(db, VOTES_COLLECTION),
      where('toastId', '==', toastId),
      where('userId', '==', userId)
    );
    const voteSnapshot = await getDocs(voteQuery);
    
    if (!voteSnapshot.empty) {
      return voteSnapshot.docs[0].data().vote;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user vote:', error);
    throw error;
  }
};

// Get toast with user vote
export const getToastWithUserVote = async (toastId: string, userId: string): Promise<ToastWithUserVote | null> => {
  try {
    const toast = await getToastById(toastId);
    if (!toast) return null;
    
    const userVote = await getUserVote(toastId, userId);
    
    return {
      ...toast,
      userVote,
    };
  } catch (error) {
    console.error('Error fetching toast with user vote:', error);
    throw error;
  }
};
