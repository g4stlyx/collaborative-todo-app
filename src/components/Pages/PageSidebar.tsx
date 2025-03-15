import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserPages, getSharedPages } from '../../services/pageService';
import { useAuth } from '../../contexts/AuthContext';
import { Page } from '../../models/page';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronRight, 
  faChevronDown, 
  faPlus, 
  faFile,
  faUserFriends,
  faFolder,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import '../../style/PageSidebar.css';
import { Button } from 'react-bootstrap';

interface PageSidebarProps {
  onCreatePage: () => void;
}

const PageSidebar: React.FC<PageSidebarProps> = ({ onCreatePage }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { pageId } = useParams<{ pageId: string }>();
  
  const [userPages, setUserPages] = useState<Page[]>([]);
  const [sharedPages, setSharedPages] = useState<Page[]>([]);
  const [myPagesExpanded, setMyPagesExpanded] = useState(true);
  const [sharedPagesExpanded, setSharedPagesExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        // Get user's own pages
        const myPages = await getUserPages(currentUser.uid);
        setUserPages(myPages);
        
        // Get pages shared with the user
        const shared = await getSharedPages(currentUser.uid);
        setSharedPages(shared);
      } catch (error) {
        console.error("Error fetching pages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [currentUser]);

  const favoritePages = userPages.filter(page => page.favorited);
  const regularPages = userPages.filter(page => !page.favorited);

  return (
    <div className="page-sidebar">
      <div className="sidebar-header">
        <h5>Pages</h5>
        <Button variant="light" size="sm" className="add-page-btn" onClick={onCreatePage}>
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
      
      {loading ? (
        <div className="sidebar-loading">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Favorites Section */}
          {favoritePages.length > 0 && (
            <div className="sidebar-section">
              <div 
                className="section-header" 
                onClick={() => setFavoritesExpanded(!favoritesExpanded)}
              >
                <FontAwesomeIcon 
                  icon={favoritesExpanded ? faChevronDown : faChevronRight} 
                  className="section-icon" 
                />
                <span><FontAwesomeIcon icon={faStar} className="star-icon me-2" /> Favorites</span>
              </div>
              
              {favoritesExpanded && (
                <ul className="page-list">
                  {favoritePages.map(page => (
                    <li 
                      key={page.id}
                      className={`page-item ${pageId === page.id ? 'active' : ''}`}
                      onClick={() => navigate(`/pages/${page.id}`)}
                    >
                      <FontAwesomeIcon icon={faFile} className="me-2 text-muted" />
                      <span className="page-title">{page.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* My Pages Section */}
          <div className="sidebar-section">
            <div 
              className="section-header" 
              onClick={() => setMyPagesExpanded(!myPagesExpanded)}
            >
              <FontAwesomeIcon 
                icon={myPagesExpanded ? faChevronDown : faChevronRight} 
                className="section-icon" 
              />
              <span><FontAwesomeIcon icon={faFolder} className="me-2" /> My Pages</span>
            </div>
            
            {myPagesExpanded && (
              <ul className="page-list">
                {regularPages.length > 0 ? (
                  regularPages.map(page => (
                    <li 
                      key={page.id}
                      className={`page-item ${pageId === page.id ? 'active' : ''}`}
                      onClick={() => navigate(`/pages/${page.id}`)}
                    >
                      <FontAwesomeIcon icon={faFile} className="me-2 text-muted" />
                      <span className="page-title">{page.title}</span>
                    </li>
                  ))
                ) : (
                  <li className="empty-message">No pages yet</li>
                )}
              </ul>
            )}
          </div>
          
          {/* Shared Pages Section */}
          <div className="sidebar-divider"></div>
          <div className="sidebar-section">
            <div 
              className="section-header" 
              onClick={() => setSharedPagesExpanded(!sharedPagesExpanded)}
            >
              <FontAwesomeIcon 
                icon={sharedPagesExpanded ? faChevronDown : faChevronRight} 
                className="section-icon" 
              />
              <span><FontAwesomeIcon icon={faUserFriends} className="me-2" /> Shared With Me</span>
            </div>
            
            {sharedPagesExpanded && (
              <ul className="page-list">
                {sharedPages.length > 0 ? (
                  sharedPages.map(page => (
                    <li 
                      key={page.id}
                      className={`page-item ${pageId === page.id ? 'active' : ''}`}
                      onClick={() => navigate(`/pages/${page.id}`)}
                    >
                      <FontAwesomeIcon icon={faFile} className="me-2 text-muted" />
                      <span className="page-title">{page.title}</span>
                    </li>
                  ))
                ) : (
                  <li className="empty-message">No shared pages</li>
                )}
              </ul>
            )}
          </div>
          
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="new-page-btn"
            onClick={onCreatePage}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Page
          </Button>
        </>
      )}
    </div>
  );
};

export default PageSidebar;