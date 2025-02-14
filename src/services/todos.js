import { db } from '../firebase-config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';

export const createTodo = async (todoData, userId) => {
  try {
    await addDoc(collection(db, 'todos'), {
      ...todoData,
      ownerId: userId,
      completed: false,
      createdAt: new Date(),
      sharedWith: []
    });
  } catch (error) {
    throw error;
  }
};

export const subscribeTodos = (userId, callback) => {
  // Listen to todos owned by user or shared with user
  const q = query(
    collection(db, 'todos'),
    where('ownerId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const todos = [];
    snapshot.forEach((doc) => {
      todos.push({ id: doc.id, ...doc.data() });
    });
    callback(todos);
  });
};

export const toggleTodoComplete = async (todoId, completed) => {
  try {
    const todoRef = doc(db, 'todos', todoId);
    await updateDoc(todoRef, { completed });
  } catch (error) {
    throw error;
  }
}; 