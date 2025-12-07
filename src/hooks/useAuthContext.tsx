"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { UserProfile } from '@/types';

export interface AppUser {
    id: string;
    email?: string;
    emailConfirmedAt?: string | null;
    profile?: UserProfile;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  refetchUserData: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    isLoading: true,
    refetchUserData: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      console.log('AuthContext: Fetching user from /api/auth/me');
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Important: send cookies
      });
      
      if (!response.ok) {
        console.log('AuthContext: API response not ok:', response.status);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('AuthContext: Received user data:', data.user?.id || 'null');
      
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("AuthContext: Error fetching user data:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();

    // Listen for custom logout/login events
    const handleAuthChange = () => {
      setIsLoading(true);
      fetchUserData();
    };
    
    window.addEventListener('refetchUser', handleAuthChange);
    window.addEventListener('userLoggedIn', handleAuthChange);
    window.addEventListener('userLoggedOut', () => {
      setUser(null);
      setIsLoading(false);
    });

    return () => {
      window.removeEventListener('refetchUser', handleAuthChange);
      window.removeEventListener('userLoggedIn', handleAuthChange);
      window.removeEventListener('userLoggedOut', () => {});
    };
  }, [fetchUserData]);
  
  const refetchUserData = useCallback(async () => {
    setIsLoading(true);
    await fetchUserData();
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
