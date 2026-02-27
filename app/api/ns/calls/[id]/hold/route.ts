import { auth } from "@/auth";
import { nsApi } from "@/lib/ns-api";
import { prisma } from "@/prisma/prisma.config";
import { NextResponse } from "next/server";

/**
 * POST /api/ns/calls/[id]/hold - Hold a call
 * Requires authentication and logs action to audit log
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const callId = params.id;

    await nsApi.holdCall(callId);

    prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: "CALL_HOLD",
          resource: "calls",
          details: JSON.stringify({ callId }),
        },
      })
      .catch((error) => {
        console.error("[API] Failed to log call hold:", error);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to hold call:", error);
    return NextResponse.json(
      { error: "Failed to hold call" },
      { status: 500 }
    );
  }
}
