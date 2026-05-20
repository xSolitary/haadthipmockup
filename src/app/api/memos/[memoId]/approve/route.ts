import { approveMemo } from "@/lib/server/procurement";
import { jsonErrorFromUnknown, parseJson } from "@/lib/server/route-utils";

export async function POST(request: Request, context: RouteContext<"/api/memos/[memoId]/approve">) {
  try {
    const { memoId } = await context.params;
    const body = await parseJson<{ actorId?: string; comment?: string }>(request);
    return Response.json(await approveMemo(memoId, body.comment ?? "", body.actorId));
  } catch (error) {
    console.error(error);
    return jsonErrorFromUnknown(error, "Failed to approve memo");
  }
}
