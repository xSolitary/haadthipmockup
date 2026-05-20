import { advancePaymentStatus } from "@/lib/server/procurement";
import { jsonErrorFromUnknown, parseJson } from "@/lib/server/route-utils";

export async function POST(
  request: Request,
  context: RouteContext<"/api/payment-requests/[paymentId]/advance-status">,
) {
  try {
    const { paymentId } = await context.params;
    const body = await parseJson<{ targetStatus?: "Pending Invoice" | "Ready for AP Posting" | "Approved for Payment" | "Paid" }>(request);
    return Response.json(await advancePaymentStatus(paymentId, body.targetStatus));
  } catch (error) {
    console.error(error);
    return jsonErrorFromUnknown(error, "Failed to advance payment status");
  }
}
