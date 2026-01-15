
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import LoginPage from '@/pages/LoginPage';
import SessionsListPage from '@/pages/SessionsListPage';
import SessionPage from '@/pages/SessionPage';
import LiveAdminPage from '@/pages/LiveAdminPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Route Guards
import Navigation from '@/components/Navigation';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes - Temporarily Public or using simple check in Navigation? */}
          {/* Since we removed ProtectedRoute, we let sessions list be public or use minimal check */}
          <Route
            path="/sessions"
            element={<SessionsListPage />}
          />
          {/* Public Session Page - internally gated */}
          <Route
            path="/session/:sessionId"
            element={<SessionPage />}
          />

          {/* Admin Routes - Public as requested */}
          <Route
            path="/live-admin/:sessionId"
            element={<LiveAdminPage />}
          />
          <Route
            path="/analytics/:sessionId"
            element={<AnalyticsPage />}
          />

          {/* Redirect root to sessions */}
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