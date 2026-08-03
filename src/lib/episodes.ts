import type { Chapter } from "@/types/chapter";
import type { EpisodeEntityRef, EpisodeListItem } from "@/types/episode";

const DEFAULT_CHAPTER_ACCENT = "#666";

function chapterMap(chapters: Chapter[]): Map<string, Chapter> {
  return new Map(chapters.map((chapter) => [chapter.id, chapter]));
}

/** Chapter-filter API responses omit top-level chapterId — resolve from nested data or filter context. */
function resolveEpisodeChapterId(
  episode: EpisodeListItem,
  filterChapterId?: string
): string {
  return episode.chapterId ?? episode.chapter?.id ?? filterChapterId ?? "";
}

export function resolveEpisodeChapterTitle(
  episode: EpisodeListItem,
  chapters: Chapter[],
  filterChapterId?: string
): string {
  const chapterId = resolveEpisodeChapterId(episode, filterChapterId);
  return (
    episode.chapter?.title ??
    chapters.find((chapter) => chapter.id === chapterId)?.title ??
    "—"
  );
}

/** Episode list colors follow the parent chapter theme, not per-episode accent. */
export function resolveEpisodeChapterAccentColor(
  episode: EpisodeListItem,
  chapters: Chapter[],
  filterChapterId?: string
): string {
  const chapterId = resolveEpisodeChapterId(episode, filterChapterId);
  const chapter = chapters.find((item) => item.id === chapterId);
  return (
    episode.chapter?.accentColor ??
    chapter?.accentColor ??
    DEFAULT_CHAPTER_ACCENT
  );
}

/** Total episodes in the episode's chapter (for "2 of 5" list labels). */
export function resolveEpisodeChapterEpisodeCount(
  episode: EpisodeListItem,
  chapters: Chapter[],
  filterChapterId?: string,
  visibleItems?: EpisodeListItem[]
): number | null {
  const chapterId = resolveEpisodeChapterId(episode, filterChapterId);
  const chapter = chapters.find((item) => item.id === chapterId);

  if (chapter?._count?.episodes != null) {
    return chapter._count.episodes;
  }

  if (filterChapterId && visibleItems) {
    return visibleItems.length;
  }

  return null;
}

function formatEntityNames(
  entities: EpisodeEntityRef[] | undefined,
  ids: string[] | undefined,
  lookup: Map<string, string>
): string {
  if (entities && entities.length > 0) {
    return entities.map((item) => item.name).join(", ");
  }

  if (!ids || ids.length === 0) return "—";

  const names = ids
    .map((id) => lookup.get(id))
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names.join(", ") : "—";
}

export function resolveEpisodeCharacterNames(
  episode: EpisodeListItem,
  characters: { id: string; name: string }[]
): string {
  return formatEntityNames(
    episode.characters,
    episode.characterIds,
    new Map(characters.map((item) => [item.id, item.name]))
  );
}

export function resolveEpisodeLocationNames(
  episode: EpisodeListItem,
  locations: { id: string; name: string }[]
): string {
  return formatEntityNames(
    episode.locations,
    episode.locationIds,
    new Map(locations.map((item) => [item.id, item.name]))
  );
}

export function resolveEpisodeQuizInstructionLabels(
  episode: EpisodeListItem,
  quizInstructions: { id: string; instruction: string }[]
): string {
  const nested = episode.quizInstructions;
  if (nested && nested.length > 0) {
    return nested.map((item) => item.instruction).join(", ");
  }

  const ids = episode.quizInstructionIds;
  if (!ids || ids.length === 0) return "—";

  const lookup = new Map(
    quizInstructions.map((item) => [item.id, item.instruction])
  );
  const labels = ids
    .map((id) => lookup.get(id))
    .filter((label): label is string => Boolean(label));

  return labels.length > 0 ? labels.join(", ") : "—";
}

/** Normalize list rows so chapter metadata is consistent across paginated and chapter-filtered API shapes. */
export function normalizeEpisodeListItems(
  items: EpisodeListItem[],
  chapters: Chapter[],
  filterChapterId?: string
): EpisodeListItem[] {
  const byId = chapterMap(chapters);

  return items.map((item) => {
    const chapterId = resolveEpisodeChapterId(item, filterChapterId);
    const chapter = byId.get(chapterId);

    return {
      ...item,
      chapterId,
      characterIds:
        item.characterIds ?? item.characters?.map((entity) => entity.id) ?? [],
      locationIds:
        item.locationIds ?? item.locations?.map((entity) => entity.id) ?? [],
      quizInstructionIds:
        item.quizInstructionIds ??
        item.quizInstructions?.map((entity) => entity.id) ??
        [],
      chapter:
        item.chapter ??
        (chapter
          ? {
              id: chapter.id,
              title: chapter.title,
              orderIndex: chapter.orderIndex,
              isPremium: chapter.isPremium,
              accentColor: chapter.accentColor,
            }
          : undefined),
    };
  });
}
