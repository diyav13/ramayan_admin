import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";
import type { AuthResponse, RefreshTokenPayload } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RefreshTokenPayload;
    const { data } = await serverFetch<AuthResponse>("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, ...(typeof error.body === "object" ? error.body : {}) },
        { status: error.status }
      );
    }
    return NextResponse.json({ message: "Token refresh failed" }, { status: 500 });
  }
}
