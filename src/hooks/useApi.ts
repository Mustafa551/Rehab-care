import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export function useApi() {
  const { logout } = useAuth();

  return {
    ...api,
    logout,
  };
}