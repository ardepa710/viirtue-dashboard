import { auth } from "@/auth";
import { nsApi } from "@/lib/ns-api";
import { prisma } from "@/prisma/prisma.config";
import { NextResponse } from "next/server";

/**
 * POST /api/ns/calls/[id]/transfer - Transfer a call
 * Body: { destination: string }
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
    const { destination } = await request.json();

    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }

    await nsApi.transferCall(callId, destination);

    prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: "CALL_TRANSFER",
          resource: "calls",
          details: JSON.stringify({ callId, destination }),
        },
      })
      .catch((error) => {
        console.error("[API] Failed to log call transfer:", error);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to transfer call:", error);
    return NextResponse.json(
      { error: "Failed to transfer call" },
      { status: 500 }
    );
  }
}
