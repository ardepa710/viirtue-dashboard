import { auth } from "@/auth";
import { nsApi } from "@/lib/ns-api";
import { getCachedOrFetch, CACHE_TTL } from "@/lib/cache";
import { NextResponse } from "next/server";

/**
 * GET /api/ns/queues - Get queue statistics
 * Returns list of call queues with current status
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

    const queues = await getCachedOrFetch(
      "ns:queues",
      () => nsApi.getQueues(),
      CACHE_TTL.QUEUES
    );

    return NextResponse.json({ queues });
  } catch (error) {
    console.error("[API] Failed to fetch queues:", error);
    return NextResponse.json(
      { error: "Failed to fetch queues" },
      { status: 500 }
    );
  }
}
