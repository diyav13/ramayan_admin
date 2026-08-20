import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/pagination";
import type { PaginatedResult } from "@/types/api";
import type {
  Avatar,
  AvatarListParams,
  CreateAvatarInput,
  UpdateAvatarInput,
} from "@/types/avatar";

function toListQuery(params: AvatarListParams): string {
  return buildQuery({
    search: params.search,
    isActive: params.isActive,
    page: params.page ?? DEFAULT_PAGE,
    limit: params.limit ?? DEFAULT_LIMIT,
  });
}

export const avatarService = {
  list: (params: AvatarListParams = {}): Promise<PaginatedResult<Avatar>> =>
    api.list<Avatar>(`${paths.avatars.root}${toListQuery(params)}`),

  getById: (id: string) => api.get<Avatar>(paths.avatars.byId(id)),

  create: (data: CreateAvatarInput) =>
    api.post<Avatar>(paths.avatars.root, data),

  update: (id: string, data: UpdateAvatarInput) =>
    api.patch<Avatar>(paths.avatars.byId(id), data),

  remove: (id: string) => api.delete<null>(paths.avatars.byId(id)),
};
