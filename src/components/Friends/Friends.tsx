import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Modal,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserMinus,
  faUsers,
  faEnvelope,
  faUserPlus,
  faExclamationTriangle,
  faCheckCircle,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import { FriendRequests } from "./FriendRequests";
import "../../style/Friends.css";

interface Friend {
  id: string;
  name: string;
  email: string;
}

export const Friends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    fetchFriends();
  }, [currentUser]);

  const fetchFriends = async () => {
    if (!currentUser) return;

    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const friendIds = userDoc.data()?.friends || [];

    const friendsData = await Promise.all(
      friendIds.map(async (friendId: string) => {
        const friendDoc = await getDoc(doc(db, "users", friendId));
        return {
          id: friendId,
          ...friendDoc.data(),
        } as Friend;
      })
    );

    setFriends(friendsData);
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        friends: arrayRemove(friendId),
      });

      await updateDoc(doc(db, "users", friendId), {
        friends: arrayRemove(currentUser.uid),
      });

      setSuccess("Friend removed successfully");
      setTimeout(() => setSuccess(""), 3000);

      fetchFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be logged in");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Find user by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("User not found");
        return;
      }

      const targetUser = querySnapshot.docs[0];

      if (targetUser.id === currentUser.uid) {
        setError("Cannot send friend request to yourself");
        return;
      }

      // Check if already friends
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const currentFriends = userDoc.data()?.friends || [];
      if (currentFriends.includes(targetUser.id)) {
        setError("You are already friends with this user");
        return;
      }

      // Check if request already exists
      const requestsRef = collection(db, "friendRequests");
      const existingRequestQuery = query(
        requestsRef,
        where("from", "==", currentUser.uid),
        where("to", "==", targetUser.id),
        where("status", "==", "pending")
      );
      const existingRequests = await getDocs(existingRequestQuery);

      if (!existingRequests.empty) {
        setError("Friend request already sent");
        return;
      }

      // Create friend request
      await addDoc(collection(db, "friendRequests"), {
        from: currentUser.uid,
        to: targetUser.id,
        status: "pending",
        timestamp: new Date(),
        fromEmail: currentUser.email,
        toEmail: email.trim(),
      });

      setSuccess("Friend request sent successfully!");
      setEmail("");
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      setError(error.message || "Failed to send friend request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon
            icon={faUsers}
            className="me-3 text-primary"
            size="lg"
          />
          <h2 className="mb-0">My Friends</h2>
        </div>
        <div className="d-flex gap-3">
          <Button 
            variant="outline-primary" 
            className="d-flex align-items-center"
            onClick={() => setShowAddFriendModal(true)}
          >
            <span className="me-2">Add Friend</span>
            <FontAwesomeIcon icon={faUserPlus} />
          </Button>
          <Button 
            variant="outline-info" 
            className="d-flex align-items-center"
            onClick={() => setShowRequestsModal(true)}
          >
            <span className="me-2">Friend Requests</span>
            <FontAwesomeIcon icon={faBell} />
          </Button>
        </div>
      </div>

      {/* Friends List */}
      <Row>
        {friends.length === 0 ? (
          <Col xs={12}>
            <Card className="text-center">
              <Card.Body className="py-5">
                <FontAwesomeIcon
                  icon={faUsers}
                  size="2x"
                  className="text-muted mb-3"
                />
                <p className="mb-0 text-muted">
                  You haven't added any friends yet
                </p>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          friends.map((friend) => (
            <Col key={friend.id} xs={12} md={6} lg={4} className="mb-4">
              <Card className="friend-card h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h4 className="mb-2">{friend.name}</h4>
                      <div className="d-flex align-items-center text-muted">
                        <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                        <span>{friend.email}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="remove-friend-btn"
                    >
                      <FontAwesomeIcon icon={faUserMinus} className="me-2" />
                      Remove
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Add Friend Modal */}
      <Modal
        show={showAddFriendModal}
        onHide={() => setShowAddFriendModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Add Friend
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="d-flex align-items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              {success}
            </Alert>
          )}

          <Form onSubmit={handleSendRequest}>
            <Form.Group className="mb-3">
              <Form.Label>Friend's Email</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
                <Form.Control
                  type="email"
                  placeholder="Enter friend's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={isLoading}>
                <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                {isLoading ? "Sending..." : "Send Friend Request"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Friend Requests Modal */}
      <Modal
        show={showRequestsModal}
        onHide={() => setShowRequestsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faBell} className="me-2" />
            Friend Requests
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FriendRequests />
        </Modal.Body>
      </Modal>
    </Container>
  );
};
