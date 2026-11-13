"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { clearAllSessionCaches } from "@/lib/api/session-cache";

type AdminCacheContextValue = {
  /** Wipe all dashboard list caches (also run automatically on logout). */
  clearAll: () => void;
};

const AdminCacheContext = createContext<AdminCacheContextValue | null>(null);

/**
 * Marks the dashboard shell as the cache boundary. Actual entries live in the
 * in-memory session-cache (cleared on browser refresh / logout); this context
 * exposes clear for logout / manual invalidation.
 */
export function AdminCacheProvider({ children }: { children: ReactNode }) {
  const clearAll = useCallback(() => {
    clearAllSessionCaches();
  }, []);

  const value = useMemo(() => ({ clearAll }), [clearAll]);

  return (
    <AdminCacheContext.Provider value={value}>
      {children}
    </AdminCacheContext.Provider>
  );
}

export function useAdminCache(): AdminCacheContextValue {
  const context = useContext(AdminCacheContext);
  if (!context) {
    throw new Error("useAdminCache must be used within AdminCacheProvider");
  }
  return context;
}
