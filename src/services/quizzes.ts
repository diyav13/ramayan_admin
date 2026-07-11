import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/pagination";
import type { PaginatedResult } from "@/types/api";
import type {
  CreateQuizInput,
  Quiz,
  QuizListItem,
  QuizListParams,
  UpdateQuizInput,
} from "@/types/quiz";

function toListQuery(params: QuizListParams): string {
  const usePagination = !params.chapterId && !params.episodeId;

  return buildQuery({
    chapterId: params.chapterId,
    episodeId: params.episodeId,
    type: params.type,
    isPublished: params.isPublished,
    search: params.search,
    page: usePagination ? (params.page ?? DEFAULT_PAGE) : undefined,
    limit: usePagination ? (params.limit ?? DEFAULT_LIMIT) : undefined,
  });
}

export const quizService = {
  list: (
    params: QuizListParams = {}
  ): Promise<PaginatedResult<QuizListItem>> =>
    api.list<QuizListItem>(`${paths.quizzes.root}${toListQuery(params)}`),

  getById: (id: string) => api.get<Quiz>(paths.quizzes.byId(id)),

  create: (data: CreateQuizInput) =>
    api.post<Quiz>(paths.quizzes.root, data),

  update: (id: string, data: UpdateQuizInput) =>
    api.patch<Quiz>(paths.quizzes.byId(id), data),

  remove: (id: string) => api.delete<null>(paths.quizzes.byId(id)),
};
