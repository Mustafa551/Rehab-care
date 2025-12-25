import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function usePreventBack() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Replace the current history entry to prevent going back to login
      window.history.replaceState(null, '', location.pathname);
      
      // Add a new entry to prevent back navigation
      const handlePopState = (event: PopStateEvent) => {
        // If user tries to go back and they're authenticated, redirect to dashboard
        if (isAuthenticated) {
          navigate('/dashboard', { replace: true });
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isAuthenticated, navigate, location.pathname]);
}