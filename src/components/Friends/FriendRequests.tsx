import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faUserCheck, 
  faUserTimes, 
  faUserClock,
  faEnvelope,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import '../../style/FriendRequests.css';

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
  fromEmail: string;
  toEmail: string;
}

interface User {
  name: string;
  email: string;
}

export const FriendRequests = () => {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [requestUsers, setRequestUsers] = useState<Record<string, User>>({});
  const [success, setSuccess] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Get received friend requests
    const receivedQuery = query(
      collection(db, 'friendRequests'),
      where('to', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    // Get sent friend requests
    const sentQuery = query(
      collection(db, 'friendRequests'),
      where('from', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeReceived = onSnapshot(receivedQuery, async (snapshot) => {
      const newRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FriendRequest));
      setReceivedRequests(newRequests);
      await fetchUserDetails(newRequests);
    });

    const unsubscribeSent = onSnapshot(sentQuery, async (snapshot) => {
      const newRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FriendRequest));
      setSentRequests(newRequests);
      await fetchUserDetails(newRequests);
    });

    return () => {
      unsubscribeReceived();
      unsubscribeSent();
    };
  }, [currentUser]);

  const fetchUserDetails = async (requests: FriendRequest[]) => {
    const users: Record<string, User> = {};
    for (const request of requests) {
      const userId = request.from === currentUser?.uid ? request.to : request.from;
      if (!requestUsers[userId]) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          users[userId] = userDoc.data() as User;
        }
      }
    }
    setRequestUsers(prev => ({ ...prev, ...users }));
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!currentUser) return;

    try {
      const requestRef = doc(db, 'friendRequests', request.id);
      await updateDoc(requestRef, { status: 'accepted' });

      const currentUserRef = doc(db, 'users', currentUser.uid);
      const otherUserRef = doc(db, 'users', request.from);

      await updateDoc(currentUserRef, {
        friends: arrayUnion(request.from)
      });

      await updateDoc(otherUserRef, {
        friends: arrayUnion(currentUser.uid)
      });

      setSuccess('Friend request accepted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
      setSuccess('Friend request cancelled successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error cancelling friend request:', error);
    }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    if (!currentUser) return;

    try {
      const requestRef = doc(db, 'friendRequests', request.id);
      await updateDoc(requestRef, { status: 'rejected' });
      setSuccess('Friend request rejected successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <FontAwesomeIcon icon={faUserPlus} className="me-3 text-primary" size="lg" />
        <h2 className="mb-0">Friend Requests</h2>
      </div>

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
        </div>
      )}

      <Row>
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-primary text-white d-flex align-items-center">
              <FontAwesomeIcon icon={faUserClock} className="me-2" />
              <h5 className="mb-0">Received Requests</h5>
            </Card.Header>
            <Card.Body>
              {receivedRequests.length === 0 ? (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faUserClock} size="2x" className="text-muted mb-3" />
                  <p className="text-muted mb-0">No pending friend requests received</p>
                </div>
              ) : (
                receivedRequests.map(request => (
                  <Card key={request.id} className="request-card mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-2">{requestUsers[request.from]?.name || 'Unknown User'}</h5>
                          <div className="d-flex align-items-center text-muted mb-3">
                            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                            <span>{request.fromEmail}</span>
                          </div>
                        </div>
                        <Badge bg="warning">Pending</Badge>
                      </div>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="success"
                          size="sm"
                          onClick={() => handleAcceptRequest(request)}
                          className="flex-grow-1"
                        >
                          <FontAwesomeIcon icon={faUserCheck} className="me-2" />
                          Accept
                        </Button>
                        <Button 
                          variant="danger"
                          size="sm"
                          onClick={() => handleRejectRequest(request)}
                          className="flex-grow-1"
                        >
                          <FontAwesomeIcon icon={faUserTimes} className="me-2" />
                          Reject
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-info text-white d-flex align-items-center">
              <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
              <h5 className="mb-0">Sent Requests</h5>
            </Card.Header>
            <Card.Body>
              {sentRequests.length === 0 ? (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faPaperPlane} size="2x" className="text-muted mb-3" />
                  <p className="text-muted mb-0">No pending friend requests sent</p>
                </div>
              ) : (
                sentRequests.map(request => (
                  <Card key={request.id} className="request-card mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-2">{requestUsers[request.to]?.name || 'Unknown User'}</h5>
                          <div className="d-flex align-items-center text-muted mb-3">
                            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                            <span>{request.toEmail}</span>
                          </div>
                        </div>
                        <Badge bg="warning">Pending</Badge>
                      </div>
                      <Button 
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelRequest(request.id)}
                        className="w-100"
                      >
                        <FontAwesomeIcon icon={faUserTimes} className="me-2" />
                        Cancel Request
                      </Button>
                    </Card.Body>
                  </Card>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}; 