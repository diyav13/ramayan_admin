export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (error instanceof ApiError) {
    if (typeof error.body === "object" && error.body !== null) {
      const body = error.body as {
        message?: unknown;
        errors?: Array<{ field?: string; message: string }>;
      };

      if (Array.isArray(body.errors) && body.errors.length > 0) {
        return body.errors
          .map((entry) =>
            entry.field ? `${entry.field}: ${entry.message}` : entry.message
          )
          .join("; ");
      }

      if (typeof body.message === "string") return body.message;
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
