import { auth } from "@/auth";
import { nsApi } from "@/lib/ns-api";
import { getCachedOrFetch, CACHE_TTL } from "@/lib/cache";
import { NextResponse } from "next/server";

/**
 * GET /api/ns/calls - Get active calls
 * Returns list of currently active calls with caching
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch with caching
    const calls = await getCachedOrFetch(
      "ns:active-calls",
      () => nsApi.getActiveCalls(),
      CACHE_TTL.LIVE_CALLS
    );

    return NextResponse.json({ calls });
  } catch (error) {
    console.error("[API] Failed to fetch active calls:", error);
    return NextResponse.json(
      { error: "Failed to fetch active calls" },
      { status: 500 }
    );
  }
}
