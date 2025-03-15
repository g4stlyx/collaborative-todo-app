import React from "react";
import { Block } from "../../../models/page";
import { Form } from "react-bootstrap";

interface TodoBlockProps {
  block: Block;
  updateBlock: (blockId: string, content: any) => void;
  onEnterPress?: (e: React.KeyboardEvent<HTMLElement>) => boolean | undefined;
}

const TodoBlock: React.FC<TodoBlockProps> = ({ block, updateBlock, onEnterPress }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBlock(block.id, {
      ...block.content,
      text: e.target.value,
    });
  };

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBlock(block.id, {
      ...block.content,
      checked: e.target.checked,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey && onEnterPress) {
      const handled = onEnterPress(e);
      if (handled) {
        return;
      }
    }
  };

  return (
    <div className="todo-block">
      <Form.Check
        type="checkbox"
        checked={block.content.checked}
        onChange={(e) => updateBlock(block.id, { ...block.content, checked: e.target.checked })}
        label={
          <span
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlock(block.id, { ...block.content, text: e.currentTarget.textContent || "" })}
            onKeyDown={handleKeyDown}
            className={block.content.checked ? "text-muted text-decoration-line-through" : ""}
          >
            {block.content.text}
          </span>
        }
      />
    </div>
  );
};

export default TodoBlock;