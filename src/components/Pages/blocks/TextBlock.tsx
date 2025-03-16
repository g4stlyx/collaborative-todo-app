// import React, { useRef, useEffect, useState } from "react";
// import { Block } from "../../../models/page";

// interface TextBlockProps {
//   block: Block;
//   updateBlock: (blockId: string, content: any) => Promise<void>;
//   onEnterPress?: (e: React.KeyboardEvent<HTMLElement>) => Promise<boolean> | boolean | undefined;
// }

// const TextBlock: React.FC<TextBlockProps> = ({ block, updateBlock, onEnterPress }) => {
//   const contentRef = useRef<HTMLDivElement>(null);
//   const [localContent, setLocalContent] = useState(block.content?.text || "");
//   const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);
  
//   // Initialize with block content
//   useEffect(() => {
//     if (block.content?.text !== localContent) {
//       setLocalContent(block.content?.text || "");
//     }
//   }, [block.content?.text]);

//   // Save cursor position
//   const saveCursorPosition = () => {
//     const selection = window.getSelection();
//     if (selection && selection.rangeCount > 0) {
//       const range = selection.getRangeAt(0);
//       // Check if the selection is within our content element
//       if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
//         cursorPositionRef.current = {
//           start: range.startOffset,
//           end: range.endOffset
//         };
//       }
//     }
//   };

//   // Restore cursor position
//   const restoreCursorPosition = () => {
//     if (!cursorPositionRef.current || !contentRef.current) return;
    
//     const selection = window.getSelection();
//     if (!selection) return;
    
//     try {
//       const range = document.createRange();
//       let textNode: Node | null = null;
      
//       // Find the text node
//       if (contentRef.current.firstChild && contentRef.current.firstChild.nodeType === Node.TEXT_NODE) {
//         textNode = contentRef.current.firstChild;
//       } else {
//         textNode = document.createTextNode(localContent);
//         contentRef.current.appendChild(textNode);
//       }
      
//       const textLength = textNode.textContent?.length || 0;
//       const start = Math.min(cursorPositionRef.current.start, textLength);
//       const end = Math.min(cursorPositionRef.current.end, textLength);
      
//       range.setStart(textNode, start);
//       range.setEnd(textNode, end);
      
//       selection.removeAllRanges();
//       selection.addRange(range);
//     } catch (e) {
//       console.error("Failed to restore cursor:", e);
//     }
//   };

//   // Handle content changes and update the parent 
//   const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
//     saveCursorPosition(); // Save cursor position before update
    
//     const newText = e.currentTarget.textContent || "";
//     setLocalContent(newText);
    
//     // Debounced update to parent
//     const timeoutId = setTimeout(() => {
//       updateBlock(block.id, { ...block.content, text: newText });
//     }, 100);
    
//     return () => clearTimeout(timeoutId);
//   };

//   // Handle Enter key to create new blocks
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       saveCursorPosition(); // Save position before handling Enter
//       if (onEnterPress) {
//         onEnterPress(e);
//       }
//       return false;
//     }
//   };
  
//   // Use a plain DOM approach for rendering text content to avoid React's interference
//   useEffect(() => {
//     if (contentRef.current) {
//       // Only update if the DOM content is different from our state
//       if (contentRef.current.textContent !== localContent) {
//         contentRef.current.textContent = localContent;
//         // Restore cursor position after text update
//         setTimeout(restoreCursorPosition, 0);
//       }
//     }
//   }, [localContent]);
  
//   return (
//     <div
//       ref={contentRef}
//       className="text-block"
//       contentEditable
//       suppressContentEditableWarning
//       onInput={handleInput}
//       onKeyDown={handleKeyDown}
//       onBlur={saveCursorPosition}
//       onFocus={restoreCursorPosition}
//     />
//   );
// };

// export default TextBlock;

import React, { useRef, useEffect } from "react";
import { Block } from "../../../models/page";

interface TextBlockProps {
  block: Block;
  updateBlock: (blockId: string, content: any) => Promise<void>;
  onEnterPress?: (e: React.KeyboardEvent<HTMLElement>) => Promise<boolean> | boolean | undefined;
}

const TextBlock: React.FC<TextBlockProps> = ({ block, updateBlock, onEnterPress }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const contentValueRef = useRef(block.content?.text || "");
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize content
  useEffect(() => {
    if (contentRef.current && block.content?.text !== undefined && contentValueRef.current !== block.content.text) {
      contentValueRef.current = block.content.text;
      
      // Save current selection
      const selection = window.getSelection();
      let savedRange = null;
      if (selection && selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }
      
      // Update content
      contentRef.current.textContent = contentValueRef.current;
      
      // Restore selection if it was within this element
      if (savedRange && contentRef.current.contains(savedRange.startContainer)) {
        selection?.removeAllRanges();
        selection?.addRange(savedRange);
      }
    }
  }, [block.content?.text]);
  
  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (onEnterPress) {
        onEnterPress(e);
      }
    }
  };
  
  // Handle input with debounced updates
  const handleInput = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.textContent || "";
      
      // Update our reference immediately to prevent loops
      contentValueRef.current = newContent;
      
      // Debounce the update to the parent
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        updateBlock(block.id, { ...block.content, text: newContent });
      }, 300); // Longer debounce time to reduce update frequency
    }
  };

  return (
    <div
      ref={contentRef}
      className="text-block"
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: contentValueRef.current }}
    />
  );
};

export default TextBlock;