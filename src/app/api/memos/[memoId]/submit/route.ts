import { jsonError, parseJson } from "@/lib/server/route-utils";
import { submitMemo } from "@/lib/server/procurement";

export async function POST(request: Request, context: RouteContext<"/api/memos/[memoId]/submit">) {
  try {
    const { memoId } = await context.params;
    const body = await parseJson<{ actorId?: string }>(request);
    return Response.json(await submitMemo(memoId, body.actorId));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to submit memo", 400);
  }
}
