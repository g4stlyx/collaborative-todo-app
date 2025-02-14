import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute.tsx';
import { SignUp } from './components/Auth/SignUp';
import { Login } from './components/Auth/Login.tsx';
import { TodoList } from './components/Todo/TodoList';
import { Navigation } from './components/Navigation';
import { Profile } from './components/Profile/Profile';
import { FriendTodos } from './components/Todo/FriendTodos.tsx';
import { Friends } from './components/Friends/Friends';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/todos" 
            element={
              <ProtectedRoute>
                <TodoList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/friend-todos" 
            element={
              <ProtectedRoute>
                <FriendTodos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/friends" 
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/todos" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 