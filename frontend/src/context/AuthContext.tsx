import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';
import type { BackendUser, BackendFarmer, AuthSession } from '../services/authApi';

const TOKEN_STORAGE_KEY = 'kisanmarg_auth_token';

interface AuthContextType {
  user: BackendUser | null;
  farmer: BackendFarmer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithAuthData: (session: AuthSession, user: BackendUser, farmer: BackendFarmer | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<BackendUser | null>(null);
  const [farmer, setFarmer] = useState<BackendFarmer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verify and restore authenticated user identity on app mount or token change
  const restoreSession = useCallback(async (authToken: string) => {
    try {
      const response = await authApi.getCurrentUser(authToken);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setFarmer(response.data.farmer);
        setToken(authToken);
        localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
      } else {
        throw new Error('Invalid user profile response');
      }
    } catch {
      // Clear invalid/expired session
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
      setFarmer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
      restoreSession(savedToken);
    } else {
      setIsLoading(false);
    }
  }, [restoreSession]);

  const loginWithAuthData = useCallback(
    (session: AuthSession, userData: BackendUser, farmerData: BackendFarmer | null) => {
      setToken(session.access_token);
      setUser(userData);
      setFarmer(farmerData);
      localStorage.setItem(TOKEN_STORAGE_KEY, session.access_token);
    },
    []
  );

  const logout = useCallback(async () => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
    if (currentToken) {
      try {
        await authApi.logout(currentToken);
      } catch (err) {
        console.warn('Logout notification error:', err);
      }
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setFarmer(null);
  }, [token]);

  const refreshUser = useCallback(async () => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
    if (currentToken) {
      await restoreSession(currentToken);
    }
  }, [token, restoreSession]);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        farmer,
        token,
        isAuthenticated,
        isLoading,
        loginWithAuthData,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
