import type {
  UserEpisodeProgress,
  UserProgress,
} from "@/types/user";

export const EMPTY_USER_PROGRESS: UserProgress = {
  summary: {
    totalChapters: 0,
    completedChapters: 0,
    totalEpisodes: 0,
    completedEpisodes: 0,
    overallPercentage: 0,
    totalPoints: 0,
  },
  chapters: [],
  episodes: [],
  rewards: [],
};

export function getUserProgress(
  user: { progress?: UserProgress } | null | undefined
): UserProgress {
  return user?.progress ?? EMPTY_USER_PROGRESS;
}

/** True when the user has completed at least one chapter/episode or earned a reward. */
export function userHasProgress(
  user: { progress?: UserProgress } | null | undefined
): boolean {
  const progress = user?.progress;
  if (!progress) return false;

  return (
    progress.summary.completedChapters > 0 ||
    progress.summary.completedEpisodes > 0 ||
    progress.episodes.length > 0 ||
    progress.rewards.length > 0
  );
}

export function getLatestEpisode(
  progress: UserProgress
): UserEpisodeProgress | null {
  if (!progress.episodes.length) return null;

  return [...progress.episodes].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];
}
