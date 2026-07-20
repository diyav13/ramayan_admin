/**
 * Shared API path segments — keep endpoint strings in one place.
 * Client calls go to `/api/...` (Next.js BFF), which proxies to the backend.
 */
export const paths = {
  chapters: {
    root: "/chapters",
    adminAll: "/chapters/admin/all",
    byId: (id: string) => `/chapters/${id}`,
  },
  episodes: {
    root: "/episodes",
    byId: (id: string) => `/episodes/${id}`,
    thumbnailUploadUrl: "/episodes/thumbnail/upload-url",
    /** Same-origin BFF — presign + S3 PUT on server (avoids bucket CORS). */
    thumbnailUpload: "/episodes/thumbnail/upload",
  },
  uploads: {
    thumbnail: "/uploads/thumbnail",
    video: "/uploads/video",
    // quizImage: "/uploads/quiz-image", // temporarily disabled for image-sequence
  },
  admin: {
    stats: "/admin/stats",
  },
  users: {
    adminAll: "/users/admin/all",
    byId: (id: string) => `/users/${id}`,
  },
  characters: {
    root: "/characters",
    byId: (id: string) => `/characters/${id}`,
  },
  locations: {
    root: "/locations",
    byId: (id: string) => `/locations/${id}`,
  },
  quizzes: {
    root: "/quizzes",
    byId: (id: string) => `/quizzes/${id}`,
  },
} as const;
