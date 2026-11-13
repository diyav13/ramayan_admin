"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(
    () => initial?.data.error ?? null
  );
  const [fetchedAt, setFetchedAt] = useState<number | null>(
    () => initial?.fetchedAt ?? null
  );

  const load = useCallback(async (force = false) => {
    const cached = statsCache.get();
    if (!force && cached?.data.data) {
      setStats(cached.data.data);
      setError(cached.data.error);
      setFetchedAt(cached.fetchedAt);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const hasCached = Boolean(cached?.data.data);
    if (hasCached) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchStatsOnce(() => dashboardService.getStats());
      statsCache.set({ data, error: null });
      setStats(data);
      setError(null);
      setFetchedAt(Date.now());
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load dashboard stats");
      if (!statsCache.get()?.data.data) {
        statsCache.set({ data: null, error: message });
        setStats(null);
      }
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { stats, loading, refreshing, error, fetchedAt, refresh };
}
