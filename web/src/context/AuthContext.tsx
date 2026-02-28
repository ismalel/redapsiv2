import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from '../utils/auth-storage';
import { authApi } from '../api/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  must_change_password: boolean;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authStorage.getUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = authStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any): Promise<User> => {
    try {
      const response = await authApi.login(credentials);
      const { user, access_token, refresh_token } = response.data;
      
      authStorage.setAccessToken(access_token);
      authStorage.setRefreshToken(refresh_token);
      authStorage.setUser(user);
      
      setUser(user);
      return user;
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

  const updateUser = (updatedUser: User) => {
    authStorage.setUser(updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
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
