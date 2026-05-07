import { jsonError, parseJson } from "@/lib/server/route-utils";
import { type MutableMemoPayload, resubmitMemo } from "@/lib/server/procurement";

export async function POST(request: Request, context: RouteContext<"/api/memos/[memoId]/resubmit">) {
  try {
    const { memoId } = await context.params;
    const body = await parseJson<{ actorId?: string; updates: Partial<MutableMemoPayload> }>(request);
    return Response.json(await resubmitMemo(memoId, body.updates, body.actorId));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to resubmit memo", 400);
  }
}
