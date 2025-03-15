import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../style/Navigation.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faListCheck, faUserFriends, faUser } from '@fortawesome/free-solid-svg-icons';

export const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/todos">TodoApp</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {currentUser ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/todos">
                  <FontAwesomeIcon icon={faListCheck} className="me-2" />
                  My Todos
                </Nav.Link>
                <Nav.Link as={Link} to="/pages">
                  <FontAwesomeIcon icon={faBook} className="me-2" />
                  My Pages
                </Nav.Link>
                <Nav.Link as={Link} to="/friend-todos">
                  <FontAwesomeIcon icon={faListCheck} className="me-2" />
                  Friends' Todos
                </Nav.Link>
                <Nav.Link as={Link} to="/friends">
                  <FontAwesomeIcon icon={faUserFriends} className="me-2" />
                  My Friends
                </Nav.Link>
              </Nav>
              <Nav>
                <Nav.Link as={Link} to="/profile">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Profile
                </Nav.Link>
                <Button 
                  variant="outline-light" 
                  onClick={handleLogout}
                  className="ms-2"
                >
                  Logout
                </Button>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
              <Nav.Link as={Link} to="/signup">Sign Up</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};