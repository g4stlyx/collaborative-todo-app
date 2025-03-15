import React, { useState } from 'react';
import { Block } from '../../../models/page';

interface ImageBlockProps {
  block: Block;
  updateBlock: (blockId: string, content: any) => Promise<void>;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ block, updateBlock }) => {
  const [url, setUrl] = useState(block.content.url || '');
  const [caption, setCaption] = useState(block.content.caption || '');
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  
  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaption(e.target.value);
  };
  
  const handleBlur = async () => {
    if (url !== block.content.url || caption !== block.content.caption) {
      await updateBlock(block.id, { ...block.content, url, caption });
    }
  };
  
  return (
    <div className="image-block">
      {url ? (
        <img src={url} alt={caption} />
      ) : (
        <div className="image-placeholder">
          <input 
            type="text"
            placeholder="Enter image URL"
            value={url}
            onChange={handleUrlChange}
            onBlur={handleBlur}
          />
        </div>
      )}
      <input 
        type="text"
        className="caption"
        placeholder="Add a caption"
        value={caption}
        onChange={handleCaptionChange}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default ImageBlock;