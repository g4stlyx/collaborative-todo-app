import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { SignUp } from './components/Auth/SignUp';
import { Login } from './components/Auth/Login';
import { TodoList } from './components/Todo/TodoList';
import { Navigation } from './components/Navigation';
import { Profile } from './components/Profile/Profile';
import { FriendTodos } from './components/Todo/FriendTodos';
import { Friends } from './components/Friends/Friends';
import { PageList } from './components/Pages/PageList';
import { PageEditor } from './components/Pages/PageEditor';
import { PageLayout } from './components/Pages/PageLayout';

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
          
          {/* Updated Pages routes using PageLayout */}
          <Route 
            path="/pages" 
            element={
              <ProtectedRoute>
                <PageLayout>
                  <PageList />
                </PageLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pages/:pageId" 
            element={
              <ProtectedRoute>
                <PageLayout>
                  <PageEditor />
                </PageLayout>
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