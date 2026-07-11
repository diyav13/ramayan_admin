export type UserRole = "USER" | "ADMIN";
export type AccountType = "REGISTERED" | "GUEST";

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  accountType: AccountType;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  progress?: UserProgress;
}

export interface UserProgressSummary {
  totalChapters: number;
  completedChapters: number;
  totalEpisodes: number;
  completedEpisodes: number;
  overallPercentage: number;
  totalPoints: number;
}

export interface UserChapterProgress {
  id: string;
  title: string;
  totalEpisodes: number;
  completedEpisodes: number;
  isCompleted: boolean;
  progressPercentage: number;
}

export interface UserEpisodeProgress {
  progressId: string;
  id: string;
  title: string;
  chapter: { id: string; title: string };
  completedAt: string;
}

export interface UserRewardProgress {
  id: string;
  pointsEarned: number;
  activity: { title: string; type: string };
  episode: { title: string };
  chapter: { title: string };
}

export interface UserProgress {
  summary: UserProgressSummary;
  chapters: UserChapterProgress[];
  episodes: UserEpisodeProgress[];
  rewards: UserRewardProgress[];
}

export interface UserListParams {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

export type UpdateUserInput = {
  email?: string | null;
  password?: string;
  name?: string | null;
  phone?: string | null;
};
