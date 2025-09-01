import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  increment,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Toast, CreateToastData, UpdateToastVoteData } from './types';

const TOASTS_COLLECTION = 'toasts';

// Get all toasts
export const getAllToasts = async (): Promise<Toast[]> => {
  try {
    // Only fetch toasts created by "system" for now
    // Note: This query requires a Firestore composite index on (createdBy, createdAt)
    const q = query(
      collection(db, TOASTS_COLLECTION), 
      where('createdBy', '==', 'system')
    );
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

// Get a random toast from a specific list of toast IDs
export const getRandomToastFromIds = async (toastIds: string[]): Promise<Toast | null> => {
  try {
    if (toastIds.length === 0) {
      return null;
    }
    
    // Select a random ID from the provided list
    const randomIndex = Math.floor(Math.random() * toastIds.length);
    const randomToastId = toastIds[randomIndex];
    
    // Get the toast by ID
    return await getToastById(randomToastId);
  } catch (error) {
    console.error('Error fetching random toast from IDs:', error);
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

// Update toast vote with previous vote consideration
export const updateToastVote = async (voteData: UpdateToastVoteData & { previousVote?: 'like' | 'dislike' | null }): Promise<void> => {
  try {
    const { toastId, vote, previousVote } = voteData;
    
    const toastRef = doc(db, TOASTS_COLLECTION, toastId);
    
    // Calculate the changes based on previous and new vote
    let likesChange = 0;
    let dislikesChange = 0;
    let totalVotesChange = 0;
    
    // Remove previous vote if it exists
    if (previousVote === 'like') {
      likesChange -= 1;
      totalVotesChange -= 1;
    } else if (previousVote === 'dislike') {
      dislikesChange -= 1;
      totalVotesChange -= 1;
    }
    
    // Add new vote if it exists
    if (vote === 'like') {
      likesChange += 1;
      totalVotesChange += 1;
    } else if (vote === 'dislike') {
      dislikesChange += 1;
      totalVotesChange += 1;
    }
    
    // Update the document with calculated changes
    await updateDoc(toastRef, {
      'updatedAt': serverTimestamp(),
      ...(likesChange !== 0 && { 'likes': increment(likesChange) }),
      ...(dislikesChange !== 0 && { 'dislikes': increment(dislikesChange) }),
      ...(totalVotesChange !== 0 && { 'voteSummary.totalVotes': increment(totalVotesChange) }),
      ...(vote !== null && { 'voteSummary.lastVoteAt': serverTimestamp() }),
    });
  } catch (error) {
    console.error('Error updating toast vote:', error);
    throw error;
  }
};


