
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

// Pages
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import SessionsListPage from '@/pages/SessionsListPage';
import SessionPage from '@/pages/SessionPage';
import LiveAdminPage from '@/pages/LiveAdminPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Route Guards
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Navigation from '@/components/Navigation';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Protected Routes */}
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <SessionsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session/:sessionId"
            element={
              <ProtectedRoute>
                <SessionPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/live-admin/:sessionId"
            element={
              <AdminRoute>
                <LiveAdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/analytics/:sessionId"
            element={
              <AdminRoute>
                <AnalyticsPage />
              </AdminRoute>
            }
          />

          {/* Redirect root to sessions (protected) */}
          <Route path="/" element={<Navigate to="/sessions" replace />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;