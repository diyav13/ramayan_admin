import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { DEFAULT_LIMIT, DEFAULT_PAGE, normalizePaginatedResult } from "@/lib/pagination";
import type {
  AdminEpisodeListingResponse,
  AdminEpisodesByChapterResponse,
  CreateEpisodeInput,
  Episode,
  EpisodeListItem,
  EpisodeThumbnailUploadUrlInput,
  EpisodeThumbnailUploadUrlResponse,
  UpdateEpisodeInput,
} from "@/types/episode";

/** Normalize nested characters/locations/quiz instructions into ID arrays for forms. */
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
  const quizInstructionIds =
    episode.quizInstructionIds ??
    episode.quizInstructions?.map((item) => item.id) ??
    [];

  return {
    ...episode,
    characterIds,
    locationIds,
    quizInstructionIds,
  };
}

function normalizeListing(
  result: AdminEpisodeListingResponse,
  params: { page?: number; limit?: number } = {}
): AdminEpisodeListingResponse {
  const paged = normalizePaginatedResult(
    { data: result.episodes, pagination: result.pagination },
    {
      page: params.page ?? DEFAULT_PAGE,
      limit: params.limit ?? DEFAULT_LIMIT,
    }
  );

  return {
    ...result,
    episodes: paged.data.map(normalizeEpisodeEntities),
    pagination: paged.pagination ?? result.pagination,
  };
}

function normalizeByChapter(
  result: AdminEpisodesByChapterResponse
): AdminEpisodesByChapterResponse {
  return {
    ...result,
    episodes: result.episodes.map(normalizeEpisodeEntities),
  };
}

export const episodeService = {
  /** One-call admin bootstrap: episodes + chapters + characters + locations + quiz instructions. */
  adminListing: (params: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<AdminEpisodeListingResponse> =>
    api
      .get<AdminEpisodeListingResponse>(
        `${paths.episodes.adminListing}${buildQuery({
          search: params.search,
          page: params.page ?? DEFAULT_PAGE,
          limit: params.limit ?? DEFAULT_LIMIT,
        })}`
      )
      .then((result) => normalizeListing(result, params)),

  /** Chapter filter — episodes only (catalogs already loaded from listing). */
  adminByChapter: (params: {
    chapterId: string;
    search?: string;
  }): Promise<AdminEpisodesByChapterResponse> =>
    api
      .get<AdminEpisodesByChapterResponse>(
        `${paths.episodes.adminByChapter}${buildQuery({
          chapterId: params.chapterId,
          search: params.search,
        })}`
      )
      .then(normalizeByChapter),

  getById: (id: string) =>
    api
      .get<Episode>(paths.episodes.byId(id))
      .then(normalizeEpisodeEntities),

  /** Single create call — include characterIds / locationIds / quizInstructionIds in the body. */
  create: (data: CreateEpisodeInput) =>
    api
      .post<Episode>(paths.episodes.root, data)
      .then(normalizeEpisodeEntities),

  /** Single update call — include characterIds / locationIds / quizInstructionIds in the body. */
  update: (id: string, data: UpdateEpisodeInput) =>
    api
      .patch<Episode>(paths.episodes.byId(id), data)
      .then(normalizeEpisodeEntities),

  remove: (id: string) => api.delete<null>(paths.episodes.byId(id)),

  getThumbnailUploadUrl: (data: EpisodeThumbnailUploadUrlInput) =>
    api.post<EpisodeThumbnailUploadUrlResponse>(
      paths.episodes.thumbnailUploadUrl,
      data
    ),
};
