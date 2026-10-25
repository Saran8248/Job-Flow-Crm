import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendClientUpdateEmail } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        staff: true,
        stageHistory: {
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        interviews: {
          orderBy: { scheduledAt: "asc" },
        },
        recruiterCommunications: {
          orderBy: { receivedAt: "desc" },
        },
        clientNotes: {
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
        },
        applications: {
          orderBy: { applicationDate: "desc" },
          take: 50,
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Also fetch recent portal access logs
    const portalLogs = await prisma.portalAccessLog.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      client: {
        ...client,
        totalApplicationsCount: client._count.applications,
        portalAccessLogs: portalLogs,
      },
    });
  } catch (error: any) {
    console.error("GET /api/clients/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client details", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const totalFee =
      body.totalFee !== undefined ? Number(body.totalFee) : existingClient.totalFee;
    const amountPaid =
      body.amountPaid !== undefined
        ? Number(body.amountPaid)
        : existingClient.amountPaid;
    const balance = Math.max(0, totalFee - amountPaid);

    let paymentStatus = body.paymentStatus || existingClient.paymentStatus;
    if (totalFee > 0 && body.amountPaid !== undefined) {
      if (amountPaid >= totalFee) {
        paymentStatus = "PAID";
      } else if (amountPaid > 0) {
        paymentStatus = "PARTIALLY_PAID";
      } else {
        paymentStatus = "PENDING";
      }
    }

    // Portal token regeneration support
    let portalToken = existingClient.portalToken;
    if (body.regenerateToken) {
      const slug = (body.name || existingClient.name).toLowerCase().replace(/[^a-z0-9]/g, "-");
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      portalToken = `cx-${slug}-${randomSuffix}`;
    } else if (body.portalToken !== undefined) {
      portalToken = body.portalToken;
    }

    const portalEnabled =
      body.portalEnabled !== undefined
        ? Boolean(body.portalEnabled)
        : existingClient.portalEnabled;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: body.name ?? existingClient.name,
        email: body.email ?? existingClient.email,
        phone: body.phone ?? existingClient.phone,
        targetRole: body.targetRole ?? existingClient.targetRole,
        preferredLocation: body.preferredLocation ?? existingClient.preferredLocation,
        experienceLevel: body.experienceLevel ?? existingClient.experienceLevel,
        skills: body.skills ?? existingClient.skills,
        resumeUrl: body.resumeUrl ?? existingClient.resumeUrl,
        assignedStaffId:
          body.assignedStaffId !== undefined
            ? body.assignedStaffId
            : existingClient.assignedStaffId,
        totalFee,
        amountPaid,
        balance,
        paymentStatus,
        planDurationMonths:
          body.planDurationMonths ?? existingClient.planDurationMonths,
        planStartDate: body.planStartDate
          ? new Date(body.planStartDate)
          : existingClient.planStartDate,
        planEndDate: body.planEndDate
          ? new Date(body.planEndDate)
          : existingClient.planEndDate,
        dailyTarget: body.dailyTarget ?? existingClient.dailyTarget,
        notes: body.notes ?? existingClient.notes,
        portalEnabled,
        portalToken,
      },
      include: {
        staff: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_CLIENT",
        entityType: "CLIENT",
        entityId: id,
        details: `Updated details for ${updatedClient.name}${body.regenerateToken ? " (Portal token regenerated)" : ""}`,
        performedBy: "Staff Member",
      },
    });

    // Dispatch real-time profile update confirmation email to candidate
    if (updatedClient.email && (body.targetRole || body.dailyTarget || body.skills)) {
      await sendClientUpdateEmail({
        to: updatedClient.email,
        candidateName: updatedClient.name,
        targetRole: updatedClient.targetRole,
        specialistName: updatedClient.staff?.name || "Career Specialist",
      }).catch((err) => console.error("Client update email error:", err));
    }

    return NextResponse.json({ client: updatedClient });
  } catch (error: any) {
    console.error("PATCH /api/clients/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update client", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
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
          action: "DELETE_CLIENT",
          entityType: "CLIENT",
          entityId: id,
          details: `Deleted candidate ${client.name} (${client.email})`,
          performedBy: "Staff Member",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Client ${client.name} deleted successfully`,
    });
  } catch (error: any) {
    console.error("DELETE /api/clients/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete client", details: error.message },
      { status: 500 }
    );
  }
}
