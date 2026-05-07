import { jsonError } from "@/lib/server/route-utils";
import { markQcPassed } from "@/lib/server/procurement";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/purchase-orders/[poId]/mark-qc-passed">,
) {
  try {
    const { poId } = await context.params;
    return Response.json(await markQcPassed(poId));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to mark QC passed", 400);
  }
}
