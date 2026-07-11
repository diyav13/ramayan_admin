import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/config";

type RouteContext = { params: Promise<{ type: string }> };

const ALLOWED_TYPES = new Set(["thumbnail", "video", "quiz-image"]);

export async function POST(request: NextRequest, context: RouteContext) {
  const { type } = await context.params;

  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { success: false, message: "Invalid upload type" },
      { status: 400 }
    );
  }

  const incoming = await request.formData();
  const file = incoming.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: "No file provided" },
      { status: 400 }
    );
  }

  const outgoing = new FormData();
  outgoing.append("file", file);

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  const response = await fetch(`${getApiBaseUrl()}/uploads/${type}`, {
    method: "POST",
    headers,
    body: outgoing,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  return NextResponse.json(payload, { status: response.status });
}
