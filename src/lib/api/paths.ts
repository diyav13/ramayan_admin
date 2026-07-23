/**
 * Shared API path segments — keep endpoint strings in one place.
 * Client calls go to `/api/...` (Next.js BFF), which proxies to the backend.
 */
export const paths = {
  chapters: {
    root: "/chapters",
    adminAll: "/chapters/admin/all",
    byId: (id: string) => `/chapters/${id}`,
    thumbnailUploadUrl: "/chapters/thumbnail/upload-url",
    /** Same-origin BFF — presign + S3 PUT on server (avoids bucket CORS). */
    thumbnailUpload: "/chapters/thumbnail/upload",
  },
  episodes: {
    root: "/episodes",
    byId: (id: string) => `/episodes/${id}`,
    thumbnailUploadUrl: "/episodes/thumbnail/upload-url",
    /** Same-origin BFF — presign + S3 PUT on server (avoids bucket CORS). */
    thumbnailUpload: "/episodes/thumbnail/upload",
    /** Episode-scoped multipart video lifecycle (browser → S3 directly for parts). */
    videoMultipart: {
      initiate: (episodeId: string) =>
        `/episodes/${episodeId}/video/multipart/initiate`,
      signPart: (episodeId: string) =>
        `/episodes/${episodeId}/video/multipart/sign-part`,
      complete: (episodeId: string) =>
        `/episodes/${episodeId}/video/multipart/complete`,
      abort: (episodeId: string) =>
        `/episodes/${episodeId}/video/multipart/abort`,
    },
    videoStatus: (episodeId: string) => `/episodes/${episodeId}/video/status`,
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
    /** Same-origin BFF — presign + S3 PUT on server (avoids bucket CORS). */
    imageUpload: "/quizzes/image/upload",
  },
} as const;
