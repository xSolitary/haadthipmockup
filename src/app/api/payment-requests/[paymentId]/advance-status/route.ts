import { advancePaymentStatus } from "@/lib/server/procurement";
import { jsonError } from "@/lib/server/route-utils";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/payment-requests/[paymentId]/advance-status">,
) {
  try {
    const { paymentId } = await context.params;
    return Response.json(await advancePaymentStatus(paymentId));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to advance payment status", 400);
  }
}
