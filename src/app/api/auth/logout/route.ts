import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    await serverFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}
