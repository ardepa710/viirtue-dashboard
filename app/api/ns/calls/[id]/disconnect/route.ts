import { auth } from "@/auth";
import { nsApi } from "@/lib/ns-api";
import { prisma } from "@/prisma/prisma.config";
import { NextResponse } from "next/server";

/**
 * POST /api/ns/calls/[id]/disconnect - Disconnect a call
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

    // Disconnect call via NS-API
    await nsApi.disconnectCall(callId);

    // Log action to audit log (fire and forget)
    prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: "CALL_DISCONNECT",
          resource: "calls",
          details: JSON.stringify({ callId }),
        },
      })
      .catch((error) => {
        console.error("[API] Failed to log call disconnect:", error);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to disconnect call:", error);
    return NextResponse.json(
      { error: "Failed to disconnect call" },
      { status: 500 }
    );
  }
}
