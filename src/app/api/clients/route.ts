import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional().nullable(),
  targetRole: z.string().min(2, "Target role is required"),
  preferredLocation: z.string().optional().nullable(),
  experienceLevel: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
  currentStage: z.string().default("CONFIRMED"),
  paymentStatus: z.string().default("PENDING"),
  assignedStaffId: z.string().optional().nullable(),
  totalFee: z.number().nonnegative().default(0),
  amountPaid: z.number().nonnegative().default(0),
  planDurationMonths: z.number().int().positive().default(1),
  planStartDate: z.string(),
  planEndDate: z.string(),
  dailyTarget: z.number().int().positive().default(60),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const stage = searchParams.get("stage")?.trim() || "ALL";
    const payment = searchParams.get("payment")?.trim() || "ALL";
    const staffId = searchParams.get("staffId")?.trim() || "ALL";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: any = {};

    // Search by name, email, targetRole
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { targetRole: { contains: search } },
      ];
    }

    // Filter by stage
    if (stage && stage !== "ALL") {
      where.currentStage = stage;
    }

    // Filter by payment status
    if (payment && payment !== "ALL") {
      where.paymentStatus = payment;
    }

    // Filter by staff
    if (staffId && staffId !== "ALL") {
      where.assignedStaffId = staffId;
    }

    // Fetch clients
    const clients = await prisma.client.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
            payments: true,
            interviews: true,
            recruiterCommunications: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // Format clients and compute live application counts
    const formattedClients = clients.map((c) => ({
      ...c,
      totalApplicationsCount: c._count.applications,
      balance: Math.max(0, c.totalFee - c.amountPaid),
    }));

    return NextResponse.json({ clients: formattedClients });
  } catch (error: any) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createClientSchema.parse(body);

    // Check duplicate email
    const existing = await prisma.client.findUnique({
      where: { email: validated.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A client with this email address already exists" },
        { status: 400 }
      );
    }

    const balance = Math.max(0, validated.totalFee - validated.amountPaid);
    let paymentStatus = validated.paymentStatus;
    if (validated.totalFee > 0) {
      if (validated.amountPaid >= validated.totalFee) {
        paymentStatus = "PAID";
      } else if (validated.amountPaid > 0) {
        paymentStatus = "PARTIALLY_PAID";
      } else {
        paymentStatus = "PENDING";
      }
    }

    // Create client transaction
    const newClient = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          name: validated.name,
          email: validated.email,
          phone: validated.phone || null,
          targetRole: validated.targetRole,
          preferredLocation: validated.preferredLocation || null,
          experienceLevel: validated.experienceLevel || null,
          skills: validated.skills || null,
          resumeUrl: validated.resumeUrl || null,
          currentStage: validated.currentStage,
          paymentStatus,
          assignedStaffId: validated.assignedStaffId || null,
          totalFee: validated.totalFee,
          amountPaid: validated.amountPaid,
          balance,
          planDurationMonths: validated.planDurationMonths,
          planStartDate: new Date(validated.planStartDate),
          planEndDate: new Date(validated.planEndDate),
          dailyTarget: validated.dailyTarget,
          notes: validated.notes || null,
        },
        include: {
          staff: true,
        },
      });

      // Stage history log
      await tx.clientStageHistory.create({
        data: {
          clientId: client.id,
          previousStage: "CONFIRMED",
          newStage: validated.currentStage,
          changedBy: "Team Member",
          notes: "Initial client enrollment",
        },
      });

      // Payment record if initial amount paid > 0
      if (validated.amountPaid > 0) {
        await tx.payment.create({
          data: {
            clientId: client.id,
            amount: validated.amountPaid,
            paymentDate: new Date(validated.planStartDate),
            paymentMethod: "Bank Transfer / UPI",
            status: "COMPLETED",
            referenceNumber: `INV-${Date.now().toString().slice(-6)}`,
            notes: "Initial registration payment",
          },
        });
      }

      // Notification
      await tx.notification.create({
        data: {
          title: "New Client Enrolled",
          message: `${client.name} has been enrolled for ${client.targetRole} (${client.planDurationMonths} Month Plan).`,
          type: "SUCCESS",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "CREATE_CLIENT",
          entityType: "CLIENT",
          entityId: client.id,
          details: `Enrolled client ${client.name} with email ${client.email}`,
          performedBy: "Staff Member",
        },
      });

      return client;
    });

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.errors },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create client", details: error.message },
      { status: 500 }
    );
  }
}
