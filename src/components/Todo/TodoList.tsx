import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { Card, Form, Button, Container, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faCheck, 
  faTimes, 
  faPlus,
  faList,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import '../../style/TodoList.css';

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  ownerId: string;
  sharedWith: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'todos'),
      where('ownerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTodos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Todo));
      
      newTodos.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      setTodos(newTodos);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleToggleComplete = async (todoId: string, currentStatus: boolean) => {
    if (!currentUser) return;

    try {
      const todoRef = doc(db, 'todos', todoId);
      await updateDoc(todoRef, {
        completed: !currentStatus,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error toggling todo:', error);
      alert('Failed to update todo status');
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTodoTitle.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'todos'), {
        title: newTodoTitle.trim(),
        description: newTodoDescription.trim(),
        completed: false,
        ownerId: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      setNewTodoTitle('');
      setNewTodoDescription('');
      setShowAddModal(false);
    } catch (error: any) {
      setError('Failed to add todo');
      console.error('Error adding todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTodo = async (todoId: string, ownerId: string) => {
    if (!currentUser || currentUser.uid !== ownerId) return;

    try {
      await deleteDoc(doc(db, 'todos', todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete todo');
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faList} className="me-3 text-primary" size="lg" />
          <h2 className="mb-0">My Todos</h2>
        </div>
        <Button 
          variant="primary" 
          className="d-flex align-items-center"
          onClick={() => setShowAddModal(true)}
        >
          <span className="me-2">Add Todo</span>
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>

      <Row>
        {todos.map(todo => (
          <Col key={todo.id} xs={12} md={6} lg={4} className="mb-4">
            <Card className={todo.completed ? 'bg-light todo-card' : 'todo-card'}>
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <div className="d-flex w-100">
                    <Form.Check
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo.id, todo.completed)}
                      className="me-3 mt-1"
                    />
                    <div className="todo-content">
                      <h5 className={`mb-2 text-break ${todo.completed ? 'text-muted text-decoration-line-through' : ''}`}>
                        {todo.title}
                      </h5>
                      <Badge 
                        bg={todo.completed ? 'success' : 'warning'} 
                        className="mb-2"
                      >
                        {todo.completed ? 
                          <><FontAwesomeIcon icon={faCheck} /> Complete</> : 
                          <><FontAwesomeIcon icon={faTimes} /> Pending</>
                        }
                      </Badge>
                      {todo.description && (
                        <p className="mb-0 text-muted text-break todo-description">
                          {todo.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteTodo(todo.id, todo.ownerId)}
                    className="ms-2 delete-btn"
                    style={{ height: 'fit-content' }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </Card.Body>
              <Card.Footer className="text-muted small">
                Created: {new Date(todo.createdAt.seconds * 1000).toLocaleString()}
              </Card.Footer>
            </Card>
          </Col>
        ))}
        {todos.length === 0 && (
          <Col xs={12}>
            <Card className="text-center">
              <Card.Body className="py-5">
                <FontAwesomeIcon icon={faList} size="2x" className="text-muted mb-3" />
                <p className="mb-0 text-muted">No todos yet. Add your first todo!</p>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Add Todo Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add New Todo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="d-flex align-items-center mb-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              {error}
            </Alert>
          )}
          
          <Form onSubmit={handleAddTodo}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="What needs to be done?"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Add more details..."
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
              />
            </Form.Group>

            <div className="d-grid">
              <Button 
                variant="primary" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Todo'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}; 