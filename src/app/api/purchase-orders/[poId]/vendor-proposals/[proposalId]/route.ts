import {
  deleteVendorProposal,
  type VendorProposalPayload,
  updateVendorProposal,
} from "@/lib/server/procurement";
import { jsonError, parseJson } from "@/lib/server/route-utils";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/purchase-orders/[poId]/vendor-proposals/[proposalId]">,
) {
  try {
    const { poId, proposalId } = await context.params;
    const body = await parseJson<Partial<VendorProposalPayload>>(request);
    return Response.json(await updateVendorProposal(poId, proposalId, body));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to update vendor proposal", 400);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/purchase-orders/[poId]/vendor-proposals/[proposalId]">,
) {
  try {
    const { poId, proposalId } = await context.params;
    return Response.json(await deleteVendorProposal(poId, proposalId));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to delete vendor proposal", 400);
  }
}
