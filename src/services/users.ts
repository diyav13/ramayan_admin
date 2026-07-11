import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/pagination";
import {
  combineUsersForDisplay,
  getDummyUserById,
  getDummyUserList,
  isDummyUserId,
} from "@/lib/users-dummy";
import type { PaginatedResult } from "@/types/api";
import type { UpdateUserInput, User, UserListParams } from "@/types/user";

function toListQuery(params: UserListParams): string {
  return buildQuery({
    search: params.search,
    role: params.role,
    page: params.page ?? DEFAULT_PAGE,
    limit: params.limit ?? DEFAULT_LIMIT,
  });
}

export const userService = {
  async list(params: UserListParams = {}): Promise<PaginatedResult<User>> {
    try {
      const serverResult = await api.list<User>(
        `${paths.users.adminAll}${toListQuery(params)}`
      );

      return combineUsersForDisplay(serverResult, params);
    } catch {
      return getDummyUserList(params);
    }
  },

  async getById(id: string): Promise<User> {
    if (isDummyUserId(id)) {
      const user = getDummyUserById(id);
      if (!user) throw new Error("User not found");
      return user;
    }

    return api.get<User>(paths.users.byId(id));
  },

  update: (id: string, data: UpdateUserInput) => {
    if (isDummyUserId(id)) {
      return Promise.reject(new Error("Dummy users cannot be updated"));
    }
    return api.patch<User>(paths.users.byId(id), data);
  },

  remove: (id: string) => {
    if (isDummyUserId(id)) {
      return Promise.reject(new Error("Dummy users cannot be deleted"));
    }
    return api.delete<null>(paths.users.byId(id));
  },
};
