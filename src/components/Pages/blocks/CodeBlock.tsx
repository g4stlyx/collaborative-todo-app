import React, { useState } from 'react';
import { Block } from '../../../models/page';

const CodeBlock = ({ block, updateBlock }: { block: Block, updateBlock: Function }) => {
  const [code, setCode] = useState(block.content.code || '');
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };
  
  const handleBlur = async () => {
    if (code !== block.content.code) {
      await updateBlock(block.id, { ...block.content, code });
    }
  };
  
  return (
    <div className="code-block">
      <textarea
        value={code}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Enter code here"
      />
    </div>
  );
};

export default CodeBlock;