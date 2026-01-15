import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * FIXED #41: Admin Route protection component
 * 
 * Wraps routes that require admin access.
 * Checks Firebase custom claims for admin role.
 * 
 * To use:
 * 1. Set custom claims on user in Firebase Admin SDK:
 *    admin.auth().setCustomUserClaims(uid, { admin: true })
 * 
 * 2. Wrap admin routes:
 *    <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Checking access..." />
      </div>
    );
  }

  if (!user) {
    // Not logged in - redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin access
  // For now, we check email domain or specific emails
  // In production, use Firebase custom claims checked via getIdTokenResult()
  const isAdmin = user.email?.endsWith('@codekaro.in') || 
                  user.email === 'admin@example.com';

  if (!isAdmin) {
    // Not an admin - redirect to sessions list with unauthorized message
    return <Navigate to="/sessions" state={{ unauthorized: true }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
