"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, LoginCredentials } from "@/types/auth";
import { getErrorMessage } from "@/lib/api/errors";
import {
  getStoredUser,
  hasSession,
  login as loginRequest,
  logout as logoutRequest,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Survives Strict Mode remounts so AdminGuard does not flash loading twice. */
let authHydration: { user: AuthUser | null; ready: boolean } = {
  user: null,
  ready: false,
};

function readSessionUser(): AuthUser | null {
  const storedUser = getStoredUser();
  return storedUser && hasSession() ? storedUser : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() =>
    authHydration.ready ? authHydration.user : null
  );
  const [isLoading, setIsLoading] = useState(() => !authHydration.ready);

  useEffect(() => {
    if (authHydration.ready) {
      setUser(authHydration.user);
      setIsLoading(false);
      return;
    }

    const nextUser = readSessionUser();
    authHydration = { user: nextUser, ready: true };
    setUser(nextUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const data = await loginRequest(credentials);
    authHydration = { user: data.user, ready: true };
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    authHydration = { user: null, ready: true };
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}

export function getAuthErrorMessage(error: unknown): string {
  return getErrorMessage(error, "Authentication failed");
}
