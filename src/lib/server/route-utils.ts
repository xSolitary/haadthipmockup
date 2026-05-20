import { ValidationError } from "@/lib/procurement-validation";

export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export async function parseJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function jsonErrorFromUnknown(error: unknown, fallbackMessage: string) {
  if (error instanceof HttpError) {
    return jsonError(error.message, error.status);
  }

  if (error instanceof SyntaxError) {
    return jsonError("Invalid JSON request body", 400);
  }

  if (error instanceof ValidationError) {
    return jsonError(error.message, 400);
  }

  return jsonError(fallbackMessage);
}
