import { Timestamp } from 'firebase/firestore';

export type BlockType = 
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bullet'
  | 'numbered'
  | 'image'
  | 'code'
  | 'quote'
  | 'divider'
  | 'toggle';

export interface Block {
  id: string;
  pageId: string;
  type: BlockType;
  content: any; // Content depends on block type
  position: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TextBlock extends Block {
  type: 'text';
  content: {
    text: string;
    formatting?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      code?: boolean;
      color?: string;
    }[];
  };
}

export interface HeadingBlock extends Block {
  type: 'heading1' | 'heading2' | 'heading3';
  content: {
    text: string;
  };
}

export interface TodoBlock extends Block {
  type: 'todo';
  content: {
    text: string;
    checked: boolean;
  };
}

export interface BulletListBlock extends Block {
  type: 'bullet';
  content: {
    text: string;
  };
}

export interface NumberedListBlock extends Block {
  type: 'numbered';
  content: {
    text: string;
  };
}

export interface ImageBlock extends Block {
  type: 'image';
  content: {
    url: string;
    caption?: string;
  };
}

export interface CodeBlock extends Block {
  type: 'code';
  content: {
    code: string;
    language: string;
  };
}

export interface QuoteBlock extends Block {
  type: 'quote';
  content: {
    text: string;
  };
}

export interface DividerBlock extends Block {
  type: 'divider';
  content: null;
}

export interface ToggleBlock extends Block {
  type: 'toggle';
  content: {
    title: string;
    isOpen: boolean;
    children: Block[];
  };
}

export type Permission = 'view' | 'comment' | 'edit';

export interface Page {
  id: string;
  title: string;
  emoji?: string;
  cover?: string;
  ownerId: string;
  parentId?: string;
  sharedWith: string[];
  permissions: Permission;
  public: boolean;
  favorited: boolean;
  icon?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}