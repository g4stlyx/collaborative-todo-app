import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { Container, Row, Col, Card, Form, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import '../../style/FriendTodos.css';

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  ownerId: string;
  createdAt: any;
}

interface User {
  name: string;
  email: string;
}

export const FriendTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [selectedFriend, setSelectedFriend] = useState<string>('all');
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const fetchFriendTodos = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const friends = userDoc.data()?.friends || [];

      if (friends.length === 0) {
        setTodos([]);
        return;
      }

      const q = query(
        collection(db, 'todos'),
        where('ownerId', 'in', friends)
      );

      return onSnapshot(q, async (snapshot) => {
        const newTodos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Todo));

        newTodos.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

        const userDetails: Record<string, User> = {};
        for (const todo of newTodos) {
          if (!users[todo.ownerId]) {
            const userDoc = await getDoc(doc(db, 'users', todo.ownerId));
            if (userDoc.exists()) {
              userDetails[todo.ownerId] = userDoc.data() as User;
            }
          }
        }
        setUsers(prev => ({ ...prev, ...userDetails }));
        setTodos(newTodos);
      });
    };

    let unsubscribe: (() => void) | undefined;
    fetchFriendTodos().then(unsub => {
      unsubscribe = unsub;
    });    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const filteredTodos = selectedFriend === 'all' 
    ? todos 
    : todos.filter(todo => todo.ownerId === selectedFriend);

  const uniqueFriends = [...new Set(todos.map(todo => todo.ownerId))];

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Friends' Todos</h2>
        <Form.Select 
          value={selectedFriend}
          onChange={(e) => setSelectedFriend(e.target.value)}
          style={{ width: 'auto' }}
          className="friend-select"
        >
          <option value="all">All Friends</option>
          {uniqueFriends.map(friendId => (
            <option key={friendId} value={friendId}>
              {users[friendId]?.name || 'Unknown User'}
            </option>
          ))}
        </Form.Select>
      </div>

      {filteredTodos.length === 0 ? (
        <Card className="text-center">
          <Card.Body className="py-5">
            <FontAwesomeIcon icon={faUser} size="2x" className="text-muted mb-3" />
            <p className="mb-0 text-muted">No todos available from your friends</p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {filteredTodos.map(todo => (
            <Col key={todo.id} xs={12} md={6} lg={4} className="mb-4">
              <Card className="h-100 todo-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="mb-0">{todo.title}</h5>
                    <Badge 
                      bg={todo.completed ? 'success' : 'warning'}
                      className="ms-2"
                    >
                      {todo.completed ? 
                        <><FontAwesomeIcon icon={faCheck} /> Complete</> : 
                        <><FontAwesomeIcon icon={faTimes} /> Pending</>
                      }
                    </Badge>
                  </div>
                  {todo.description && (
                    <p className="text-muted mb-3">{todo.description}</p>
                  )}
                  <div className="todo-footer">
                    <div className="owner-info">
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      {users[todo.ownerId]?.name || 'Unknown User'}
                    </div>
                    <small className="text-muted">
                      {new Date(todo.createdAt.seconds * 1000).toLocaleDateString()}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}; 