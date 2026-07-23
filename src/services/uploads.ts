import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import {
  validateEpisodeThumbnailFile,
  type MediaImageUploadType,
} from "@/lib/api/episode-thumbnail-upload";
import {
  uploadVideoMultipart,
  type UploadVideoOptions,
  type VideoUploadResult,
} from "@/services/multipart-upload";
import type { QuizImageUploadOptions } from "@/types/quiz";

type UploadKind = "thumbnail" | "video";

interface UploadResult {
  url: string;
}

interface MediaImageUploadResult {
  publicUrl: string;
}

interface QuizImageUploadResult {
  publicUrl: string;
  draftId?: string;
}

async function uploadFile(kind: UploadKind, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const result = await api.upload<UploadResult>(
    paths.uploads[kind],
    formData
  );

  return result.url;
}

/**
 * Upload via same-origin BFF — presign + S3 PUT run server-side (no browser CORS).
 * Used for episode thumbnails, character images, and location images.
 */
async function uploadMediaImage(
  file: File,
  options: {
    type?: MediaImageUploadType;
    entityId?: string;
    episodeId?: string;
  } = {}
): Promise<string> {
  const validationError = validateEpisodeThumbnailFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", options.type ?? "episode");
  if (options.entityId) {
    formData.append("entityId", options.entityId);
  }
  if (options.episodeId) {
    formData.append("episodeId", options.episodeId);
  }

  const result = await api.upload<MediaImageUploadResult>(
    paths.episodes.thumbnailUpload,
    formData
  );

  const publicUrl = result.publicUrl?.trim();
  if (!publicUrl) {
    throw new Error("Upload response missing publicUrl");
  }

  return publicUrl;
}

/**
 * Upload chapter thumbnail via same-origin BFF (presign + S3 PUT).
 */
async function uploadChapterThumbnail(
  file: File,
  chapterId?: string
): Promise<string> {
  const validationError = validateEpisodeThumbnailFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append("file", file);
  if (chapterId) {
    formData.append("chapterId", chapterId);
  }

  const result = await api.upload<MediaImageUploadResult>(
    paths.chapters.thumbnailUpload,
    formData
  );

  const publicUrl = result.publicUrl?.trim();
  if (!publicUrl) {
    throw new Error("Upload response missing publicUrl");
  }

  return publicUrl;
}

/**
 * Upload quiz image-sequence frame via same-origin BFF (presign + S3 PUT).
 */
async function uploadQuizImage(
  file: File,
  options: QuizImageUploadOptions
): Promise<QuizImageUploadResult> {
  const validationError = validateEpisodeThumbnailFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("chapterId", options.chapterId);
  formData.append("episodeId", options.episodeId);
  formData.append("sequenceIndex", String(options.sequenceIndex));
  if (options.questionId) {
    formData.append("questionId", options.questionId);
  }
  if (options.draftId) {
    formData.append("draftId", options.draftId);
  }

  const result = await api.upload<QuizImageUploadResult>(
    paths.quizzes.imageUpload,
    formData
  );

  const publicUrl = result.publicUrl?.trim();
  if (!publicUrl) {
    throw new Error("Upload response missing publicUrl");
  }

  return {
    publicUrl,
    draftId: result.draftId?.trim() || undefined,
  };
}

export const uploadService = {
  thumbnail: (file: File) => uploadFile("thumbnail", file),
  video: (file: File) => uploadFile("video", file),
  /**
   * Resilient direct-to-S3 multipart episode video upload (chunked, concurrent, retried).
   * Bytes go browser → S3; only initiate/sign-part/complete/abort/status hit our backend.
   * Requires a saved episodeId so season/episode codes are derived server-side.
   */
  videoMultipart: (
    file: File,
    options: UploadVideoOptions
  ): Promise<VideoUploadResult> => uploadVideoMultipart(file, options),
  episodeThumbnail: (file: File, episodeId?: string) =>
    uploadMediaImage(file, { type: "episode", episodeId }),
  chapterThumbnail: (file: File, chapterId?: string) =>
    uploadChapterThumbnail(file, chapterId),
  /** Character or location portrait/landscape image. */
  entityImage: (
    file: File,
    type: "character" | "location",
    entityId?: string
  ) => uploadMediaImage(file, { type, entityId }),
  quizImage: (file: File, options: QuizImageUploadOptions) =>
    uploadQuizImage(file, options),
};
