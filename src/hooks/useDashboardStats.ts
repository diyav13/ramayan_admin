"use client";

import { useEffect, useState } from "react";
import { createInflightDedupe } from "@/lib/api/inflight";
import { getErrorMessage } from "@/lib/api/errors";
import { dashboardService } from "@/services/dashboard";
import type { DashboardStats } from "@/types/dashboard";

const fetchStatsOnce = createInflightDedupe<DashboardStats>();

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchStatsOnce(() => dashboardService.getStats());
        if (cancelled) return;
        setStats(data);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load dashboard stats"));
        setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, error };
}
