import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decodeAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedStaffId = searchParams.get("staffId");
    const dateRange = searchParams.get("dateRange") || "today"; // "today" | "yesterday" | "7days" | "30days" | "all" | "custom"
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const portalFilter = searchParams.get("portal");
    const candidateFilter = searchParams.get("candidateId");

    // 1. Check session from cookie
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const sessionPayload = token ? decodeAdminToken(token) : null;

    // 2. Fetch all active staff
    const allStaff = await prisma.staff.findMany({
      where: { accountStatus: "ACTIVE" },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { clients: true },
        },
      },
    });

    if (allStaff.length === 0) {
      return NextResponse.json(
        { error: "No active staff members found." },
        { status: 404 }
      );
    }

    // 3. Determine current selected staff member
    let currentStaff = null;
    if (requestedStaffId && requestedStaffId !== "all") {
      currentStaff = allStaff.find((s) => s.id === requestedStaffId);
    } else if (sessionPayload?.staffId) {
      currentStaff = allStaff.find((s) => s.id === sessionPayload.staffId);
    }

    if (!currentStaff && requestedStaffId !== "all") {
      currentStaff = allStaff[0];
    }

    // 4. Calculate IST Date Bounds
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const now = new Date();
    const istNow = new Date(now.getTime() + istOffsetMs);

    // Today in IST
    const todayStartIST = new Date(
      Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0)
    );
    const todayStart = new Date(todayStartIST.getTime() - istOffsetMs);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Date Range calculation for the requested filter
    let periodStart = todayStart;
    let periodEnd = todayEnd;

    if (dateRange === "yesterday") {
      const yesterdayStartIST = new Date(todayStartIST.getTime() - 24 * 60 * 60 * 1000);
      periodStart = new Date(yesterdayStartIST.getTime() - istOffsetMs);
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    } else if (dateRange === "7days") {
      periodStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
      periodEnd = todayEnd;
    } else if (dateRange === "30days") {
      periodStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
      periodEnd = todayEnd;
    } else if (dateRange === "all") {
      periodStart = new Date(0);
      periodEnd = new Date(8640000000000000);
    } else if (dateRange === "custom" && startDateParam && endDateParam) {
      const [sy, sm, sd] = startDateParam.split("-").map(Number);
      const [ey, em, ed] = endDateParam.split("-").map(Number);
      periodStart = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0) - istOffsetMs);
      periodEnd = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999) - istOffsetMs);
    }

    // 5. Build Client Query
    const clientWhere: any = {};
    if (requestedStaffId !== "all" && currentStaff) {
      clientWhere.assignedStaffId = currentStaff.id;
    }
    if (candidateFilter) {
      clientWhere.id = candidateFilter;
    }

    const clients = await prisma.client.findMany({
      where: clientWhere,
      orderBy: { name: "asc" },
      include: {
        staff: {
          select: { id: true, name: true, role: true },
        },
        applications: {
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

    // 6. Process candidate statistics ("staff applying cx names counts")
    const candidateStats = clients.map((cx) => {
      const dailyTarget = cx.dailyTarget || 20;

      // Filter applications for today (IST)
      const appsToday = cx.applications.filter((app) => {
        const appDate = new Date(app.applicationDate);
        return appDate >= todayStart && appDate <= todayEnd;
      });

      // Filter applications for requested period
      const appsPeriod = cx.applications.filter((app) => {
        const appDate = new Date(app.applicationDate);
        return appDate >= periodStart && appDate <= periodEnd;
      });

      const todayAppliedCount = appsToday.length;
      const periodAppliedCount = appsPeriod.length;
      const totalLifetimeCount = cx.applications.length;

      const progressPercent = Math.min(100, Math.round((todayAppliedCount / dailyTarget) * 100));

      let statusChip: "NOT_STARTED" | "IN_PROGRESS" | "TARGET_DONE" = "NOT_STARTED";
      if (todayAppliedCount >= dailyTarget) {
        statusChip = "TARGET_DONE";
      } else if (todayAppliedCount > 0) {
        statusChip = "IN_PROGRESS";
      }

      const latestApp = cx.applications[0] || null;

      return {
        id: cx.id,
        name: cx.name,
        email: cx.email,
        phone: cx.phone,
        targetRole: cx.targetRole,
        preferredLocation: cx.preferredLocation || "Remote",
        experienceLevel: cx.experienceLevel || "Mid-Level",
        dailyTarget,
        todayAppliedCount,
        periodAppliedCount,
        totalLifetimeCount,
        progressPercent,
        statusChip,
        assignedStaff: cx.staff,
        lastAppliedJob: latestApp
          ? {
              jobTitle: latestApp.jobTitle,
              companyName: latestApp.companyName,
              portal: latestApp.portal || "Direct",
              status: latestApp.status,
              applicationDate: latestApp.applicationDate,
            }
          : null,
        recentApplications: cx.applications.slice(0, 5),
      };
    });

    // 7. Aggregate KPI Metrics
    const totalCandidates = candidateStats.length;
    const totalDailyTargetSum = candidateStats.reduce((sum, c) => sum + c.dailyTarget, 0);
    const totalAppliedToday = candidateStats.reduce((sum, c) => sum + c.todayAppliedCount, 0);
    const totalAppliedPeriod = candidateStats.reduce((sum, c) => sum + c.periodAppliedCount, 0);
    const completedTargetsCount = candidateStats.filter((c) => c.statusChip === "TARGET_DONE").length;
    const overallCompletionRate =
      totalDailyTargetSum > 0 ? Math.round((totalAppliedToday / totalDailyTargetSum) * 100) : 0;
    const avgAppsPerCandidate =
      totalCandidates > 0 ? (totalAppliedToday / totalCandidates).toFixed(1) : "0.0";

    // 8. Flat list of applications in period for the audit log
    let flatApplications: Array<{
      id: string;
      clientId: string;
      clientName: string;
      clientTargetRole: string;
      staffName?: string;
      jobTitle: string;
      companyName: string;
      portal: string;
      status: string;
      applicationDate: Date;
      proofImageUrl: string | null;
      jobPostingUrl: string | null;
      notes: string | null;
    }> = [];

    clients.forEach((cx) => {
      cx.applications.forEach((app) => {
        const appDate = new Date(app.applicationDate);
        if (appDate >= periodStart && appDate <= periodEnd) {
          if (!portalFilter || (app.portal && app.portal.toLowerCase() === portalFilter.toLowerCase())) {
            flatApplications.push({
              id: app.id,
              clientId: cx.id,
              clientName: cx.name,
              clientTargetRole: cx.targetRole,
              staffName: cx.staff?.name || "Staff",
              jobTitle: app.jobTitle,
              companyName: app.companyName,
              portal: app.portal || "Direct",
              status: app.status || "APPLIED",
              applicationDate: app.applicationDate,
              proofImageUrl: app.proofImageUrl,
              jobPostingUrl: app.jobPostingUrl,
              notes: app.notes,
            });
          }
        }
      });
    });

    // Sort latest first
    flatApplications.sort(
      (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
    );

    // 9. Portal Breakdown
    const portalCounts: Record<string, number> = {};
    flatApplications.forEach((app) => {
      const p = app.portal || "Other";
      portalCounts[p] = (portalCounts[p] || 0) + 1;
    });

    const portalBreakdown = Object.entries(portalCounts).map(([portal, count]) => ({
      portal,
      count,
      percent: flatApplications.length > 0 ? Math.round((count / flatApplications.length) * 100) : 0,
    }));

    // 10. Status Breakdown
    const statusCounts: Record<string, number> = {};
    flatApplications.forEach((app) => {
      const s = app.status || "APPLIED";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percent: flatApplications.length > 0 ? Math.round((count / flatApplications.length) * 100) : 0,
    }));

    // 11. Staff Leaderboard / Comparison for team overview
    const staffLeaderboard = await Promise.all(
      allStaff.map(async (st) => {
        const staffClients = await prisma.client.findMany({
          where: { assignedStaffId: st.id },
          include: {
            applications: {
              where: {
                applicationDate: {
                  gte: todayStart,
                  lte: todayEnd,
                },
              },
              select: { id: true },
            },
          },
        });

        const clientCount = staffClients.length;
        const totalTarget = staffClients.reduce((acc, c) => acc + (c.dailyTarget || 20), 0);
        const appliedCount = staffClients.reduce((acc, c) => acc + c.applications.length, 0);
        const completionRate =
          totalTarget > 0 ? Math.round((appliedCount / totalTarget) * 100) : 0;

        return {
          id: st.id,
          name: st.name,
          email: st.email,
          role: st.role,
          clientsCount: clientCount,
          appliedToday: appliedCount,
          dailyTargetSum: totalTarget,
          completionRate,
        };
      })
    );

    return NextResponse.json({
      success: true,
      currentStaff: currentStaff
        ? {
            id: currentStaff.id,
            name: currentStaff.name,
            email: currentStaff.email,
            role: currentStaff.role,
          }
        : null,
      allStaff: allStaff.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        clientsCount: s._count.clients,
      })),
      dateRange,
      periodDates: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      metrics: {
        totalCandidates,
        totalDailyTargetSum,
        totalAppliedToday,
        totalAppliedPeriod,
        overallCompletionRate,
        completedTargetsCount,
        avgAppsPerCandidate,
        portalBreakdown,
        statusBreakdown,
      },
      candidates: candidateStats,
      applications: flatApplications.slice(0, 50),
      staffLeaderboard,
    });
  } catch (error) {
    console.error("Staff performance API error:", error);
    return NextResponse.json(
      { error: "Failed to load staff performance data." },
      { status: 500 }
    );
  }
}
