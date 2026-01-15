import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy Loaded Pages
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SessionsListPage = lazy(() => import('@/pages/SessionsListPage'));
const SessionPage = lazy(() => import('@/pages/SessionPage'));
const LiveAdminPage = lazy(() => import('@/pages/LiveAdminPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Route Guards
import Navigation from '@/components/Navigation';
import { usePageTracking } from '@/hooks/usePageTracking';

// Inner component to use hook inside Router
function AppContent() {
  usePageTracking();
  return (
    <>
        <a 
          href="#main-content" 
          className="absolute left-[-9999px] z-50 bg-background px-4 py-2 text-primary focus:left-4 focus:top-4 focus:shadow-lg focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <Navigation />
        <Suspense 
          fallback={
            <div className="flex min-h-[50vh] w-full items-center justify-center">
              <LoadingSpinner size="lg" text="Loading page..." />
            </div>
          }
        >
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
        </Suspense>
        <Toaster />
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;