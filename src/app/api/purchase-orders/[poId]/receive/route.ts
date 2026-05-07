import { jsonError, parseJson } from "@/lib/server/route-utils";
import { receivePurchaseOrder } from "@/lib/server/procurement";

export async function POST(
  request: Request,
  context: RouteContext<"/api/purchase-orders/[poId]/receive">,
) {
  try {
    const { poId } = await context.params;
    const body = await parseJson<Record<string, unknown>>(request);
    return Response.json(await receivePurchaseOrder(poId, body as never));
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : "Failed to receive purchase order", 400);
  }
}
