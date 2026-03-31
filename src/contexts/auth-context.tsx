"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, Role } from "@/types";
import { userService, authService } from "@/services";

/** Returns the appropriate redirect path based on user role */
export function getRedirectByRole(user: User | null): string {
  return user?.role === Role.ADMIN ? "/admin" : "/";
}
import apiClient from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const userData = await userService.getProfile();
      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      apiClient.clearTokens();
      return null;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      await authService.login({ email, password });
      const userData = await refreshUser();
      if (!userData) throw new Error("Login failed");
      return userData;
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      apiClient.clearTokens();
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        await refreshUser();
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
