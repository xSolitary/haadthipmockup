import { getUsers } from "@/lib/server/procurement";
import { jsonError } from "@/lib/server/route-utils";

export async function GET() {
  try {
    return Response.json(await getUsers());
  } catch (error) {
    console.error(error);
    return jsonError("Failed to load users");
  }
}
