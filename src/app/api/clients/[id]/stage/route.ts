import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StageKey } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { newStage, changedBy = "Staff Member", notes } = body;

    if (!newStage) {
      return NextResponse.json(
        { error: "newStage is required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const previousStage = client.currentStage;

    const [updatedClient, historyEntry] = await prisma.$transaction([
      prisma.client.update({
        where: { id },
        data: {
          currentStage: newStage as StageKey,
        },
        include: {
          staff: true,
        },
      }),
      prisma.clientStageHistory.create({
        data: {
          clientId: id,
          previousStage,
          newStage,
          changedBy,
          notes: notes || `Stage transitioned from ${previousStage} to ${newStage}`,
        },
      }),
      prisma.notification.create({
        data: {
          title: "Client Stage Updated",
          message: `${client.name} moved to stage: ${newStage}`,
          type: "INFO",
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "UPDATE_STAGE",
          entityType: "CLIENT",
          entityId: id,
          details: `Moved ${client.name} from ${previousStage} to ${newStage}`,
          performedBy: changedBy,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      client: updatedClient,
      history: historyEntry,
    });
  } catch (error: any) {
    console.error("POST /api/clients/[id]/stage error:", error);
    return NextResponse.json(
      { error: "Failed to update client stage", details: error.message },
      { status: 500 }
    );
  }
}
