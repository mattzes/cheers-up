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
      createdBy: toastData.createdBy || 'system',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      voteSummary: {
        totalVotes: 0,
        lastVoteAt: null,
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

// Update toast vote (Hybrid approach: counts in toast + optional vote records)
export const updateToastVote = async (voteData: UpdateToastVoteData): Promise<void> => {
  try {
    const { toastId, userId, vote } = voteData;
    
    // Get current vote for this user and toast
    const voteQuery = query(
      collection(db, VOTES_COLLECTION),
      where('toastId', '==', toastId),
      where('userId', '==', userId)
    );
    const voteSnapshot = await getDocs(voteQuery);
    
    const toastRef = doc(db, TOASTS_COLLECTION, toastId);
    
    if (voteSnapshot.empty) {
      // No previous vote, create new vote
      if (vote) {
        // Optional: Create vote record for audit trail
        await addDoc(collection(db, VOTES_COLLECTION), {
          toastId,
          userId,
          vote,
          createdAt: serverTimestamp(),
        });
        
        // Update toast counts directly
        await updateDoc(toastRef, {
          [vote === 'like' ? 'likes' : 'dislikes']: increment(1),
          'voteSummary.totalVotes': increment(1),
          'voteSummary.lastVoteAt': serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      // Previous vote exists
      const existingVote = voteSnapshot.docs[0];
      const existingVoteData = existingVote.data();
      
      if (vote === null) {
        // Remove vote
        await deleteDoc(doc(db, VOTES_COLLECTION, existingVote.id));
        
        // Update toast counts
        await updateDoc(toastRef, {
          [existingVoteData.vote === 'like' ? 'likes' : 'dislikes']: increment(-1),
          'voteSummary.totalVotes': increment(-1),
          updatedAt: serverTimestamp(),
        });
      } else if (vote !== existingVoteData.vote) {
        // Change vote
        await updateDoc(doc(db, VOTES_COLLECTION, existingVote.id), {
          vote,
          updatedAt: serverTimestamp(),
        });
        
        // Update toast counts
        await updateDoc(toastRef, {
          [existingVoteData.vote === 'like' ? 'likes' : 'dislikes']: increment(-1),
          [vote === 'like' ? 'likes' : 'dislikes']: increment(1),
          'voteSummary.lastVoteAt': serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
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

// Initialize with sample data (for development)
export const initializeSampleData = async (): Promise<void> => {
  try {
    const sampleToasts = [
      "May we all stay healthy and never see each other again!",
      "Here's to the women who love us, and to those who will love us!",
      "May your life be as sweet as wine and as short as the bill!",
      "To friendship - it's like wine, the older the better!",
      "May your glass always be full and your worries always empty!",
      "To love - it's like a hangover, sometimes it hurts, but you miss it when it's gone!",
      "Here's to the past - it's over, to the future - it's uncertain, and to the moment - it's now!",
      "May your life be as happy as a dog with two tails!",
      "To health - without it everything is nothing!",
      "May your life be as rich as your heart and as full as your glass!"
    ];
    
    for (const text of sampleToasts) {
      await createToast({ text, createdBy: 'system' });
    }
    
    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
};
