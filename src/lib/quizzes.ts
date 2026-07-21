import type { Chapter } from "@/types/chapter";
import type { EpisodeListItem } from "@/types/episode";
import type {
  Quiz,
  QuizImageSequenceItem,
  QuizListItem,
  QuizType,
} from "@/types/quiz";

/** Local form state — allows blob previews while uploading. */
export type QuizImageSequenceFormItem = {
  imageUrl: string;
  text: string;
};

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  TRUE_FALSE: "True / False",
  MCQ: "MCQ",
  IMAGE_SEQUENCE: "Image sequence",
};

export function quizTypeLabel(type: QuizType): string {
  return QUIZ_TYPE_LABELS[type] ?? type;
}

/** Reorder legacy image URLs into the correct answer sequence. */
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

/** Normalize API quiz data into form-ready IMAGE_SEQUENCE items. */
export function quizItemsForForm(
  quiz:
    | Pick<Quiz, "items" | "images" | "answer" | "type">
    | Pick<QuizListItem, "items" | "images" | "answer" | "type">
    | null
    | undefined
): QuizImageSequenceFormItem[] {
  if (quiz?.items?.length) {
    return quiz.items.map((item) => ({
      imageUrl: item.imageUrl,
      text: item.text ?? "",
    }));
  }

  return imagesInCorrectOrder(quiz?.images, quiz?.answer).map((imageUrl) => ({
    imageUrl,
    text: "",
  }));
}

/** Persisted items for create/update — drops in-flight blob previews. */
export function resolveItemsForSave(
  items: QuizImageSequenceFormItem[]
): QuizImageSequenceItem[] {
  return items
    .filter((item) => item.imageUrl && !item.imageUrl.startsWith("blob:"))
    .map((item) => ({
      imageUrl: item.imageUrl,
      text: item.text.trim(),
    }));
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
