import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/pagination";
import type { PaginatedResult } from "@/types/api";
import type {
  CreateQuizInstructionInput,
  QuizInstruction,
  QuizInstructionListParams,
  UpdateQuizInstructionInput,
} from "@/types/quiz-instruction";

function toListQuery(params: QuizInstructionListParams): string {
  return buildQuery({
    search: params.search,
    episodeId: params.episodeId,
    page: params.page ?? DEFAULT_PAGE,
    limit: params.limit ?? DEFAULT_LIMIT,
  });
}

export const quizInstructionService = {
  list: (
    params: QuizInstructionListParams = {}
  ): Promise<PaginatedResult<QuizInstruction>> =>
    api.list<QuizInstruction>(
      `${paths.quizInstructions.root}${toListQuery(params)}`
    ),

  getById: (id: string) =>
    api.get<QuizInstruction>(paths.quizInstructions.byId(id)),

  create: (data: CreateQuizInstructionInput) =>
    api.post<QuizInstruction>(paths.quizInstructions.root, data),

  update: (id: string, data: UpdateQuizInstructionInput) =>
    api.patch<QuizInstruction>(paths.quizInstructions.byId(id), data),

  remove: (id: string) =>
    api.delete<null>(paths.quizInstructions.byId(id)),
};
