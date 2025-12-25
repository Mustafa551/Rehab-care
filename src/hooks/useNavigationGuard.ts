import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function useNavigationGuard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Prevent back navigation to login page for authenticated users
    const handleBeforeUnload = () => {
      // Clear any login-related history
      if (window.history.length > 1) {
        window.history.replaceState(null, '', location.pathname);
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      const currentPath = window.location.pathname;
      
      // If authenticated user tries to go back to login, redirect to dashboard
      if (currentPath === '/login' || currentPath === '/') {
        event.preventDefault();
        navigate('/dashboard', { replace: true });
      }
    };

    // Handle browser refresh
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Handle back/forward navigation
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, navigate, location.pathname]);

  // Function to safely navigate and prevent back navigation
  const navigateWithoutBack = (to: string) => {
    navigate(to, { replace: true });
    // Clear history to prevent back navigation
    window.history.replaceState(null, '', to);
  };

  return { navigateWithoutBack };
}