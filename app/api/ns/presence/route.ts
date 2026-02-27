import { auth } from "@/auth";
import { nsApi } from "@/lib/ns-api";
import { getCachedOrFetch, CACHE_TTL } from "@/lib/cache";
import { NextResponse } from "next/server";

/**
 * GET /api/ns/presence - Get agent presence status
 * Returns list of agents with their current availability
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const presence = await getCachedOrFetch(
      "ns:presence",
      () => nsApi.getPresence(),
      CACHE_TTL.PRESENCE
    );

    return NextResponse.json({ presence });
  } catch (error) {
    console.error("[API] Failed to fetch presence:", error);
    return NextResponse.json(
      { error: "Failed to fetch presence" },
      { status: 500 }
    );
  }
}
