import { db } from '../firebase-config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

export const sendFriendRequest = async (fromUserId, toUserId) => {
  try {
    await addDoc(collection(db, 'friendRequests'), {
      from: fromUserId,
      to: toUserId,
      status: 'pending',
      timestamp: new Date()
    });
  } catch (error) {
    throw error;
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    const requestRef = doc(db, 'friendRequests', requestId);
    await updateDoc(requestRef, { status: 'accepted' });
    // Update both users' friends arrays
    // ... implementation
  } catch (error) {
    throw error;
  }
}; 