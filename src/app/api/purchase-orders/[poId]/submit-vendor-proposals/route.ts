import { jsonError, parseJson } from "@/lib/server/route-utils";
import { submitVendorProposals } from "@/lib/server/procurement";

export async function POST(
  request: Request,
  context: RouteContext<"/api/purchase-orders/[poId]/submit-vendor-proposals">,
) {
  try {
    const { poId } = await context.params;
    const body = await parseJson<{ actorId?: string; proposalIds: string[] }>(request);
    return Response.json(await submitVendorProposals(poId, body.proposalIds, body.actorId));
  } catch (error) {
    console.error(error);
    return jsonError(
      error instanceof Error ? error.message : "Failed to submit vendor proposals",
      400,
    );
  }
}
