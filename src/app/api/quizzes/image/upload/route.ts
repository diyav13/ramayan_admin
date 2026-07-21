import { NextRequest, NextResponse } from "next/server";
import {
  uploadQuizImageViaPresign,
  validateQuizImageFile,
} from "@/lib/api/quiz-image-upload";

function parseOptionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseSequenceIndex(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function POST(request: NextRequest) {
  const incoming = await request.formData();
  const file = incoming.get("file");
  const chapterId = parseOptionalId(incoming.get("chapterId"));
  const episodeId = parseOptionalId(incoming.get("episodeId"));
  const sequenceIndex = parseSequenceIndex(incoming.get("sequenceIndex"));
  const questionId = parseOptionalId(incoming.get("questionId"));
  const draftId = parseOptionalId(incoming.get("draftId"));

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: "No file provided" },
      { status: 400 }
    );
  }

  if (!chapterId || !episodeId) {
    return NextResponse.json(
      { success: false, message: "Chapter and episode are required" },
      { status: 400 }
    );
  }

  if (sequenceIndex === null) {
    return NextResponse.json(
      { success: false, message: "sequenceIndex is required" },
      { status: 400 }
    );
  }

  const validationError = validateQuizImageFile(file);
  if (validationError) {
    return NextResponse.json(
      { success: false, message: validationError },
      { status: 400 }
    );
  }

  const authorization = request.headers.get("authorization");

  try {
    const result = await uploadQuizImageViaPresign(file, authorization, {
      chapterId,
      episodeId,
      sequenceIndex,
      questionId,
      draftId,
    });

    return NextResponse.json({
      success: true,
      data: result,
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
