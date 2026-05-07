import { createMemo, getMemos, type MutableMemoPayload } from "@/lib/server/procurement";
import { jsonError, parseJson } from "@/lib/server/route-utils";

export async function GET() {
  try {
    return Response.json(await getMemos());
  } catch (error) {
    console.error(error);
    return jsonError("Failed to load memos");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJson<MutableMemoPayload>(request);
    return Response.json(await createMemo(body));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to create memo", 400);
  }
}
