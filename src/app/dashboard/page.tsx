"use client";

import { useDashboardStats } from "@/hooks/useDashboardStats";

function formatCount(value: number): string {
  return value.toLocaleString();
}

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers },
    { label: "Active Chapters", value: stats?.publishedChapters },
    { label: "Episodes", value: stats?.totalEpisodes },
    { label: "Subscribers", value: stats?.premiumSubscribers },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Welcome back. Here&apos;s what&apos;s happening with Ramayana.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={
              loading
                ? "—"
                : stat.value !== undefined
                  ? formatCount(stat.value)
                  : "—"
            }
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--gold-border)]/30 bg-[var(--surface-alt)] p-5">
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p
        className={`mt-2 font-serif text-3xl ${loading ? "text-[var(--text-muted)]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
