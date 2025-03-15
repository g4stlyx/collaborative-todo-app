import React, { useState, useRef } from 'react';
import { Block } from '../../../models/page';

interface ListBlockProps {
  block: Block;
  updateBlock: (blockId: string, content: any) => Promise<void>;
  listType: 'bullet' | 'numbered';
  onEnterPress?: (e: React.KeyboardEvent<HTMLElement>) => boolean | undefined;
}

const ListBlock: React.FC<ListBlockProps> = ({ block, updateBlock, listType, onEnterPress }) => {
  const [text, setText] = useState(block.content.text || '');
  const inputRef = useRef<HTMLDivElement>(null);
  
  const handleChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setText(content);
  };
  
  const handleBlur = async () => {
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
  
  return (
    <div className={`list-block ${listType}-list`}>
      <div
        ref={inputRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        className="list-item-content"
        onInput={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
};

export default ListBlock;