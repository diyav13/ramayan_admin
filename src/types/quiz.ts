export type QuizType = "TRUE_FALSE" | "MCQ" | "IMAGE_SEQUENCE";

export interface Quiz {
  id: string;
  chapterId?: string;
  episodeId: string;
  type: QuizType;
  question: string;
  description: string | null;
  /**
   * TRUE_FALSE: boolean
   * MCQ: correct option index
   * IMAGE_SEQUENCE: correct order of image indices (0..n-1)
   */
  answer: boolean | number | number[];
  /** MCQ options. */
  options?: string[];
  /** IMAGE_SEQUENCE image URLs. */
  images?: string[];
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  episode?: {
    id: string;
    title: string;
    chapterId: string;
    chapter?: { id: string; title: string };
  };
  chapter?: {
    id: string;
    title: string;
  };
}

export interface QuizListItem {
  id: string;
  chapterId?: string;
  episodeId: string;
  type: QuizType;
  question: string;
  description: string | null;
  answer: boolean | number | number[];
  options?: string[];
  images?: string[];
  orderIndex: number;
  isPublished?: boolean;
  episode?: {
    id: string;
    title: string;
    chapterId: string;
    chapter?: { id: string; title: string };
  };
  chapter?: {
    id: string;
    title: string;
  };
}

export interface QuizListParams {
  chapterId?: string;
  episodeId?: string;
  type?: QuizType;
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateQuizInput {
  episodeId: string;
  type: QuizType;
  question: string;
  description?: string;
  answer: boolean | number | number[];
  options?: string[];
  images?: string[];
  orderIndex?: number;
  isPublished?: boolean;
}

export type UpdateQuizInput = Partial<CreateQuizInput>;
