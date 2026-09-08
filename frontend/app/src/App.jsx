import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* A chat is addressable, so a link to one survives a reload and can
              be shared with the people who are in it. */}
          <Route
            path="/chats/:chatId?"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* The prototype's route. Kept as a redirect so an open tab or a
              bookmark does not land on the sign-in page. */}
          <Route path="/dashboard" element={<Navigate to="/chats" replace />} />

          <Route path="*" element={<Navigate to="/chats" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
