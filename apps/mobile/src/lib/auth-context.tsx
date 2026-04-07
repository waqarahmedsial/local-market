import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, tokenStorage } from '@/lib/api';
import type { User } from '@local-market/shared';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to restore session
    (async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          const me = await apiClient.auth.me();
          setUser(me);
        }
      } catch {
        await tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiClient.auth.login({ email, password });
    setUser(result.user);
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const result = await apiClient.auth.register({
      name,
      email,
      password,
      role: role as any,
    });
    setUser(result.user);
  };

  const logout = async () => {
    await apiClient.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
