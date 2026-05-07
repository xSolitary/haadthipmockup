import { approveVendorSelection } from "@/lib/server/procurement";
import { jsonError, parseJson } from "@/lib/server/route-utils";

export async function POST(
  request: Request,
  context: RouteContext<"/api/purchase-orders/[poId]/approve-vendor-selection">,
) {
  try {
    const { poId } = await context.params;
    const body = await parseJson<{ actorId?: string; proposalId: string; comment?: string }>(request);
    return Response.json(
      await approveVendorSelection(poId, body.proposalId, body.comment ?? "", body.actorId),
    );
  } catch (error) {
    console.error(error);
    return jsonError(
      error instanceof Error ? error.message : "Failed to approve vendor selection",
      400,
    );
  }
}
