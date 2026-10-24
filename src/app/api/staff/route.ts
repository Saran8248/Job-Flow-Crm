import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  role: z.string().min(2, "Role is required"),
});

export async function GET() {
  try {
    const staffMembers = await prisma.staff.findMany({
      orderBy: { name: "asc" },
      include: {
        clients: {
          select: {
            id: true,
            name: true,
            email: true,
            targetRole: true,
            currentStage: true,
            planDurationMonths: true,
            applications: {
              select: {
                id: true,
                status: true,
              },
            },
            interviews: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const staffWithMetrics = staffMembers.map((staff) => {
      const clientsCount = staff.clients.length;

      let appliedCount = 0;
      let assessmentCount = 0;
      let interviewCount = 0;

      for (const client of staff.clients) {
        appliedCount += client.applications.length;

        for (const app of client.applications) {
          if (app.status === "ASSESSMENT") {
            assessmentCount += 1;
          }
        }

        interviewCount += client.interviews.length;
      }

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        accountStatus: staff.accountStatus,
        createdAt: staff.createdAt,
        clientsCount,
        appliedCount,
        assessmentCount,
        interviewCount,
        clients: staff.clients.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          targetRole: c.targetRole,
          currentStage: c.currentStage,
          planDurationMonths: c.planDurationMonths,
          totalApplications: c.applications.length,
          totalInterviews: c.interviews.length,
        })),
      };
    });

    return NextResponse.json({ staff: staffWithMetrics });
  } catch (error: any) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff list", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createStaffSchema.parse(body);

    const existing = await prisma.staff.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A staff member with this email already exists" },
        { status: 400 }
      );
    }

    const newStaff = await prisma.staff.create({
      data: {
        name: validated.name.trim(),
        email: validated.email.trim(),
        role: validated.role.trim(),
        accountStatus: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_STAFF",
        entityType: "STAFF",
        entityId: newStaff.id,
        details: `Added new staff member: ${newStaff.name} (${newStaff.role})`,
        performedBy: "Team Administrator",
      },
    });

    return NextResponse.json({ staff: newStaff }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/staff error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.errors },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create staff member", details: error.message },
      { status: 500 }
    );
  }
}
