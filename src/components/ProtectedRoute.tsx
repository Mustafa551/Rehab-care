import { ReactNode, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Prevent back navigation to login page
  useEffect(() => {
    if (isAuthenticated) {
      // Replace current history entry to prevent back navigation issues
      window.history.replaceState(null, '', location.pathname);
      
      const handlePopState = (event: PopStateEvent) => {
        // If user tries to navigate back and they're on a protected route,
        // prevent going to login page
        const currentPath = window.location.pathname;
        if (currentPath === '/login' && isAuthenticated) {
          event.preventDefault();
          navigate('/dashboard', { replace: true });
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isAuthenticated, navigate, location.pathname]);

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
