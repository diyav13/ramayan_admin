import { getClientApiBaseUrl } from "./config";
import { authFetch, extractErrorMessage } from "./auth-fetch";
import { ApiError } from "./errors";
import { unwrapApiResponse, unwrapListResponse } from "./response";
import { normalizePaginatedResult, parseListQueryParams } from "@/lib/pagination";
import type { PaginatedResult } from "@/types/api";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function buildUrl(path: string): string {
  const base = getClientApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

async function parseJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const parsed = await parseJsonBody<unknown>(response);
  return unwrapApiResponse<T>(parsed);
}

async function parseListResponse<T>(response: Response): Promise<PaginatedResult<T>> {
  const parsed = await parseJsonBody<unknown>(response);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(parsed, response.status, "Request failed"),
      response.status,
      parsed
    );
  }

  return unwrapListResponse<T>(parsed);
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await authFetch(buildUrl(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await parseResponse<T>(response);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(data, response.status, "Request failed"),
      response.status,
      data
    );
  }

  return data;
}

async function apiClient<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(path, options);
}

/** GET helper that preserves pagination metadata when present. */
export async function apiList<T>(
  path: string,
  options?: Omit<RequestOptions, "body">
): Promise<PaginatedResult<T>> {
  const { headers, ...rest } = options ?? {};

  const response = await authFetch(buildUrl(path), {
    ...rest,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  const result = await parseListResponse<T>(response);
  return normalizePaginatedResult(result, parseListQueryParams(path));
}

/** Multipart upload with the same auth retry behavior as JSON requests. */
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  options?: Omit<RequestInit, "body">
): Promise<T> {
  const response = await authFetch(buildUrl(path), {
    ...options,
    method: "POST",
    body: formData,
  });

  const parsed = await parseJsonBody<unknown>(response);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(parsed, response.status, "Upload failed"),
      response.status,
      parsed
    );
  }

  return unwrapApiResponse<T>(parsed);
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    apiClient<T>(path, { ...options, method: "GET" }),

  list: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    apiList<T>(path, options),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    apiClient<T>(path, { ...options, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    apiClient<T>(path, { ...options, method: "PATCH", body }),

  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    apiClient<T>(path, { ...options, method: "PUT", body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    apiClient<T>(path, { ...options, method: "DELETE" }),

  upload: <T>(path: string, formData: FormData, options?: Omit<RequestInit, "body">) =>
    apiUpload<T>(path, formData, options),
};
