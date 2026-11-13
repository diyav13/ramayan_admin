import { createSessionCache } from "@/lib/api/session-cache";
import type { Chapter } from "@/types/chapter";

/**
 * Shared chapters list for the admin session — used by Chapters page and
 * Quizzes (and any other consumers) so navigating between tabs does not
 * refetch /chapters/admin/allchapters.
 */
const chaptersCache = createSessionCache<Chapter[]>("chapters");

export function getCachedChapters(): Chapter[] | null {
  return chaptersCache.get()?.data ?? null;
}

export function setCachedChapters(list: Chapter[]): void {
  chaptersCache.set(list);
}

export function updateCachedChapters(
  updater: (list: Chapter[]) => Chapter[]
): void {
  const current = getCachedChapters();
  if (!current) return;
  chaptersCache.set(updater(current));
}

export function clearCachedChapters(): void {
  chaptersCache.clear();
}
