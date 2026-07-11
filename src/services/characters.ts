import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/pagination";
import type { PaginatedResult } from "@/types/api";
import type {
  Character,
  CharacterListParams,
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";

function toListQuery(params: CharacterListParams): string {
  return buildQuery({
    search: params.search,
    episodeId: params.episodeId,
    page: params.page ?? DEFAULT_PAGE,
    limit: params.limit ?? DEFAULT_LIMIT,
  });
}

export const characterService = {
  list: (
    params: CharacterListParams = {}
  ): Promise<PaginatedResult<Character>> =>
    api.list<Character>(`${paths.characters.root}${toListQuery(params)}`),

  getById: (id: string) => api.get<Character>(paths.characters.byId(id)),

  create: (data: CreateCharacterInput) =>
    api.post<Character>(paths.characters.root, data),

  update: (id: string, data: UpdateCharacterInput) =>
    api.patch<Character>(paths.characters.byId(id), data),

  remove: (id: string) => api.delete<null>(paths.characters.byId(id)),
};
