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
  return buildQuery({
    search: params.search,
    episodeId: params.episodeId,
    page: params.page ?? DEFAULT_PAGE,
    limit: params.limit ?? DEFAULT_LIMIT,
  });
}

export const locationService = {
  list: (
    params: LocationListParams = {}
  ): Promise<PaginatedResult<Location>> =>
    api.list<Location>(`${paths.locations.root}${toListQuery(params)}`),

  getById: (id: string) => api.get<Location>(paths.locations.byId(id)),

  create: (data: CreateLocationInput) =>
    api.post<Location>(paths.locations.root, data),

  update: (id: string, data: UpdateLocationInput) =>
    api.patch<Location>(paths.locations.byId(id), data),

  remove: (id: string) => api.delete<null>(paths.locations.byId(id)),
};
