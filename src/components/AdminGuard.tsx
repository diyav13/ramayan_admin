"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_ROLE } from "@/lib/auth/constants";

/**
 * Client-side guard: redirects non-admin users away from the dashboard.
 * Complements server-side session cookie checks in proxy.ts.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== ADMIN_ROLE) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== ADMIN_ROLE) {
    return null;
  }

  return <>{children}</>;
}
