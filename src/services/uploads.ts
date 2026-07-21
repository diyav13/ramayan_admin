import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import {
  validateEpisodeThumbnailFile,
  type MediaImageUploadType,
} from "@/lib/api/episode-thumbnail-upload";

type UploadKind = "thumbnail" | "video"; // | "quizImage"

interface UploadResult {
  url: string;
}

interface MediaImageUploadResult {
  publicUrl: string;
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

export const uploadService = {
  thumbnail: (file: File) => uploadFile("thumbnail", file),
  video: (file: File) => uploadFile("video", file),
  episodeThumbnail: (file: File, episodeId?: string) =>
    uploadMediaImage(file, { type: "episode", episodeId }),
  /** Character or location portrait/landscape image. */
  entityImage: (
    file: File,
    type: "character" | "location",
    entityId?: string
  ) => uploadMediaImage(file, { type, entityId }),
  // quizImage: (file: File) => uploadFile("quizImage", file), // temporarily disabled for image-sequence
};
