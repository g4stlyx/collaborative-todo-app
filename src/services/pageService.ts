import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { Page, Block, BlockType } from '../models/page';

// Page CRUD Operations
export const createPage = async (userId: string, title: string, parentId?: string): Promise<string> => {
  const newPage = {
    title,
    ownerId: userId,
    parentId: parentId || null,
    sharedWith: [],
    permissions: 'edit',
    public: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    favorited: false
  };

  const pageRef = await addDoc(collection(db, 'pages'), newPage);
  
  // Create an initial text block
  await addDoc(collection(db, 'blocks'), {
    pageId: pageRef.id,
    type: 'text',
    content: { text: '' },
    position: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return pageRef.id;
};

export const getPage = async (pageId: string): Promise<Page | null> => {
  const pageDoc = await getDoc(doc(db, 'pages', pageId));
  if (pageDoc.exists()) {
    return { id: pageDoc.id, ...pageDoc.data() } as Page;
  }
  return null;
};

export const getUserPages = async (userId: string, parentId: string | null = null) => {
  let q;
  
  if (parentId) {
    q = query(
      collection(db, 'pages'),
      where('ownerId', '==', userId),
      where('parentId', '==', parentId),
      orderBy('updatedAt', 'desc')
    );
  } else {
    q = query(
      collection(db, 'pages'),
      where('ownerId', '==', userId),
      where('parentId', '==', null),
      orderBy('updatedAt', 'desc')
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Page[];
};

export const getSharedPages = async (userId: string) => {
  const q = query(
    collection(db, 'pages'),
    where('sharedWith', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Page[];
};

export const updatePage = async (pageId: string, data: Partial<Page>) => {
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(doc(db, 'pages', pageId), updateData);
};

export const deletePage = async (pageId: string) => {
  // First, delete all blocks in the page
  const blocksQuery = query(collection(db, 'blocks'), where('pageId', '==', pageId));
  const blocksSnapshot = await getDocs(blocksQuery);
  
  const deletePromises = blocksSnapshot.docs.map(blockDoc => 
    deleteDoc(doc(db, 'blocks', blockDoc.id))
  );
  
  await Promise.all(deletePromises);
  
  // Then delete the page itself
  await deleteDoc(doc(db, 'pages', pageId));
};

// Block CRUD operations
export const getPageBlocks = async (pageId: string) => {
  const q = query(
    collection(db, 'blocks'), 
    where('pageId', '==', pageId),
    orderBy('position', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Block[];
};

export const createBlock = async (pageId: string, type: BlockType, content: any, position: number) => {
  const newBlock = {
    pageId,
    type,
    content,
    position,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const blockRef = await addDoc(collection(db, 'blocks'), newBlock);
  return blockRef.id;
};

export const updateBlock = async (blockId: string, data: Partial<Block>) => {
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(doc(db, 'blocks', blockId), updateData);
};

export const deleteBlock = async (blockId: string) => {
  await deleteDoc(doc(db, 'blocks', blockId));
};

export const reorderBlocks = async (_pageId: string, blockOrder: string[]) => {
  const batch = writeBatch(db);
  
  blockOrder.forEach((blockId, index) => {
    const blockRef = doc(db, 'blocks', blockId);
    batch.update(blockRef, { position: index });
  });
  
  await batch.commit();
};

// Sharing operations
export const sharePage = async (pageId: string, userId: string, permission: 'view' | 'comment' | 'edit') => {
  const pageRef = doc(db, 'pages', pageId);
  await updateDoc(pageRef, {
    sharedWith: arrayUnion(userId),
    permissions: permission
  });
};

export const updatePagePermission = async (pageId: string, permission: 'view' | 'comment' | 'edit') => {
  const pageRef = doc(db, 'pages', pageId);
  await updateDoc(pageRef, {
    permissions: permission
  });
};

export const removePageAccess = async (pageId: string, userId: string) => {
  const pageRef = doc(db, 'pages', pageId);
  await updateDoc(pageRef, {
    sharedWith: arrayRemove(userId)
  });
};