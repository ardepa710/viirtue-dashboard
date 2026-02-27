import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/audit - Get audit logs
 * Query params: action, userId, limit, offset, startDate, endDate
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

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : 0;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Fetch logs with user info
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("[API] Failed to fetch audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
