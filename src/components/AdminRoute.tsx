
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface AdminRouteProps {
  children: React.JSX.Element;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;

      if (!user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const idTokenResult = await user.getIdTokenResult();
        // Check for 'admin' custom claim
        const hasAdminClaim = !!idTokenResult.claims.admin;
        setIsAdmin(hasAdminClaim);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  // Show loading spinner while Auth is loading OR while we are verifying the admin claim
  if (authLoading || checkingAdmin) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // If user is not authenticated or not an admin, redirect
  if (!user || !isAdmin) {
    // We can't easily toast during render or immediately before redirect in a clean way without useEffect, 
    // but <Navigate> is a component.
    // Better to trigger toast once.
    // However, react-router's Navigate is instantaneous.
    // Let's use an effect for the toast to avoid "cannot update while rendering" issues if possible,
    // or just render null and navigate imperatively. 
    // But the prompt implementation requested standard Navigate.
    // To show toast, we often do it before return or in an effect.
    // Let's just do it in the render logic? No, bad pattern. 
    // I'll add an effect to toast when access is denied.
    
    // Actually, simpler:
    // If I return <Navigate ... /> it redirects.
    // I will simply perform the toast in the effect where I set isAdmin to false?
    // No, `checkAdminStatus` is for state.
    
    // Let's wrap the redirect logic:
    return <AccessDeniedRedirect />;
  }

  return children;
};

// Helper component to handle side-effect (toast) and redirect
const AccessDeniedRedirect = () => {
  useEffect(() => {
    toast.error("Access denied");
  }, []);
  
  return <Navigate to="/sessions" replace />;
};

export default AdminRoute;
