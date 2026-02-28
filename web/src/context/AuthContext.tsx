import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from '../utils/auth-storage';
import { authApi } from '../api/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  must_change_password: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authStorage.getUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load check
    const storedUser = authStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await authApi.login(credentials);
      const { user, tokens } = response.data;
      
      authStorage.setAccessToken(tokens.access_token);
      authStorage.setRefreshToken(tokens.refresh_token);
      authStorage.setUser(user);
      
      setUser(user);
      return user; // Return user to handle redirection in component
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      authApi.logout(refreshToken).catch(console.error);
    }
    authStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
