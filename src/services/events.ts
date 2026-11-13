import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/pagination";
import type { PaginatedResult } from "@/types/api";
import type {
  CreateEventInput,
  Event,
  EventListParams,
  UpdateEventInput,
} from "@/types/event";

function toListQuery(params: EventListParams): string {
  return buildQuery({
    search: params.search,
    locationId: params.locationId,
    chapterId: params.chapterId,
    episodeId: params.episodeId,
    page: params.page ?? DEFAULT_PAGE,
    limit: params.limit ?? DEFAULT_LIMIT,
  });
}

export const eventService = {
  list: (params: EventListParams = {}): Promise<PaginatedResult<Event>> =>
    api.list<Event>(`${paths.events.root}${toListQuery(params)}`),

  getById: (id: string) => api.get<Event>(paths.events.byId(id)),

  create: (data: CreateEventInput) =>
    api.post<Event>(paths.events.root, data),

  update: (id: string, data: UpdateEventInput) =>
    api.patch<Event>(paths.events.byId(id), data),

  remove: (id: string) => api.delete<null>(paths.events.byId(id)),
};
