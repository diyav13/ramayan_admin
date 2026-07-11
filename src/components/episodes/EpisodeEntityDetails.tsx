"use client";

import { useState } from "react";
import {
  resolveEpisodeCharacterNames,
  resolveEpisodeLocationNames,
} from "@/lib/episodes";
import type { EpisodeListItem } from "@/types/episode";

type NamedEntity = { id: string; name: string };

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

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[11px] leading-snug">
      <span className="text-[var(--text-muted)]">{label} · </span>
      <span className="text-white/55">{value}</span>
    </p>
  );
}

function countEntities(
  entities: { id: string }[] | undefined,
  ids: string[] | undefined
): number {
  if (entities && entities.length > 0) return entities.length;
  return ids?.length ?? 0;
}

export function EpisodeEntityDetails({
  episode,
  characters,
  locations,
}: {
  episode: EpisodeListItem;
  characters: NamedEntity[];
  locations: NamedEntity[];
}) {
  const [expanded, setExpanded] = useState(false);

  const characterCount = countEntities(
    episode.characters,
    episode.characterIds
  );
  const locationCount = countEntities(episode.locations, episode.locationIds);
  const total = characterCount + locationCount;

  if (total === 0) {
    return null;
  }

  const summaryParts: string[] = [];
  if (characterCount > 0) {
    summaryParts.push(
      `${characterCount} ${characterCount === 1 ? "character" : "characters"}`
    );
  }
  if (locationCount > 0) {
    summaryParts.push(
      `${locationCount} ${locationCount === 1 ? "location" : "locations"}`
    );
  }

  const characterNames = resolveEpisodeCharacterNames(episode, characters);
  const locationNames = resolveEpisodeLocationNames(episode, locations);

  return (
    <div className="mt-1">
      <p className="truncate text-[11px] text-white/45">
        {summaryParts.join(" · ")}
      </p>

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="mt-0.5 flex max-w-full items-center gap-1 text-left text-[11px] text-[var(--gold)] transition hover:text-[var(--gold)]/80"
      >
        <ChevronIcon expanded={expanded} />
        <span className="truncate">
          {expanded ? "Hide details" : "Show details"}
        </span>
      </button>

      {expanded ? (
        <div className="mt-1 space-y-0.5">
          {characterCount > 0 ? (
            <MetaLine label="Characters" value={characterNames} />
          ) : null}
          {locationCount > 0 ? (
            <MetaLine label="Locations" value={locationNames} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
