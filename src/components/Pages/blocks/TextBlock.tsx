import React, { useState, useRef, useEffect } from 'react';
import { Block } from '../../../models/page';

interface TextBlockProps {
  block: Block;
  updateBlock: (blockId: string, content: any) => Promise<void>;
  onEnterPress?: (e: React.KeyboardEvent<HTMLElement>) => boolean | undefined;
}

const TextBlock: React.FC<TextBlockProps> = ({ block, updateBlock, onEnterPress }) => {
  const [text, setText] = useState(block.content.text || '');
  const [, setIsEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onEnterPress) {
        const handled = onEnterPress(e);
        if (handled) {
          return;
        }
      }
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    updateBlock(block.id, {
      text: e.currentTarget.textContent || "",
    });
  };

  
  return (
    <div 
      ref={textRef}
      className="text-block-content" 
      contentEditable={true}
      suppressContentEditableWarning={true}
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      onInput={handleChange}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

export default TextBlock;