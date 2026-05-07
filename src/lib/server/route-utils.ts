export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

export async function parseJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
