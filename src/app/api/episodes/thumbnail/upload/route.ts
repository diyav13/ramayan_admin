import { NextRequest, NextResponse } from "next/server";
import {
  uploadEpisodeThumbnailViaPresign,
  validateEpisodeThumbnailFile,
} from "@/lib/api/episode-thumbnail-upload";

export async function POST(request: NextRequest) {
  const incoming = await request.formData();
  const file = incoming.get("file");
  const episodeId = incoming.get("episodeId");

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
    const publicUrl = await uploadEpisodeThumbnailViaPresign(
      file,
      authorization,
      typeof episodeId === "string" && episodeId.trim()
        ? episodeId.trim()
        : undefined
    );

    return NextResponse.json({
      success: true,
      data: { publicUrl },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Thumbnail upload failed";
    return NextResponse.json(
      { success: false, message },
      { status: 502 }
    );
  }
}
