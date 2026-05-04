import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getStoredUser, logout as logoutService } from '../utils/authService';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  setAuthenticated: (authenticated: boolean, user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    
    if (token && storedUser) {
      setIsAuthenticatedState(true);
      setUser(storedUser);
    } else {
      setIsAuthenticatedState(false);
      setUser(null);
    }
    
    setIsLoading(false);
  }, []);

  const logout = () => {
    logoutService();
    setIsAuthenticatedState(false);
    setUser(null);
  };

  const setAuthenticated = (authenticated: boolean, newUser: User | null) => {
    setIsAuthenticatedState(authenticated);
    setUser(newUser);
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    logout,
    setAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
