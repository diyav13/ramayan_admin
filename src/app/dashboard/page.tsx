"use client";

import { ErrorBanner } from "@/components/ErrorBanner";
import { useDashboardStats } from "@/hooks/useDashboardStats";

function formatCount(value: number): string {
  return value.toLocaleString();
}

const STAT_META = [
  {
    key: "totalUsers" as const,
    label: "Total Users",
    hint: "Registered accounts",
  },
  {
    key: "publishedChapters" as const,
    label: "Active Chapters",
    hint: "Published in catalog",
  },
  {
    key: "totalEpisodes" as const,
    label: "Episodes",
    hint: "Across all chapters",
  },
  {
    key: "premiumSubscribers" as const,
    label: "Subscribers",
    hint: "Premium active",
  },
];

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
      {error && <ErrorBanner message={error} />}

      <section
        aria-label="Key metrics"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        {STAT_META.map((meta) => (
          <StatCard
            key={meta.key}
            label={meta.label}
            hint={meta.hint}
            value={stats ? formatCount(stats[meta.key]) : undefined}
            loading={loading && !stats}
          />
        ))}
      </section>
    </div>
  );
}

function StatCard({
  label,
  hint,
  value,
  loading,
}: {
  label: string;
  hint: string;
  value?: string;
  loading: boolean;
}) {
  return (
    <div className="rounded border border-[var(--gold-border)]/25 bg-[var(--surface-alt)]/90 p-3.5 sm:p-5">
      <p className="label-text text-[10px] sm:text-[11px]">{label}</p>
      {loading ? (
        <div
          className="mt-3 h-8 w-20 animate-pulse rounded bg-white/10 sm:h-9 sm:w-24"
          aria-hidden
        />
      ) : (
        <p className="mt-2 text-[1.75rem] font-semibold tabular-nums tracking-[-0.02em] sm:text-[2.125rem]">
          {value ?? "—"}
        </p>
      )}
      <p className="subtitle-text mt-2 text-[11px] sm:text-xs">{hint}</p>
    </div>
  );
}
