import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getUserPages, 
  createPage, 
  deletePage, 
  updatePage 
} from '../../services/pageService';
import { useAuth } from '../../contexts/AuthContext';
import { Page } from '../../models/page';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Modal, 
  Form,
  InputGroup,
  Dropdown,
  ListGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash, 
  faEdit, 
  faStar, 
  faFile,
  faEllipsisV,
  faBook,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import '../../style/PageList.css';

export const PageList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchPages = async () => {
      try {
        setLoading(true);
        const userPages = await getUserPages(currentUser.uid);
        setPages(userPages);
      } catch (err) {
        console.error("Error fetching pages:", err);
        setError('Failed to load pages');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPages();
  }, [currentUser]);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPageTitle.trim()) return;
    
    try {
      const pageId = await createPage(currentUser.uid, newPageTitle.trim());
      setShowNewPageModal(false);
      setNewPageTitle('');
      navigate(`/pages/${pageId}`);
    } catch (err) {
      console.error("Error creating page:", err);
      setError('Failed to create page');
    }
  };

  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    
    try {
      await deletePage(pageToDelete.id);
      setPages(pages.filter(page => page.id !== pageToDelete.id));
      setShowDeleteModal(false);
      setPageToDelete(null);
    } catch (err) {
      console.error("Error deleting page:", err);
      setError('Failed to delete page');
    }
  };

  const toggleFavorite = async (page: Page) => {
    try {
      await updatePage(page.id, { favorited: !page.favorited });
      setPages(pages.map(p => 
        p.id === page.id ? { ...p, favorited: !p.favorited } : p
      ));
    } catch (err) {
      console.error("Error updating page:", err);
    }
  };

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const favoritePages = filteredPages.filter(page => page.favorited);
  const otherPages = filteredPages.filter(page => !page.favorited);

  return (
    <Container className="py-4 page-list-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faBook} className="me-3 text-primary" size="lg" />
          <h2 className="mb-0">My Pages</h2>
        </div>
        <Button 
          variant="primary" 
          className="d-flex align-items-center"
          onClick={() => setShowNewPageModal(true)}
        >
          <span className="me-2">New Page</span>
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>

      <div className="mb-4">
        <InputGroup>
          <InputGroup.Text>
            <FontAwesomeIcon icon={faSearch} />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {favoritePages.length > 0 && (
            <div className="mb-4">
              <h5 className="mb-3 text-muted">
                <FontAwesomeIcon icon={faStar} className="me-2" />
                Favorites
              </h5>
              <ListGroup className="page-list">
                {favoritePages.map(page => (
                  <ListGroup.Item 
                    key={page.id}
                    className="page-item d-flex justify-content-between align-items-center"
                  >
                    <div 
                      className="page-title-area"
                      onClick={() => navigate(`/pages/${page.id}`)}
                    >
                      <div className="page-icon">
                        {page.emoji || <FontAwesomeIcon icon={faFile} />}
                      </div>
                      <span>{page.title}</span>
                    </div>
                    <div className="page-actions">
                      <Button 
                        variant="link"
                        className="star-button active"
                        onClick={() => toggleFavorite(page)}
                      >
                        <FontAwesomeIcon icon={faStar} />
                      </Button>
                      <Dropdown>
                        <Dropdown.Toggle variant="link" id={`dropdown-${page.id}`}>
                          <FontAwesomeIcon icon={faEllipsisV} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end">
                          <Dropdown.Item onClick={() => navigate(`/pages/${page.id}`)}>
                            <FontAwesomeIcon icon={faEdit} className="me-2" />
                            Edit
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => {
                              setPageToDelete(page);
                              setShowDeleteModal(true);
                            }}
                            className="text-danger"
                          >
                            <FontAwesomeIcon icon={faTrash} className="me-2" />
                            Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          <div>
            <h5 className="mb-3 text-muted">
              <FontAwesomeIcon icon={faFile} className="me-2" />
              All Pages
            </h5>
            {otherPages.length === 0 && filteredPages.length === 0 ? (
              <Card className="text-center py-5">
                <Card.Body>
                  <FontAwesomeIcon icon={faFile} size="2x" className="text-muted mb-3" />
                  <p className="mb-4">You don't have any pages yet</p>
                  <Button 
                    variant="primary"
                    onClick={() => setShowNewPageModal(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Create your first page
                  </Button>
                </Card.Body>
              </Card>
            ) : otherPages.length === 0 && searchQuery ? (
              <Card className="text-center py-4">
                <Card.Body>
                  <p className="text-muted">No pages match your search</p>
                </Card.Body>
              </Card>
            ) : (
              <ListGroup className="page-list">
                {otherPages.map(page => (
                  <ListGroup.Item 
                    key={page.id}
                    className="page-item d-flex justify-content-between align-items-center"
                  >
                    <div 
                      className="page-title-area"
                      onClick={() => navigate(`/pages/${page.id}`)}
                    >
                      <div className="page-icon">
                        {page.emoji || <FontAwesomeIcon icon={faFile} />}
                      </div>
                      <span>{page.title}</span>
                    </div>
                    <div className="page-actions">
                      <Button 
                        variant="link"
                        className="star-button"
                        onClick={() => toggleFavorite(page)}
                      >
                        <FontAwesomeIcon icon={faStar} />
                      </Button>
                      <Dropdown>
                        <Dropdown.Toggle variant="link" id={`dropdown-${page.id}`}>
                          <FontAwesomeIcon icon={faEllipsisV} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end">
                          <Dropdown.Item onClick={() => navigate(`/pages/${page.id}`)}>
                            <FontAwesomeIcon icon={faEdit} className="me-2" />
                            Edit
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => {
                              setPageToDelete(page);
                              setShowDeleteModal(true);
                            }}
                            className="text-danger"
                          >
                            <FontAwesomeIcon icon={faTrash} className="me-2" />
                            Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </>
      )}

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
            disabled={!newPageTitle.trim()}
          >
            Create Page
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Page</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{pageToDelete?.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeletePage}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};