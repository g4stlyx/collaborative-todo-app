import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import PageSidebar from './PageSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { createPage } from '../../services/pageService';
import { useNavigate } from 'react-router-dom';
import '../../style/PageLayout.css';

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPageTitle.trim() || isCreating) return;
    
    try {
      setIsCreating(true);
      const pageId = await createPage(currentUser.uid, newPageTitle.trim());
      setShowNewPageModal(false);
      setNewPageTitle('');
      navigate(`/pages/${pageId}`);
    } catch (err) {
      console.error("Error creating page:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenNewPageModal = () => {
    setShowNewPageModal(true);
    setNewPageTitle('');
  };

  return (
    <div className="page-layout">
      <PageSidebar onCreatePage={handleOpenNewPageModal} />
      <div className="page-content">
        {children}
      </div>

      {/* New Page Modal */}
      <Modal show={showNewPageModal} onHide={() => setShowNewPageModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Page</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreatePage}>
            <Form.Group className="mb-3">
              <Form.Label>Page Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter page title"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                autoFocus
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewPageModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreatePage}
            disabled={!newPageTitle.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Page'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};