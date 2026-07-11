"use client";

import { useState } from "react";
import {
  getLatestEpisode,
  getUserProgress,
  userHasProgress,
} from "@/lib/user-progress";
import type { User } from "@/types/user";

function formatList(items: string[], maxVisible = 2): string {
  if (items.length === 0) return "";
  if (items.length <= maxVisible) return items.join(", ");
  return `${items.slice(0, maxVisible).join(", ")} +${items.length - maxVisible} more`;
}

function MetaLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <p className="text-[11px] leading-snug">
      <span className="text-[var(--text-muted)]">{label} · </span>
      <span className="text-white/55">{value}</span>
    </p>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${expanded ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function NoProgressLabel() {
  return (
    <p className="mt-1 truncate text-[11px] text-white/45">No progress</p>
  );
}

function buildProgressSummary(user: User): string {
  const progress = getUserProgress(user);
  const latestEpisode = getLatestEpisode(progress);
  const parts: string[] = [];

  if (progress.summary.completedChapters > 0) {
    parts.push(
      `${progress.summary.completedChapters}/${progress.summary.totalChapters} chapters`
    );
  }

  if (progress.summary.completedEpisodes > 0) {
    parts.push(
      `${progress.summary.completedEpisodes}/${progress.summary.totalEpisodes} episodes`
    );
  }

  if (progress.rewards.length > 0) {
    parts.push(
      `${progress.rewards.length} ${progress.rewards.length === 1 ? "reward" : "rewards"}`
    );
  }

  if (latestEpisode) {
    return parts.length > 0
      ? `${parts.join(" · ")} · Latest: ${latestEpisode.title}`
      : `Latest: ${latestEpisode.title}`;
  }

  return parts.join(" · ");
}

export function UserProgressDetails({ user }: { user: User }) {
  const [expanded, setExpanded] = useState(false);

  if (!userHasProgress(user)) {
    return <NoProgressLabel />;
  }

  const progress = getUserProgress(user);
  const latestEpisode = getLatestEpisode(progress);

  const chapters = formatList(
    progress.chapters
      .filter((chapter) => chapter.completedEpisodes > 0)
      .map(
        (chapter) =>
          `${chapter.title} (${chapter.completedEpisodes}/${chapter.totalEpisodes})`
      )
  );

  const episodeTitles = progress.episodes.map((episode) => episode.title);
  const episodes = latestEpisode
    ? `${latestEpisode.title}${
        episodeTitles.length > 1 ? `, ${episodeTitles.length} completed` : ""
      }`
    : formatList(episodeTitles);

  const rewards = formatList(
    progress.rewards.map(
      (reward) => `${reward.activity.title} (${reward.activity.type})`
    )
  );

  const summary = buildProgressSummary(user);

  return (
    <div className="mt-1">
      <p className="truncate text-[11px] text-white/45">{summary}</p>

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="mt-0.5 flex max-w-full items-center gap-1 text-left text-[11px] text-[var(--gold)] transition hover:text-[var(--gold)]/80"
      >
        <ChevronIcon expanded={expanded} />
        <span className="truncate">
          {expanded ? "Hide progress" : "Show progress"}
        </span>
      </button>

      {expanded && (
        <div className="mt-1 space-y-0.5">
          <MetaLine label="Chapters" value={chapters} />
          <MetaLine label="Episodes" value={episodes} />
          <MetaLine label="Rewards" value={rewards} />
        </div>
      )}
    </div>
  );
}
