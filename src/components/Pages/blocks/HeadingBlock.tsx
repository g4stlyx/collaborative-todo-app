import React, { useState, useRef, useEffect } from 'react';
import { Block } from '../../../models/page';

interface HeadingBlockProps {
  block: Block;
  updateBlock: (blockId: string, content: any) => Promise<void>;
  onEnterPress?: (e: React.KeyboardEvent<HTMLElement>) => boolean | undefined;
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({ block, updateBlock, onEnterPress }) => {
  const [text, setText] = useState(block.content.text || '');
  const [, setIsEditing] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  
  useEffect(() => {
    setText(block.content.text || '');
  }, [block.content.text]);
  
  const handleBlur = async () => {
    setIsEditing(false);
    if (text !== block.content.text) {
      await updateBlock(block.id, { ...block.content, text });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey && onEnterPress) {
      const handled = onEnterPress(e);
      if (handled) {
        return;
      }
    }
  };
  const getHeadingClass = () => {
    switch (block.type) {
      case 'heading1': return 'heading1';
      case 'heading2': return 'heading2';
      case 'heading3': return 'heading3';
      default: return 'heading1';
    }
  };
  
  return (
    <div 
      ref={headingRef}
      className={`heading-block-content ${getHeadingClass()}`} 
      contentEditable={true}
      suppressContentEditableWarning={true}
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

export default HeadingBlock;