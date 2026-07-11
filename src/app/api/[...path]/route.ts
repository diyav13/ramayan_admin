import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/config";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyToBackend(request: NextRequest, pathSegments: string[]) {
  const search = request.nextUrl.search;
  const backendUrl = `${getApiBaseUrl()}/${pathSegments.join("/")}${search}`;
  const headers = new Headers();

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: body || undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  return NextResponse.json(payload, { status: response.status });
}

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
