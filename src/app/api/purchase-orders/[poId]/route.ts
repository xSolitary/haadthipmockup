import { getPurchaseOrderById } from "@/lib/server/procurement";
import { jsonError } from "@/lib/server/route-utils";

export async function GET(_request: Request, context: RouteContext<"/api/purchase-orders/[poId]">) {
  try {
    const { poId } = await context.params;
    const po = await getPurchaseOrderById(poId);
    if (!po) {
      return jsonError("Purchase order not found", 404);
    }
    return Response.json(po);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to load purchase order");
  }
}
