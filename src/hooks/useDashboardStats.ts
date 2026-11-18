"use client";

import { useEffect, useState } from "react";
import { createInflightDedupe } from "@/lib/api/inflight";
import { createSessionCache } from "@/lib/api/session-cache";
import { getErrorMessage } from "@/lib/api/errors";
import { dashboardService } from "@/services/dashboard";
import type { DashboardStats } from "@/types/dashboard";

type StatsPayload = {
  data: DashboardStats | null;
  error: string | null;
};

const fetchStatsOnce = createInflightDedupe<DashboardStats>();
const statsCache = createSessionCache<StatsPayload>("dashboard-stats");

export function useDashboardStats() {
  const initial = statsCache.get();
  const [stats, setStats] = useState<DashboardStats | null>(
    () => initial?.data.data ?? null
  );
  const [loading, setLoading] = useState(() => !initial?.data.data);
  const [error, setError] = useState<string | null>(
    () => initial?.data.error ?? null
  );

  useEffect(() => {
    const cached = statsCache.get();
    if (cached?.data.data) {
      setStats(cached.data.data);
      setError(cached.data.error);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStatsOnce(() => dashboardService.getStats());
        if (cancelled) return;
        statsCache.set({ data, error: null });
        setStats(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(err, "Failed to load dashboard stats");
        if (!statsCache.get()?.data.data) {
          statsCache.set({ data: null, error: message });
          setStats(null);
        }
        setError(message);
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
