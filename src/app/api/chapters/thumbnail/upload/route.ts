import { NextRequest, NextResponse } from "next/server";
import { uploadChapterThumbnailViaPresign } from "@/lib/api/chapter-thumbnail-upload";
import { validateEpisodeThumbnailFile } from "@/lib/api/episode-thumbnail-upload";

function parseOptionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(request: NextRequest) {
  const incoming = await request.formData();
  const file = incoming.get("file");
  const chapterId = parseOptionalId(
    incoming.get("chapterId") ?? incoming.get("entityId")
  );

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
    const publicUrl = await uploadChapterThumbnailViaPresign(
      file,
      authorization,
      chapterId
    );

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
