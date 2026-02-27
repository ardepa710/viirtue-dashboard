import { auth } from "@/auth";
import { nsApi } from "@/lib/ns-api";
import { getCachedOrFetch, CACHE_TTL } from "@/lib/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/ns/cdr - Get call detail records
 * Query params: start, end, limit, user, direction, offset
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      start: searchParams.get("start") || undefined,
      end: searchParams.get("end") || undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      user: searchParams.get("user") || undefined,
      direction: searchParams.get("direction") as "inbound" | "outbound" | "internal" | undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
    };

    // Create cache key from params
    const cacheKey = `ns:cdr:${JSON.stringify(params)}`;

    const cdr = await getCachedOrFetch(
      cacheKey,
      () => nsApi.getCDR(params),
      CACHE_TTL.CDR
    );

    return NextResponse.json({ cdr });
  } catch (error) {
    console.error("[API] Failed to fetch CDR:", error);
    return NextResponse.json(
      { error: "Failed to fetch CDR" },
      { status: 500 }
    );
  }
}
