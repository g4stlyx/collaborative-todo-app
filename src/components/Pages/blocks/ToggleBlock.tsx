import React, { useState } from 'react';
import { Block } from '../../../models/page';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const ToggleBlock = ({ block, updateBlock }: { block: Block, updateBlock: Function }) => {
  const [title, setTitle] = useState(block.content.title || '');
  const [isOpen, setIsOpen] = useState(block.content.isOpen || false);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  const handleTitleBlur = async () => {
    if (title !== block.content.title) {
      await updateBlock(block.id, { ...block.content, title });
    }
  };
  
  const handleToggle = async () => {
    setIsOpen(!isOpen);
    await updateBlock(block.id, { ...block.content, isOpen: !isOpen });
  };
  
  return (
    <div className="toggle-block">
      <div className="toggle-header" onClick={handleToggle}>
        <span className={`toggle-icon ${isOpen ? 'open' : ''}`}>
          <FontAwesomeIcon icon={faChevronRight} />
        </span>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onClick={(e) => e.stopPropagation()}
          placeholder="Toggle title"
          className="toggle-title"
        />
      </div>
      {isOpen && (
        <div className="toggle-content">
          <p>Toggle content (children blocks would go here)</p>
        </div>
      )}
    </div>
  );
};

export default ToggleBlock;