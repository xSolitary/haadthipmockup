import { addVendorProposal, type VendorProposalPayload } from "@/lib/server/procurement";
import { jsonErrorFromUnknown, parseJson } from "@/lib/server/route-utils";

export async function POST(
  request: Request,
  context: RouteContext<"/api/purchase-orders/[poId]/vendor-proposals">,
) {
  try {
    const { poId } = await context.params;
    const body = await parseJson<{ actorId?: string; proposal: VendorProposalPayload }>(request);
    return Response.json(await addVendorProposal(poId, body.proposal, body.actorId));
  } catch (error) {
    console.error(error);
    return jsonErrorFromUnknown(error, "Failed to add vendor proposal");
  }
}
