import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STAGE_LIST, StageKey } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    // Daily calculation aligned to Asia/Kolkata (IST) midnight reset
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);
    const todayStartIST = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
    const startOfToday = new Date(todayStartIST.getTime() - istOffsetMs);
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Yesterday bounds (IST)
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);

    // 7 days from now for renewals due
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch all clients with relationships
    const allClients = await prisma.client.findMany({
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        applications: {
          select: {
            id: true,
            companyName: true,
            jobTitle: true,
            status: true,
            applicationDate: true,
          },
        },
        interviews: {
          select: {
            id: true,
            companyName: true,
            round: true,
            scheduledAt: true,
            status: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentDate: true,
          },
        },
        _count: {
          select: {
            applications: true,
            interviews: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. Summary Counts
    const wholeCxCount = allClients.length;

    const activeClientsCount = allClients.filter(
      (c) => c.currentStage !== "RENEWED_CLOSED"
    ).length;

    const applicationsTodayCount = await prisma.application.count({
      where: {
        applicationDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const interviewsSecuredCount = await prisma.interview.count({
      where: {
        status: {
          in: ["SCHEDULED", "COMPLETED"],
        },
      },
    });

    const renewalsDueCount = allClients.filter(
      (c) =>
        new Date(c.planEndDate) <= sevenDaysFromNow &&
        c.currentStage !== "RENEWED_CLOSED"
    ).length;

    // 3. Cx Analysis Structure (Whole Cx, Paid, Ongoing Jobs, Assessments, Interviews, Cx Closure)
    const paidClientsList = allClients.filter(
      (c) => c.paymentStatus === "PAID" || c.amountPaid >= c.totalFee
    );

    const ongoingJobsClientsList = allClients.filter(
      (c) =>
        c.currentStage === "APPLICATIONS_IN_PROGRESS" ||
        c.currentStage === "FOLLOW_UP" ||
        c.currentStage === "PORTAL_SETUP" ||
        c.applications.length > 0
    );

    const assessmentClientsList = allClients.filter((c) =>
      c.applications.some((app) => app.status === "ASSESSMENT")
    );

    const interviewClientsList = allClients.filter((c) =>
      c.interviews.some((iv) => iv.status === "SCHEDULED" || iv.status === "COMPLETED")
    );

    const closureClientsList = allClients.filter(
      (c) =>
        c.currentStage === "RENEWED_CLOSED" ||
        new Date(c.planEndDate) < now
    );

    // Total counts for assessments
    const totalAssessmentsCount = await prisma.application.count({
      where: { status: "ASSESSMENT" },
    });

    const cxAnalysis = {
      wholeCx: {
        key: "wholeCx",
        title: "Whole Cx Count",
        count: wholeCxCount,
        description: "Total enrolled clients across all active & past stages",
        clients: allClients.map((c) => ({
          id: c.id,
          name: c.name,
          targetRole: c.targetRole,
          planDurationMonths: c.planDurationMonths,
          staffName: c.staff?.name || "Unassigned",
          currentStage: c.currentStage,
          paymentStatus: c.paymentStatus,
          totalApps: c.applications.length,
          interviewsCount: c.interviews.length,
        })),
      },
      paid: {
        key: "paid",
        title: "Paid Clients",
        count: paidClientsList.length,
        description: "Clients with full service fee payment settled",
        clients: paidClientsList.map((c) => ({
          id: c.id,
          name: c.name,
          targetRole: c.targetRole,
          planDurationMonths: c.planDurationMonths,
          staffName: c.staff?.name || "Unassigned",
          currentStage: c.currentStage,
          paymentStatus: c.paymentStatus,
          amountPaid: c.amountPaid,
          totalFee: c.totalFee,
        })),
      },
      ongoingJobs: {
        key: "ongoingJobs",
        title: "Ongoing Jobs",
        count: ongoingJobsClientsList.length,
        description: "Clients actively receiving application dispatches",
        clients: ongoingJobsClientsList.map((c) => ({
          id: c.id,
          name: c.name,
          targetRole: c.targetRole,
          planDurationMonths: c.planDurationMonths,
          staffName: c.staff?.name || "Unassigned",
          currentStage: c.currentStage,
          totalApps: c.applications.length,
          dailyTarget: c.dailyTarget || 60,
        })),
      },
      assessment: {
        key: "assessment",
        title: "Assessment Count",
        count: totalAssessmentsCount,
        clientCount: assessmentClientsList.length,
        description: "Clients with technical assessments & evaluations",
        clients: assessmentClientsList.map((c) => {
          const assessments = c.applications.filter((a) => a.status === "ASSESSMENT");
          return {
            id: c.id,
            name: c.name,
            targetRole: c.targetRole,
            planDurationMonths: c.planDurationMonths,
            staffName: c.staff?.name || "Unassigned",
            currentStage: c.currentStage,
            assessmentsCount: assessments.length,
            companies: assessments.map((a) => a.companyName).slice(0, 3).join(", "),
          };
        }),
      },
      interview: {
        key: "interview",
        title: "Interview Count",
        count: interviewsSecuredCount,
        clientCount: interviewClientsList.length,
        description: "Secured client interview rounds & scheduling",
        clients: interviewClientsList.map((c) => ({
          id: c.id,
          name: c.name,
          targetRole: c.targetRole,
          planDurationMonths: c.planDurationMonths,
          staffName: c.staff?.name || "Unassigned",
          currentStage: c.currentStage,
          interviewsCount: c.interviews.length,
          latestCompany: c.interviews[0]?.companyName || "Company Interview",
          latestRound: c.interviews[0]?.round || "Round 1",
        })),
      },
      cxClosureList: {
        key: "cxClosureList",
        title: "Cx Closure List",
        count: closureClientsList.length,
        description: "Clients who reached completion, renewed, or closed",
        clients: closureClientsList.map((c) => ({
          id: c.id,
          name: c.name,
          targetRole: c.targetRole,
          planDurationMonths: c.planDurationMonths,
          staffName: c.staff?.name || "Unassigned",
          currentStage: c.currentStage,
          planEndDate: c.planEndDate,
          totalApps: c.applications.length,
          interviewsCount: c.interviews.length,
        })),
      },
    };

    // 4. Standard 9-Stage Pipeline (Preserved for compatibility)
    const pipeline: Record<
      StageKey,
      {
        count: number;
        clients: Array<{
          id: string;
          name: string;
          targetRole: string;
          planDurationMonths: number;
          staffName: string;
          currentStage: string;
        }>;
      }
    > = {
      CONFIRMED: { count: 0, clients: [] },
      PAID: { count: 0, clients: [] },
      DETAILS_COLLECTED: { count: 0, clients: [] },
      DOCUMENTS_APPROVED: { count: 0, clients: [] },
      PORTAL_SETUP: { count: 0, clients: [] },
      APPLICATIONS_IN_PROGRESS: { count: 0, clients: [] },
      FOLLOW_UP: { count: 0, clients: [] },
      REPORT: { count: 0, clients: [] },
      RENEWED_CLOSED: { count: 0, clients: [] },
    };

    for (const client of allClients) {
      const stage = (client.currentStage as StageKey) || "CONFIRMED";
      if (!pipeline[stage]) {
        pipeline[stage] = { count: 0, clients: [] };
      }
      pipeline[stage].count += 1;
      pipeline[stage].clients.push({
        id: client.id,
        name: client.name,
        targetRole: client.targetRole,
        planDurationMonths: client.planDurationMonths,
        staffName: client.staff?.name || "Unassigned",
        currentStage: client.currentStage,
      });
    }

    // 5. Today's Application Progress
    const activePipelineStages = [
      "APPLICATIONS_IN_PROGRESS",
      "FOLLOW_UP",
      "PORTAL_SETUP",
      "REPORT",
    ];

    const progressClients = allClients.filter((c) =>
      activePipelineStages.includes(c.currentStage)
    );

    const todayProgress = await Promise.all(
      progressClients.map(async (client) => {
        const todayApps = await prisma.application.count({
          where: {
            clientId: client.id,
            applicationDate: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        });

        return {
          id: client.id,
          name: client.name,
          currentStage: client.currentStage,
          todayApps,
          dailyTarget: client.dailyTarget || 60,
          totalApps: client._count.applications,
        };
      })
    );

    // 6. Recruiter Inbox
    const recruiterInbox = await prisma.recruiterCommunication.findMany({
      take: 6,
      orderBy: {
        receivedAt: "desc",
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 7. Staff Performance & Target Tracking (Internal Team)
    const activeStaffMembers = await prisma.staff.findMany({
      where: { accountStatus: "ACTIVE" },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        clients: {
          select: {
            id: true,
            name: true,
            dailyTarget: true,
            currentStage: true,
            applications: {
              where: {
                applicationDate: { gte: startOfToday, lte: endOfToday },
              },
              select: { id: true, applicationDate: true, proofImageUrl: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    let globalTargetsCompletedToday = 0;

    const staffPerformance = activeStaffMembers.map((s) => {
      let appliedToday = 0;
      let totalDailyTarget = 0;
      let targetsCompleted = 0;

      s.clients.forEach((c) => {
        const count = c.applications.length;
        appliedToday += count;
        const target = c.dailyTarget || 20;
        totalDailyTarget += target;
        if (count >= target) {
          targetsCompleted += 1;
        }
      });

      globalTargetsCompletedToday += targetsCompleted;

      const completionRate =
        totalDailyTarget > 0
          ? Math.min(100, Math.round((appliedToday / totalDailyTarget) * 100))
          : 0;

      return {
        id: s.id,
        name: s.name,
        role: s.role,
        email: s.email,
        assignedCxCount: s.clients.length,
        appliedToday,
        totalDailyTarget,
        targetsCompleted,
        completionRate,
      };
    });

    // 8. CX Workspace List (Assigned Staff, Today's Progress, Last App Time)
    const cxWorkspaceList = await Promise.all(
      allClients.map(async (client) => {
        const todayApps = await prisma.application.findMany({
          where: {
            clientId: client.id,
            applicationDate: { gte: startOfToday, lte: endOfToday },
          },
          orderBy: { applicationDate: "desc" },
          select: { id: true, applicationDate: true, proofImageUrl: true },
        });

        const yesterdayAppsCount = await prisma.application.count({
          where: {
            clientId: client.id,
            applicationDate: { gte: startOfYesterday, lte: endOfYesterday },
          },
        });

        const target = client.dailyTarget || 20;
        const count = todayApps.length;
        const status =
          count >= target
            ? "TARGET_DONE"
            : count > 0
            ? "IN_PROGRESS"
            : "NOT_STARTED";
        const lastAppTime = todayApps[0]?.applicationDate || null;
        const missedYesterday = yesterdayAppsCount < target;

        return {
          id: client.id,
          name: client.name,
          email: client.email,
          targetRole: client.targetRole,
          staffName: client.staff?.name || "Unassigned",
          staffId: client.staff?.id || null,
          dailyTarget: target,
          appliedToday: count,
          progressPercent: Math.min(100, Math.round((count / target) * 100)),
          status,
          lastAppTime,
          latestProofUrl: todayApps[0]?.proofImageUrl || null,
          missedYesterday,
        };
      })
    );

    const targetsMissedYesterdayCount = cxWorkspaceList.filter(
      (c) => c.missedYesterday && c.staffName !== "Unassigned"
    ).length;

    // 9. Recent Applications Feed with Proof URLs
    const recentApplicationsFeed = await prisma.application.findMany({
      take: 10,
      orderBy: { applicationDate: "desc" },
      select: {
        id: true,
        companyName: true,
        jobTitle: true,
        portal: true,
        status: true,
        proofImageUrl: true,
        applicationDate: true,
        jobPostingUrl: true,
        notes: true,
        client: {
          select: {
            id: true,
            name: true,
            staff: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // 10. Cut-off time alerts (4 PM / 16:00 IST)
    const istHour = istNow.getUTCHours();
    const isPastCutoff = istHour >= 16;
    const cutOffAlerts = isPastCutoff
      ? cxWorkspaceList.filter(
          (c) => c.appliedToday === 0 && c.staffName !== "Unassigned"
        )
      : [];

    // Time of day greeting
    const hour = now.getHours();
    let greeting = "Good morning, team";
    if (hour >= 12 && hour < 17) {
      greeting = "Good afternoon, team";
    } else if (hour >= 17) {
      greeting = "Good evening, team";
    }

    return NextResponse.json({
      greeting,
      summary: {
        wholeCxCount,
        paidCount: paidClientsList.length,
        ongoingJobsCount: ongoingJobsClientsList.length,
        assessmentCount: totalAssessmentsCount,
        interviewCount: interviewsSecuredCount,
        closureCount: closureClientsList.length,
        activeClients: activeClientsCount,
        activeStaffCount: activeStaffMembers.length,
        applicationsToday: applicationsTodayCount,
        targetsCompletedToday: globalTargetsCompletedToday,
        targetsMissedYesterday: targetsMissedYesterdayCount,
        interviewsSecured: interviewsSecuredCount,
        renewalsDue: renewalsDueCount,
      },
      cxAnalysis,
      pipeline,
      stageOrder: STAGE_LIST,
      todayProgress,
      recruiterInbox,
      staffPerformance,
      cxWorkspaceList,
      recentApplicationsFeed,
      cutOffAlerts,
      isPastCutoff,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data", details: error.message },
      { status: 500 }
    );
  }
}
