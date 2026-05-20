import { getMemoById, type MutableMemoPayload, updateMemo } from "@/lib/server/procurement";
import { jsonError, jsonErrorFromUnknown, parseJson } from "@/lib/server/route-utils";

export async function GET(_request: Request, context: RouteContext<"/api/memos/[memoId]">) {
  try {
    const { memoId } = await context.params;
    const memo = await getMemoById(memoId);
    if (!memo) {
      return jsonError("Memo not found", 404);
    }
    return Response.json(memo);
  } catch (error) {
    console.error(error);
    return jsonErrorFromUnknown(error, "Failed to load memo");
  }
}

export async function PATCH(request: Request, context: RouteContext<"/api/memos/[memoId]">) {
  try {
    const { memoId } = await context.params;
    const body = await parseJson<Partial<MutableMemoPayload>>(request);
    return Response.json(await updateMemo(memoId, body));
  } catch (error) {
    console.error(error);
    return jsonErrorFromUnknown(error, "Failed to update memo");
  }
}
