import { jsonErrorFromUnknown, parseJson } from "@/lib/server/route-utils";
import { requestMemoRevision } from "@/lib/server/procurement";

export async function POST(
  request: Request,
  context: RouteContext<"/api/memos/[memoId]/request-revision">,
) {
  try {
    const { memoId } = await context.params;
    const body = await parseJson<{ actorId?: string; comment?: string }>(request);
    return Response.json(await requestMemoRevision(memoId, body.comment ?? "", body.actorId));
  } catch (error) {
    console.error(error);
    return jsonErrorFromUnknown(error, "Failed to request revision");
  }
}
