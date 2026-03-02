import { auth } from "@/auth";
import { nsApi } from "@/lib/ns-api";
import { NextResponse } from "next/server";

/**
 * GET /api/reports/numbers - Live VoIP numbers from NetSapiens phonenumber API
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [numbers, domains] = await nsApi.getPhoneNumbers();

    return NextResponse.json({ numbers, total: numbers.length, domains });
  } catch (error) {
    console.error("[Reports] Failed to load VoIP numbers:", error);
    return NextResponse.json({ error: "Failed to load numbers" }, { status: 500 });
  }
}
