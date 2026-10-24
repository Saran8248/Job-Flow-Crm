import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        clients: {
          include: {
            applications: true,
            interviews: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const appliedCount = staff.clients.reduce(
      (sum, c) => sum + c.applications.length,
      0
    );
    const assessmentCount = staff.clients.reduce(
      (sum, c) =>
        sum + c.applications.filter((a) => a.status === "ASSESSMENT").length,
      0
    );
    const interviewCount = staff.clients.reduce(
      (sum, c) => sum + c.interviews.length,
      0
    );

    return NextResponse.json({
      staff: {
        ...staff,
        clientsCount: staff.clients.length,
        appliedCount,
        assessmentCount,
        interviewCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch staff member", details: error.message },
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

    const updated = await prisma.staff.update({
      where: { id },
      data: {
        name: body.name ? body.name.trim() : undefined,
        email: body.email ? body.email.trim() : undefined,
        role: body.role ? body.role.trim() : undefined,
        accountStatus: body.accountStatus || undefined,
      },
    });

    return NextResponse.json({ staff: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update staff member", details: error.message },
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

    // Unassign clients first
    await prisma.client.updateMany({
      where: { assignedStaffId: id },
      data: { assignedStaffId: null },
    });

    // Delete staff
    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Staff member deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete staff member", details: error.message },
      { status: 500 }
    );
  }
}
