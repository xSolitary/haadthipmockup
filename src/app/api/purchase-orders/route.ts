import { getPurchaseOrders } from "@/lib/server/procurement";
import { jsonError } from "@/lib/server/route-utils";

export async function GET() {
  try {
    return Response.json(await getPurchaseOrders());
  } catch (error) {
    console.error(error);
    return jsonError("Failed to load purchase orders");
  }
}
