import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/pagination";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type { User, UserListParams, UserProgress } from "@/types/user";

const CHAPTER_BALA_KANDA = {
  id: "chapter-bala-kanda",
  title: "Bala Kanda",
};

const CHAPTER_AYODHYA = {
  id: "chapter-ayodhya-kanda",
  title: "Ayodhya Kanda",
};

export const DUMMY_PREMIUM_USER_EMAIL = "Test@gmail.com";

export const DUMMY_PREMIUM_PROGRESS: UserProgress = {
  summary: {
    totalChapters: 5,
    completedChapters: 2,
    totalEpisodes: 20,
    completedEpisodes: 8,
    overallPercentage: 40,
    totalPoints: 120,
  },
  chapters: [
    {
      id: CHAPTER_BALA_KANDA.id,
      title: CHAPTER_BALA_KANDA.title,
      totalEpisodes: 4,
      completedEpisodes: 4,
      isCompleted: true,
      progressPercentage: 100,
    },
    {
      id: CHAPTER_AYODHYA.id,
      title: CHAPTER_AYODHYA.title,
      totalEpisodes: 6,
      completedEpisodes: 4,
      isCompleted: false,
      progressPercentage: 67,
    },
  ],
  episodes: [
    {
      progressId: "progress-ep-1",
      id: "episode-1",
      title: "Birth Of The Four Brothers",
      chapter: CHAPTER_BALA_KANDA,
      completedAt: "2025-07-10T12:00:00.000Z",
    },
    {
      progressId: "progress-ep-4",
      id: "episode-4",
      title: "The Coronation Deferred",
      chapter: CHAPTER_AYODHYA,
      completedAt: "2025-07-01T18:45:00.000Z",
    },
    {
      progressId: "progress-ep-2",
      id: "episode-2",
      title: "Sage Vishwamitra Arrives",
      chapter: CHAPTER_BALA_KANDA,
      completedAt: "2025-05-28T14:30:00.000Z",
    },
    {
      progressId: "progress-ep-3",
      id: "episode-3",
      title: "Rama Wins Sita's Hand",
      chapter: CHAPTER_BALA_KANDA,
      completedAt: "2025-05-20T09:15:00.000Z",
    },
  ],
  rewards: [
    {
      id: "reward-1",
      pointsEarned: 10,
      activity: { title: "Ramayana Quiz", type: "MCQ" },
      episode: { title: "Birth Of The Four Brothers" },
      chapter: { title: CHAPTER_BALA_KANDA.title },
    },
    {
      id: "reward-2",
      pointsEarned: 15,
      activity: { title: "Daily Streak", type: "STREAK" },
      episode: { title: "Sage Vishwamitra Arrives" },
      chapter: { title: CHAPTER_BALA_KANDA.title },
    },
  ],
};

/** Local-only demo users — never mixed into API payloads. */
export const DUMMY_USERS: User[] = [
  {
    id: "dummy-user-test-premium",
    name: "Test User",
    email: DUMMY_PREMIUM_USER_EMAIL,
    phone: "+91 98765 43210",
    avatarUrl: null,
    selectedAvatar: null,
    role: "USER",
    accountType: "REGISTERED",
    isPremium: true,
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-07-01T18:45:00.000Z",
    progress: DUMMY_PREMIUM_PROGRESS,
  },
];

function matchesSearch(user: User, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [user.name, user.email, user.phone]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(query));
}

function filterDummyUsers(params: UserListParams = {}): User[] {
  let users = [...DUMMY_USERS];

  if (params.role) {
    users = users.filter((user) => user.role === params.role);
  }

  const search = params.search?.trim() ?? "";
  if (search) {
    users = users.filter((user) => matchesSearch(user, search));
  }

  return users;
}

function paginateUsers(
  users: User[],
  page: number,
  limit: number
): PaginatedResult<User> {
  const total = users.length;
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;

  const pagination: PaginationMeta = {
    page: safePage,
    limit,
    total,
    totalPages,
  };

  return {
    data: users.slice(start, start + limit),
    pagination,
  };
}

export function getDummyUserById(id: string): User | null {
  return DUMMY_USERS.find((user) => user.id === id) ?? null;
}

export function isDummyUserId(id: string): boolean {
  return DUMMY_USERS.some((user) => user.id === id);
}

/** Dummy-only list (used when the server request fails). */
export function getDummyUserList(
  params: UserListParams = {}
): PaginatedResult<User> {
  return paginateUsers(
    filterDummyUsers(params),
    params.page ?? DEFAULT_PAGE,
    params.limit ?? DEFAULT_LIMIT
  );
}

/**
 * Keep server users untouched. Prepend matching dummy users for display only.
 */
export function combineUsersForDisplay(
  serverResult: PaginatedResult<User>,
  params: UserListParams = {}
): PaginatedResult<User> {
  const page = serverResult.pagination?.page ?? params.page ?? DEFAULT_PAGE;
  const dummyToShow = filterDummyUsers(params);
  const serverIds = new Set(serverResult.data.map((user) => user.id));
  const uniqueDummy = dummyToShow.filter((user) => !serverIds.has(user.id));

  const data =
    page === 1
      ? [...uniqueDummy, ...serverResult.data]
      : serverResult.data;

  if (!serverResult.pagination) {
    return { data };
  }

  const total = serverResult.pagination.total + uniqueDummy.length;
  const limit = serverResult.pagination.limit;

  return {
    data,
    pagination: {
      ...serverResult.pagination,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

