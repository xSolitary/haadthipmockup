import {
  deleteVendorProposal,
  type VendorProposalPayload,
  updateVendorProposal,
} from "@/lib/server/procurement";
import { jsonErrorFromUnknown, parseJson } from "@/lib/server/route-utils";

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
    return jsonErrorFromUnknown(error, "Failed to update vendor proposal");
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
    return jsonErrorFromUnknown(error, "Failed to delete vendor proposal");
  }
}
