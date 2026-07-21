import { NextRequest, NextResponse } from "next/server";
import {
  uploadEpisodeThumbnailViaPresign,
  validateEpisodeThumbnailFile,
  type MediaImageUploadType,
} from "@/lib/api/episode-thumbnail-upload";

const UPLOAD_TYPES = new Set<MediaImageUploadType>([
  "episode",
  "character",
  "location",
]);

function parseUploadType(value: FormDataEntryValue | null): MediaImageUploadType {
  if (typeof value === "string" && UPLOAD_TYPES.has(value as MediaImageUploadType)) {
    return value as MediaImageUploadType;
  }
  return "episode";
}

function parseOptionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(request: NextRequest) {
  const incoming = await request.formData();
  const file = incoming.get("file");
  const type = parseUploadType(incoming.get("type"));
  const entityId = parseOptionalId(incoming.get("entityId"));
  const episodeId = parseOptionalId(incoming.get("episodeId"));

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: "No file provided" },
      { status: 400 }
    );
  }

  const validationError = validateEpisodeThumbnailFile(file);
  if (validationError) {
    return NextResponse.json(
      { success: false, message: validationError },
      { status: 400 }
    );
  }

  const authorization = request.headers.get("authorization");

  try {
    const publicUrl = await uploadEpisodeThumbnailViaPresign(file, authorization, {
      type,
      entityId,
      episodeId,
    });

    return NextResponse.json({
      success: true,
      data: { publicUrl },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image upload failed";
    return NextResponse.json(
      { success: false, message },
      { status: 502 }
    );
  }
}
