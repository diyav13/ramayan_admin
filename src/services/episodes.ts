import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/pagination";
import type { PaginatedResult } from "@/types/api";
import type {
  CreateEpisodeInput,
  Episode,
  EpisodeListItem,
  EpisodeListParams,
  UpdateEpisodeInput,
} from "@/types/episode";

function toListQuery(params: EpisodeListParams): string {
  const usePagination = !params.chapterId;

  return buildQuery({
    chapterId: params.chapterId,
    search: params.search,
    userRole: params.userRole,
    page: usePagination ? (params.page ?? DEFAULT_PAGE) : undefined,
    limit: usePagination ? (params.limit ?? DEFAULT_LIMIT) : undefined,
  });
}

/** Normalize nested characters/locations into characterIds / locationIds for forms. */
export function normalizeEpisodeEntities<T extends Episode | EpisodeListItem>(
  episode: T
): T {
  const characterIds =
    episode.characterIds ??
    episode.characters?.map((item) => item.id) ??
    [];
  const locationIds =
    episode.locationIds ??
    episode.locations?.map((item) => item.id) ??
    [];

  return {
    ...episode,
    characterIds,
    locationIds,
  };
}

export const episodeService = {
  list: (
    params: EpisodeListParams = {}
  ): Promise<PaginatedResult<EpisodeListItem>> =>
    api
      .list<EpisodeListItem>(`${paths.episodes.root}${toListQuery(params)}`)
      .then((result) => ({
        ...result,
        data: result.data.map(normalizeEpisodeEntities),
      })),

  getById: (id: string) =>
    api
      .get<Episode>(paths.episodes.byId(id))
      .then(normalizeEpisodeEntities),

  /** Single create call — include characterIds / locationIds in the body. */
  create: (data: CreateEpisodeInput) =>
    api
      .post<Episode>(paths.episodes.root, data)
      .then(normalizeEpisodeEntities),

  /** Single update call — include characterIds / locationIds in the body. */
  update: (id: string, data: UpdateEpisodeInput) =>
    api
      .patch<Episode>(paths.episodes.byId(id), data)
      .then(normalizeEpisodeEntities),

  remove: (id: string) => api.delete<null>(paths.episodes.byId(id)),
};
