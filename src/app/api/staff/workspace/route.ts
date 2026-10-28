import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedStaffId = searchParams.get("staffId");
    const requestedStaffEmail = searchParams.get("staffEmail");

    // Check auth session
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const isAuthed = token ? verifyAdminToken(token) : false;

    // Fetch all active staff for quick workspace switching
    const allStaff = await prisma.staff.findMany({
      where: { accountStatus: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (allStaff.length === 0) {
      return NextResponse.json({ error: "No active staff members found." }, { status: 404 });
    }

    // Determine target staff member
    let currentStaff = null;
    if (requestedStaffId) {
      currentStaff = allStaff.find((s) => s.id === requestedStaffId);
    } else if (requestedStaffEmail) {
      currentStaff = allStaff.find((s) => s.email.toLowerCase() === requestedStaffEmail.toLowerCase());
    }

    // Default to first staff member (e.g. Arun K) if none specified
    if (!currentStaff) {
      currentStaff = allStaff[0];
    }

    // Calculate today's date range in IST (UTC+5:30)
    const now = new Date();
    // Offset for IST
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);
    
    // Start of day in IST
    const todayStartIST = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0));
    const todayStart = new Date(todayStartIST.getTime() - istOffsetMs);

    // End of day in IST
    const todayEndIST = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 23, 59, 59, 999));
    const todayEnd = new Date(todayEndIST.getTime() - istOffsetMs);

    // Fetch candidates assigned to this staff member
    const clients = await prisma.client.findMany({
      where: {
        assignedStaffId: currentStaff.id,
      },
      orderBy: { name: "asc" },
      include: {
        applications: {
          where: {
            applicationDate: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          orderBy: { applicationDate: "desc" },
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            jobPostingUrl: true,
            portal: true,
            status: true,
            proofImageUrl: true,
            applicationDate: true,
            notes: true,
          },
        },
      },
    });

    // Format candidate cards with today's target progress
    const candidateRoster = clients.map((cx) => {
      const dailyTarget = cx.dailyTarget || 20;
      const appliedToday = cx.applications.length;
      const progressPercent = Math.min(100, Math.round((appliedToday / dailyTarget) * 100));

      let statusChip: "NOT_STARTED" | "IN_PROGRESS" | "TARGET_DONE" = "NOT_STARTED";
      if (appliedToday >= dailyTarget) {
        statusChip = "TARGET_DONE";
      } else if (appliedToday > 0) {
        statusChip = "IN_PROGRESS";
      }

      return {
        id: cx.id,
        name: cx.name,
        email: cx.email,
        phone: cx.phone,
        targetRole: cx.targetRole,
        preferredLocation: cx.preferredLocation || "Remote",
        experienceLevel: cx.experienceLevel || "Mid-Level",
        dailyTarget,
        appliedToday,
        progressPercent,
        statusChip,
        todayApplications: cx.applications,
      };
    });

    // KPI Summary
    const totalCandidates = candidateRoster.length;
    const totalTargetSum = candidateRoster.reduce((sum, c) => sum + c.dailyTarget, 0);
    const totalAppliedToday = candidateRoster.reduce((sum, c) => sum + c.appliedToday, 0);
    const completedTargetsCount = candidateRoster.filter((c) => c.statusChip === "TARGET_DONE").length;

    return NextResponse.json({
      success: true,
      staff: currentStaff,
      allStaff,
      metrics: {
        totalCandidates,
        totalTargetSum,
        totalAppliedToday,
        completedTargetsCount,
        overallCompletionRate: totalTargetSum > 0 ? Math.round((totalAppliedToday / totalTargetSum) * 100) : 0,
      },
      candidates: candidateRoster,
    });
  } catch (error) {
    console.error("Staff workspace error:", error);
    return NextResponse.json(
      { error: "Failed to load staff workspace data." },
      { status: 500 }
    );
  }
}
