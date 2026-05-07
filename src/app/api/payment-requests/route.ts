import { getPaymentRequests } from "@/lib/server/procurement";
import { jsonError } from "@/lib/server/route-utils";

export async function GET() {
  try {
    return Response.json(await getPaymentRequests());
  } catch (error) {
    console.error(error);
    return jsonError("Failed to load payment requests");
  }
}
