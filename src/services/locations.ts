import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/pagination";
import type { PaginatedResult } from "@/types/api";
import type {
  CreateLocationInput,
  Location,
  LocationListParams,
  UpdateLocationInput,
} from "@/types/location";

function toListQuery(params: LocationListParams): string {
  const all = params.all === true;
  return buildQuery({
    search: params.search,
    episodeId: params.episodeId,
    chapterId: params.chapterId,
    page: all ? undefined : (params.page ?? DEFAULT_PAGE),
    limit: all ? undefined : (params.limit ?? DEFAULT_LIMIT),
  });
}

export const locationService = {
  list: (
    params: LocationListParams = {}
  ): Promise<PaginatedResult<Location>> =>
    api.list<Location>(`${paths.locations.root}${toListQuery(params)}`),

  create: (data: CreateLocationInput) =>
    api.post<Location>(paths.locations.root, data),

  update: (id: string, data: UpdateLocationInput) =>
    api.patch<Location>(paths.locations.byId(id), data),

  remove: (id: string) => api.delete<null>(paths.locations.byId(id)),
};
