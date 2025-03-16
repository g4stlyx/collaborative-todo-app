// import React, { useRef, useEffect } from "react";
// import { Block } from "../../../models/page";

// interface HeadingBlockProps {
//   block: Block;
//   updateBlock: (blockId: string, content: any) => void;
//   onEnterPress?: (e: React.KeyboardEvent<HTMLElement>) => Promise<boolean> | boolean | undefined;
// }

// const HeadingBlock: React.FC<HeadingBlockProps> = ({
//   block,
//   updateBlock,
//   onEnterPress,
// }) => {
//   const contentRef = useRef<HTMLDivElement>(null);
//   const lastText = useRef<string>(block.content?.text || "");
//   const lastSelection = useRef<{ start: number; end: number } | null>(null);

//   // Selection preservation logic (same as TextBlock)
//   const saveSelection = () => {
//     const selection = window.getSelection();
//     if (selection && selection.rangeCount > 0) {
//       const range = selection.getRangeAt(0);
//       if (contentRef.current?.contains(range.startContainer)) {
//         lastSelection.current = {
//           start: range.startOffset,
//           end: range.endOffset
//         };
//       }
//     }
//   };
  
//   // Modify the restoration function
//   const restoreSelection = () => {
//     if (lastSelection.current && contentRef.current) {
//       const selection = window.getSelection();
//       if (!selection) return;

//       const range = document.createRange();
      
//       let textNode: Node | null = null;
      
//       if (contentRef.current.firstChild && contentRef.current.firstChild.nodeType === Node.TEXT_NODE) {
//         textNode = contentRef.current.firstChild;
//       } else {
//         textNode = document.createTextNode(lastText.current);
//         contentRef.current.appendChild(textNode);
//       }
      
//       try {
//         const textLength = textNode.textContent?.length || 0;
//         // Make sure we don't exceed the text length
//         const startPos = Math.min(lastSelection.current.start, textLength);
//         const endPos = Math.min(lastSelection.current.end, textLength);
        
//         range.setStart(textNode, startPos);
//         range.setEnd(textNode, endPos);
        
//         // Clear existing selections first
//         selection.removeAllRanges();
//         selection.addRange(range);
//       } catch (e) {
//         console.error("Failed to restore selection:", e);
//       }
//     }
//   };

//   const handleInput = () => {
//     if (!contentRef.current) return;

//     saveSelection();

//     const newText = contentRef.current.textContent || "";
//     if (newText !== lastText.current) {
//       lastText.current = newText;
//       updateBlock(block.id, { text: newText });
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
//     if (e.key === "Enter" && !e.shiftKey && onEnterPress) {
//       const handled = onEnterPress(e);
//       if (handled) {
//         return;
//       }
//     }
//   };

//   useEffect(() => {
//     if (block.content?.text !== undefined && 
//         block.content?.text !== lastText.current &&
//         contentRef.current) {
      
//       // Save current selection before updating
//       saveSelection();
      
//       // Update the content reference
//       lastText.current = block.content.text;
      
//       // Update DOM directly
//       if (contentRef.current) {
//         contentRef.current.innerHTML = lastText.current;
//       }
      
//       // Restore selection after DOM update
//       setTimeout(restoreSelection, 10);
//     }
//   }, [block.content?.text]);

//   // Determine heading class based on type
//   const headingClass = `heading-block heading-${block.type}`;

//   return (
//     <div
//       className={headingClass}
//       contentEditable
//       suppressContentEditableWarning
//       ref={contentRef}
//       onInput={handleInput}
//       onKeyDown={handleKeyDown}
//     >
//       {block.content?.text || ""}
//     </div>
//   );
// };

// export default HeadingBlock;

import React, { useRef, useEffect } from "react";
import { Block } from "../../../models/page";

interface HeadingBlockProps {
  block: Block;
  updateBlock: (blockId: string, content: any) => Promise<void>;
  onEnterPress?: (e: React.KeyboardEvent<HTMLElement>) => Promise<boolean> | boolean | undefined;
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({ block, updateBlock, onEnterPress }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const contentValueRef = useRef(block.content?.text || "");
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (onEnterPress) {
        onEnterPress(e);
      }
    }
  };
  
  const handleInput = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.textContent || "";
      contentValueRef.current = newContent;
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        updateBlock(block.id, { ...block.content, text: newContent });
      }, 300);
    }
  };

  // Determine heading tag based on type
  let className = "heading-block";
  if (block.type === "heading1") className += " h1";
  else if (block.type === "heading2") className += " h2";
  else if (block.type === "heading3") className += " h3";

  return (
    <div
      ref={contentRef}
      className={className}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: contentValueRef.current }}
    />
  );
};

export default HeadingBlock;