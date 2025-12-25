import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { api, ApiError } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('rehabUser');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('rehabUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await api.login(email, password);
      
      // Add computed properties for compatibility
      const userWithComputed = {
        ...response.user,
        name: `${response.user.firstName} ${response.user.lastName}`,
        role: response.user.email.includes('admin') ? 'admin' as const : 'staff' as const,
      };
      
      setUser(userWithComputed);
      
      // Store in localStorage
      localStorage.setItem('rehabUser', JSON.stringify(userWithComputed));
      
      // Clear browser history to prevent back navigation to login
      if (window.history.length > 1) {
        window.history.replaceState(null, '', '/dashboard');
      }
      
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      
      if (error instanceof ApiError) {
        // Handle specific API errors
        switch (error.status) {
          case 401:
            return { success: false, error: 'Invalid email or password' };
          case 400:
            return { success: false, error: 'Please check your email and password' };
          case 500:
            return { success: false, error: 'Server error. Please try again later.' };
          default:
            return { success: false, error: error.message || 'Login failed' };
        }
      }
      
      // Network or other errors
      return { 
        success: false, 
        error: 'Unable to connect to server. Please check your internet connection.' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rehabUser');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
