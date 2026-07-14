"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient } from "./api";
import type { AuthResponse, User } from "@/types";

const AUTH_STORAGE_KEY = "interview-platform-auth";

interface StoredAuth {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setAuth(JSON.parse(stored) as StoredAuth);
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const saveAuth = (response: AuthResponse) => {
    const nextAuth = { token: response.data.token, user: response.data.user };
    setAuth(nextAuth);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  };

  const value = useMemo<AuthContextValue>(() => ({
    user: auth?.user ?? null,
    token: auth?.token ?? null,
    isLoading,
    login: async (email, password) => saveAuth(await apiClient<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })),
    signup: async (name, email, password) => saveAuth(await apiClient<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) })),
    logout: () => {
      setAuth(null);
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    },
  }), [auth, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
