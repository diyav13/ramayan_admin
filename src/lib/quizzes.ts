import type { Chapter } from "@/types/chapter";
import type { EpisodeListItem } from "@/types/episode";
import type { QuizListItem, QuizType } from "@/types/quiz";

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  TRUE_FALSE: "True / False",
  MCQ: "MCQ",
  IMAGE_SEQUENCE: "Image sequence",
};

export function quizTypeLabel(type: QuizType): string {
  return QUIZ_TYPE_LABELS[type] ?? type;
}

/** Reorder image URLs into the correct answer sequence for the admin form. */
export function imagesInCorrectOrder(
  images: string[] | undefined,
  answer: boolean | number | number[] | undefined
): string[] {
  if (!images?.length) return [];
  if (!Array.isArray(answer) || answer.length === 0) return [...images];

  const ordered = answer
    .map((index) => images[index])
    .filter((url): url is string => Boolean(url));

  return ordered.length === images.length ? ordered : [...images];
}

export function resolveQuizChapterTitle(
  quiz: QuizListItem,
  chapters: Chapter[],
  filterChapterId?: string
): string {
  if (quiz.chapter?.title) return quiz.chapter.title;
  if (quiz.episode?.chapter?.title) return quiz.episode.chapter.title;
  const chapterId = quiz.chapterId ?? quiz.episode?.chapterId;
  if (filterChapterId) {
    const filtered = chapters.find((chapter) => chapter.id === filterChapterId);
    if (filtered) return filtered.title;
  }
  return chapters.find((chapter) => chapter.id === chapterId)?.title ?? "—";
}

export function resolveQuizEpisodeTitle(
  quiz: QuizListItem,
  episodes: EpisodeListItem[],
  filterEpisodeId?: string
): string {
  if (quiz.episode?.title) return quiz.episode.title;
  if (filterEpisodeId) {
    const filtered = episodes.find((episode) => episode.id === filterEpisodeId);
    if (filtered) return filtered.title;
  }
  return (
    episodes.find((episode) => episode.id === quiz.episodeId)?.title ?? "—"
  );
}
