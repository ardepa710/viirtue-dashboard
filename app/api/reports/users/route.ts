import { auth } from "@/auth";
import { nsApi } from "@/lib/ns-api";
import { NextResponse } from "next/server";

/**
 * GET /api/reports/users - Live VoIP users from NetSapiens subscriber API
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [users, domains] = await nsApi.getSubscribers();

    return NextResponse.json({ users, total: users.length, domains });
  } catch (error) {
    console.error("[Reports] Failed to load VoIP users:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
