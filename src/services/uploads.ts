import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";

type UploadKind = "thumbnail" | "video"; // | "quizImage"

interface UploadResult {
  url: string;
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

export const uploadService = {
  thumbnail: (file: File) => uploadFile("thumbnail", file),
  video: (file: File) => uploadFile("video", file),
  // quizImage: (file: File) => uploadFile("quizImage", file), // temporarily disabled for image-sequence
};
