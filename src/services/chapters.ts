import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import type {
  Chapter,
  CreateChapterInput,
  UpdateChapterInput,
} from "@/types/chapter";

/** Chapter admin API — all routes require admin auth (Bearer token via api client). */
export const chapterService = {
  getAllAdmin: () => api.get<Chapter[]>(paths.chapters.adminAll),

  create: (data: CreateChapterInput) =>
    api.post<Chapter>(paths.chapters.root, data),

  update: (id: string, data: UpdateChapterInput) =>
    api.patch<Chapter>(paths.chapters.byId(id), data),

  remove: (id: string) => api.delete<null>(paths.chapters.byId(id)),
};
