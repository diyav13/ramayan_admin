import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import type { DashboardStats } from "@/types/dashboard";

export const dashboardService = {
  getStats: () => api.get<DashboardStats>(paths.admin.stats),
};
