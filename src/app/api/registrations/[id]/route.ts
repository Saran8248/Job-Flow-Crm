import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const data: any = {};

    // 1. Toggle Portal Access / Approval
    if (body.portalEnabled !== undefined) {
      data.portalEnabled = Boolean(body.portalEnabled);
      data.registrationStatus = body.portalEnabled ? "APPROVED" : "PENDING";
    }

    if (body.registrationStatus !== undefined) {
      data.registrationStatus = body.registrationStatus;
      data.portalEnabled = body.registrationStatus === "APPROVED";
    }

    // 2. Set / Reset Password
    if (body.password && typeof body.password === "string") {
      if (body.password.trim().length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      data.passwordHash = hashPassword(body.password.trim());
      data.isFirstLogin = false;
      data.otpCode = null;
      data.otpExpiresAt = null;
    }

    // 3. Reset to First-time OTP
    if (body.resetToOtp) {
      data.passwordHash = null;
      data.isFirstLogin = true;
      data.otpCode = null;
      data.otpExpiresAt = null;
    }

    const updated = await prisma.client.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_CANDIDATE_ACCESS",
        entityType: "CLIENT",
        entityId: id,
        details: `Admin updated access for ${client.name} (portalEnabled: ${updated.portalEnabled}, status: ${updated.registrationStatus})`,
        performedBy: "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Candidate credentials/access updated successfully",
      candidate: {
        ...updated,
        hasPassword: Boolean(updated.passwordHash),
        passwordHash: undefined,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/registrations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update candidate access", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.portalAccessLog.deleteMany({ where: { clientId: id } }),
      prisma.clientTask.deleteMany({ where: { clientId: id } }),
      prisma.clientNote.deleteMany({ where: { clientId: id } }),
      prisma.clientStageHistory.deleteMany({ where: { clientId: id } }),
      prisma.recruiterCommunication.deleteMany({ where: { clientId: id } }),
      prisma.interview.deleteMany({ where: { clientId: id } }),
      prisma.payment.deleteMany({ where: { clientId: id } }),
      prisma.application.deleteMany({ where: { clientId: id } }),
      prisma.client.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          action: "DELETE_CANDIDATE_REGISTRATION",
          entityType: "CLIENT",
          entityId: id,
          details: `Deleted candidate registration: ${client.name} (${client.email})`,
          performedBy: "Admin",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Candidate ${client.name} deleted successfully`,
    });
  } catch (error: any) {
    console.error("DELETE /api/registrations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete candidate registration", details: error.message },
      { status: 500 }
    );
  }
}
