import React, { useState } from 'react';
import { Block } from '../../../models/page';

const QuoteBlock = ({ block, updateBlock }: { block: Block, updateBlock: Function }) => {
  const [text, setText] = useState(block.content.text || '');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };
  
  const handleBlur = async () => {
    if (text !== block.content.text) {
      await updateBlock(block.id, { ...block.content, text });
    }
  };
  
  return (
    <div className="quote-block">
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Enter quote"
      />
    </div>
  );
};

export default QuoteBlock;