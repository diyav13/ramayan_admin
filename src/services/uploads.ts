import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { validateEpisodeThumbnailFile } from "@/lib/api/episode-thumbnail-upload";

type UploadKind = "thumbnail" | "video"; // | "quizImage"

interface UploadResult {
  url: string;
}

interface EpisodeThumbnailUploadResult {
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

/** Upload via same-origin BFF — presign + S3 PUT run server-side (no browser CORS). */
async function uploadEpisodeThumbnail(
  file: File,
  episodeId?: string
): Promise<string> {
  const validationError = validateEpisodeThumbnailFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append("file", file);
  if (episodeId) {
    formData.append("episodeId", episodeId);
  }

  const result = await api.upload<EpisodeThumbnailUploadResult>(
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
    uploadEpisodeThumbnail(file, episodeId),
  // quizImage: (file: File) => uploadFile("quizImage", file), // temporarily disabled for image-sequence
};
