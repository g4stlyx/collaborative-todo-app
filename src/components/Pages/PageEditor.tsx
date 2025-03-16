import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPage,
  updatePage,
  getPageBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
} from "../../services/pageService";
import { Page, Block, BlockType } from "../../models/page";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Dropdown,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faParagraph,
  faHeading,
  faListUl,
  faListOl,
  faImage,
  faCode,
  faQuoteRight,
  faMinus,
  faChevronRight,
  faCopy,
  faArrowUp,
  faArrowDown,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import TextBlock from "./blocks/TextBlock";
import HeadingBlock from "./blocks/HeadingBlock.tsx";
import TodoBlock from "./blocks/TodoBlock.tsx";
import ListBlock from "./blocks/ListBlock.tsx";
import ImageBlock from "./blocks/ImageBlock.tsx";
import CodeBlock from "./blocks/CodeBlock.tsx";
import QuoteBlock from "./blocks/QuoteBlock.tsx";
import DividerBlock from "./blocks/DividerBlock.tsx";
import ToggleBlock from "./blocks/ToggleBlock.tsx";
import { useAuth } from "../../contexts/AuthContext";
import "../../style/PageEditor.css";
import { Timestamp } from "firebase/firestore";

export const PageEditor = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setShowNewPageModal] = useState(false);
  const [newPageTitle, ] = useState("");
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    top: number;
    left: number;
    blockId: string;
    index: number;
  } | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  //! basic / need fast
  //TODO: SMOOTHER, CLEANER block types
  //TODO: "enter" doesnt work properly, it keeps the original block as it is
  //TODO: while typing, cursor position may change, go to the beginning of the block
  //TODO: when "delete or backspace" is pressed on an empty block, delete the block and focus on the previous block
  //! a bit advanced / can wait
  //TODO: writing "/todo", "/heading1" etc. should create the named (todo, heading1) components
  //TODO: sharing page functionality (friends should be able to share pages)
  //TODO: block dragging functionality
  //TODO: formatting(bold, italic etc.), size, aligning(left, center etc.) options to text.
  //TODO: add undo/redo functionality
  //TODO: read-only, edit etc. permission types when sharing pages to friends

  // Fetch page data
  useEffect(() => {
    const fetchPageData = async () => {
      if (!pageId || !currentUser) return;

      try {
        const pageData = await getPage(pageId);
        if (!pageData) {
          setError("Page not found");
          return;
        }

        setPage(pageData);
        setTitle(pageData.title);

        const blocksData = await getPageBlocks(pageId);
        setBlocks(blocksData);
      } catch (err) {
        console.error("Error fetching page:", err);
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [pageId, currentUser]);

  // Handle click outside context menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the user clicked outside the context menu
      const menuElement = document.querySelector('.block-context-menu');
      if (contextMenuPosition && menuElement && !menuElement.contains(event.target as Node)) {
        setContextMenuPosition(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenuPosition]);

  // Save title changes
  const handleTitleChange = useCallback(async () => {
    if (!pageId || !page) return;

    try {
      await updatePage(pageId, { title });
    } catch (err) {
      console.error("Error saving title:", err);
    }
  }, [pageId, page, title]);

  // Create a new page and navigate to it
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPageTitle.trim()) return;

    try {
      // Add your logic to create a new page here
      // After creating the page, navigate to it
      navigate(`/pages/${newPageTitle}`);
      setShowNewPageModal(false);
    } catch (err) {
      console.error("Error creating new page:", err);
    }
  };

  // Add a new block
  const addBlock = async (type: BlockType, position: number, initialContent?: any) => {
    if (!pageId) return;

    let content;
    if (initialContent) {
      content = initialContent;
    } else {
      switch (type) {
        case "text":
          content = { text: "" };
          break;
        case "heading1":
        case "heading2":
        case "heading3":
          content = { text: "" };
          break;
        case "todo":
          content = { text: "", checked: false };
          break;
        case "bullet":
        case "numbered":
          content = { text: "" };
          break;
        case "image":
          content = { url: "", caption: "" };
          break;
        case "code":
          content = { code: "", language: "javascript" };
          break;
        case "quote":
          content = { text: "" };
          break;
        case "divider":
          content = null;
          break;
        case "toggle":
          content = { title: "", isOpen: false, children: [] };
          break;
        default:
          content = { text: "" };
      }
    }

    try {
      const newBlockId = await createBlock(pageId, type, content, position);

      // Refetch blocks or optimistically update the UI
      const updatedBlocks = [...blocks];
      const newBlock = {
        id: newBlockId,
        pageId,
        type,
        content,
        position,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } as Block;
      
      updatedBlocks.splice(position, 0, newBlock);

      // Update positions for blocks after the inserted one
      const finalBlocks = updatedBlocks.map((block, idx) => ({
        ...block,
        position: idx,
      }));

      setBlocks(finalBlocks);
      
      // Return the new block id for possible focus handling
      return newBlockId;
    } catch (err) {
      console.error("Error adding block:", err);
      return null;
    }
  };

  // Update a block
  const updateBlockContent = async (blockId: string, content: any) => {
    try {
      await updateBlock(blockId, { content });

      // Update local state
      setBlocks(
        blocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                content,
                updatedAt: Timestamp.now(),
              }
            : block
        )
      );
    } catch (err) {
      console.error("Error updating block:", err);
    }
  };

  // Delete a block
  const removeBlock = async (blockId: string) => {
    try {
      await deleteBlock(blockId);

      // Update local state
      const updatedBlocks = blocks
        .filter((block) => block.id !== blockId)
        .map((block, idx) => ({ ...block, position: idx }));

      setBlocks(updatedBlocks);
      
      // Close context menu if open
      setContextMenuPosition(null);
    } catch (err) {
      console.error("Error deleting block:", err);
    }
  };

  // Handle Enter key press in blocks
  const handleEnterInBlock = useCallback(
    async (e: React.KeyboardEvent, block: Block) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
  
        try {
          // Get the current selection information
          const selection = window.getSelection();
          const range = selection?.getRangeAt(0);
          
          if (!range) return false;
          
          const currentContent = { ...block.content };
          
          // For text-based blocks (text, headings, lists, todos)
          if ("text" in currentContent) {
            const textContent = currentContent.text || "";
            
            // Calculate cursor position properly by considering all text nodes
            let cursorPosition = 0;
            const container = e.currentTarget;
            
            // If the selection is within a text node, use its offset
            if (range.startContainer.nodeType === Node.TEXT_NODE) {
              cursorPosition = range.startOffset;
              
              // Account for any preceding text nodes
              let node = range.startContainer.previousSibling;
              while (node) {
                if (node.nodeType === Node.TEXT_NODE) {
                  cursorPosition += node.textContent?.length || 0;
                }
                node = node.previousSibling;
              }
            }
            
            // Split the text at cursor position
            const textBefore = textContent.substring(0, cursorPosition);
            const textAfter = textContent.substring(cursorPosition);
            
            // First update the current block with text before cursor
            await updateBlockContent(block.id, { 
              ...currentContent, 
              text: textBefore
            });
            
            // Create a new block with text after cursor
            const newContent = { ...currentContent, text: textAfter };
            
            // For todo blocks, new items should always be unchecked
            if (block.type === "todo") {
              newContent.checked = false;
            }
            
            // Add the new block right after the current block
            const newBlockId = await addBlock(block.type, block.position + 1, newContent);
            
            if (newBlockId) {
              // Set the focus to the new block with proper delay
              setTimeout(() => {
                setFocusedBlockId(newBlockId);
              }, 50);
            }
            
            return true;
          } else {
            // For non-text blocks, create an empty block of the same type
            const newBlockId = await addBlock(block.type, block.position + 1);
            
            if (newBlockId) {
              setTimeout(() => {
                setFocusedBlockId(newBlockId);
              }, 50);
            }
            
            return true;
          }
        } catch (error) {
          console.error("Error handling Enter key:", error);
          return false;
        }
      }
      return false;
    },
    [updateBlockContent, addBlock]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent, block: Block, index: number) => {
    e.preventDefault(); // Prevent the default browser context menu
    
    // Calculate position for the context menu
    const { clientX, clientY } = e;
    
    // Set the position and info about the clicked block
    setContextMenuPosition({
      top: clientY,
      left: clientX,
      blockId: block.id,
      index: index
    });
  }, []);

  const duplicateBlock = async (blockId: string, index: number) => {
    try {
      const blockToDuplicate = blocks.find(block => block.id === blockId);
      if (!blockToDuplicate) return;
      
      // Create a new block with the same content
      await addBlock(blockToDuplicate.type, index + 1, { ...blockToDuplicate.content });
      
      // Close the context menu
      setContextMenuPosition(null);
    } catch (err) {
      console.error("Error duplicating block:", err);
    }
  };

  const moveBlockUp = async (_blockId: string, index: number) => {
    if (index <= 0) return;
    
    try {
      const updatedBlocks = [...blocks];
      const blockToMove = updatedBlocks[index];
      const blockAbove = updatedBlocks[index - 1];
      
      // Swap positions
      updatedBlocks[index] = blockAbove;
      updatedBlocks[index - 1] = blockToMove;
      
      // Update positions property
      const finalBlocks = updatedBlocks.map((block, idx) => ({
        ...block,
        position: idx,
      }));
      
      // Update in database
      await Promise.all([
        updateBlock(blockToMove.id, { position: index - 1 }),
        updateBlock(blockAbove.id, { position: index })
      ]);
      
      // Update local state
      setBlocks(finalBlocks);
      setContextMenuPosition(null);
    } catch (err) {
      console.error("Error moving block up:", err);
    }
  };

  const moveBlockDown = async (_blockId: string, index: number) => {
    if (index >= blocks.length - 1) return;
    
    try {
      const updatedBlocks = [...blocks];
      const blockToMove = updatedBlocks[index];
      const blockBelow = updatedBlocks[index + 1];
      
      // Swap positions
      updatedBlocks[index] = blockBelow;
      updatedBlocks[index + 1] = blockToMove;
      
      // Update positions property
      const finalBlocks = updatedBlocks.map((block, idx) => ({
        ...block,
        position: idx,
      }));
      
      // Update in database
      await Promise.all([
        updateBlock(blockToMove.id, { position: index + 1 }),
        updateBlock(blockBelow.id, { position: index })
      ]);
      
      // Update local state
      setBlocks(finalBlocks);
      setContextMenuPosition(null);
    } catch (err) {
      console.error("Error moving block down:", err);
    }
  };
  
  // Focus handling for newly created blocks
  useEffect(() => {
    if (focusedBlockId) {
      setTimeout(() => {
        // Find the element that needs focus
        const blockElement = document.getElementById(`block-${focusedBlockId}`);
        const editableElement = blockElement?.querySelector('[contenteditable="true"]');
        
        if (editableElement) {
          // Set focus to the element
          (editableElement as HTMLElement).focus();
          
          // Try to set cursor at the beginning of the element
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            
            // Find text node or use the element itself
            if (editableElement.firstChild && editableElement.firstChild.nodeType === Node.TEXT_NODE) {
              const textNode = editableElement.firstChild;
              range.setStart(textNode, 0); // Place cursor at the beginning of text
              range.setEnd(textNode, 0);
            } else {
              range.setStart(editableElement, 0);
              range.setEnd(editableElement, 0);
            }
            
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        
        // Clear the focused block ID after focus is set
        setFocusedBlockId(null);
      }, 100); // Slightly longer delay for better reliability
    }
  }, [focusedBlockId]);

  if (loading) {
    return (
      <Container className="py-5">
        <div>Loading...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="error-message">{error}</div>
      </Container>
    );
  }

  if (!page) {
    return (
      <Container className="py-5">
        <div>Page not found</div>
      </Container>
    );
  }

  return (
    <Container className="page-editor py-5">
      <Row className="mb-4">
        <Col>
          <Form.Control
            type="text"
            className="page-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleChange}
            placeholder="Untitled"
          />
        </Col>
      </Row>

      <div className="blocks-container">
        {blocks.map((block, index) => (
          <div 
            key={block.id} 
            id={`block-${block.id}`}
            className="block-wrapper"
            onContextMenu={(e) => handleContextMenu(e, block, index)}
          >
            <div className="block-content">
              {block.type === "text" && (
                <TextBlock 
                  block={block} 
                  updateBlock={updateBlockContent} 
                  onEnterPress={(e) => handleEnterInBlock(e, block)}
                />
              )}
              {(block.type === "heading1" ||
                block.type === "heading2" ||
                block.type === "heading3") && (
                <HeadingBlock 
                  block={block} 
                  updateBlock={updateBlockContent} 
                  onEnterPress= {(e) => handleEnterInBlock(e, block)}
                />
              )}
              {block.type === "todo" && (
                <TodoBlock 
                  block={block} 
                  updateBlock={updateBlockContent} 
                  onEnterPress= {(e) => handleEnterInBlock(e, block)}
                />
              )}
              {block.type === "bullet" && (
                <ListBlock
                  block={block}
                  updateBlock={updateBlockContent}
                  listType="bullet"
                  onEnterPress={(e) => handleEnterInBlock(e, block)}
                />
              )}
              {block.type === "numbered" && (
                <ListBlock
                  block={block}
                  updateBlock={updateBlockContent}
                  listType="numbered"
                  onEnterPress={(e) => handleEnterInBlock(e, block)}
                />
              )}
              {block.type === "image" && (
                <ImageBlock block={block} updateBlock={updateBlockContent} />
              )}
              {block.type === "code" && (
                <CodeBlock block={block} updateBlock={updateBlockContent} />
              )}
              {block.type === "quote" && (
                <QuoteBlock block={block} updateBlock={updateBlockContent} />
              )}
              {block.type === "divider" && <DividerBlock block={block} />}
              {block.type === "toggle" && (
                <ToggleBlock block={block} updateBlock={updateBlockContent} />
              )}
            </div>

            <div className="block-actions">
              <Button
                variant="light"
                size="sm"
                className="block-menu-btn"
                onClick={() => removeBlock(block.id)}
              >
                <FontAwesomeIcon icon={faPlus} />
              </Button>
            </div>

            <div className="add-block-menu">
              <Dropdown className="d-inline-block">
                <Dropdown.Toggle
                  variant="light"
                  size="sm"
                  className="add-block-btn"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => addBlock("text", index + 1)}>
                    <FontAwesomeIcon icon={faParagraph} className="me-2" />
                    Text
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => addBlock("heading1", index + 1)}
                  >
                    <FontAwesomeIcon icon={faHeading} className="me-2" />
                    Heading 1
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => addBlock("heading2", index + 1)}
                  >
                    <FontAwesomeIcon icon={faHeading} className="me-2" />
                    Heading 2
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => addBlock("heading3", index + 1)}
                  >
                    <FontAwesomeIcon icon={faHeading} className="me-2" />
                    Heading 3
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => addBlock("todo", index + 1)}>
                    <FontAwesomeIcon icon={faListUl} className="me-2" />
                    Todo
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => addBlock("bullet", index + 1)}>
                    <FontAwesomeIcon icon={faListUl} className="me-2" />
                    Bullet List
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => addBlock("numbered", index + 1)}
                  >
                    <FontAwesomeIcon icon={faListOl} className="me-2" />
                    Numbered List
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => addBlock("image", index + 1)}>
                    <FontAwesomeIcon icon={faImage} className="me-2" />
                    Image
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => addBlock("code", index + 1)}>
                    <FontAwesomeIcon icon={faCode} className="me-2" />
                    Code
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => addBlock("quote", index + 1)}>
                    <FontAwesomeIcon icon={faQuoteRight} className="me-2" />
                    Quote
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => addBlock("divider", index + 1)}>
                    <FontAwesomeIcon icon={faMinus} className="me-2" />
                    Divider
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => addBlock("toggle", index + 1)}>
                    <FontAwesomeIcon icon={faChevronRight} className="me-2" />
                    Toggle List
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        ))}

        {blocks.length === 0 && (
          <div className="empty-page">
            <Button variant="primary" onClick={() => addBlock("text", 0)}>
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add your first block
            </Button>
          </div>
        )}
      </div>
      
      {/* Context Menu */}
      {contextMenuPosition && (
        <div 
          className="block-context-menu"
          style={{
            position: 'fixed',
            top: `${contextMenuPosition.top}px`,
            left: `${contextMenuPosition.left}px`,
            zIndex: 1000,
            backgroundColor: 'white',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            borderRadius: '4px',
            padding: '4px 0'
          }}
        >
          <div className="context-menu-item" onClick={() => {
            const blockType = blocks.find(b => b.id === contextMenuPosition.blockId)?.type || 'text';
            addBlock(blockType, contextMenuPosition.index + 1);
            setContextMenuPosition(null);
          }}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            <span>Insert Below</span>
          </div>
          
          <div className="context-menu-item" onClick={() => duplicateBlock(contextMenuPosition.blockId, contextMenuPosition.index)}>
            <FontAwesomeIcon icon={faCopy} className="me-2" />
            <span>Duplicate</span>
          </div>
          
          <div className="context-menu-item" onClick={() => moveBlockUp(contextMenuPosition.blockId, contextMenuPosition.index)}>
            <FontAwesomeIcon icon={faArrowUp} className="me-2" />
            <span>Move Up</span>
          </div>
          
          <div className="context-menu-item" onClick={() => moveBlockDown(contextMenuPosition.blockId, contextMenuPosition.index)}>
            <FontAwesomeIcon icon={faArrowDown} className="me-2" />
            <span>Move Down</span>
          </div>
          
          <div className="context-menu-item delete" onClick={() => removeBlock(contextMenuPosition.blockId)}>
            <FontAwesomeIcon icon={faTrashAlt} className="me-2" />
            <span>Delete</span>
          </div>
        </div>
      )}
    </Container>
  );
};