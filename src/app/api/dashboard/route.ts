import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STAGE_LIST, StageKey } from "@/lib/types";

export async function GET() {
  try {
    const now = new Date();
    // Today boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 7 days from now for renewals due
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Active Clients (stage is not RENEWED_CLOSED)
    const activeClientsCount = await prisma.client.count({
      where: {
        currentStage: {
          not: "RENEWED_CLOSED",
        },
      },
    });

    // 2. Applications Today
    const applicationsTodayCount = await prisma.application.count({
      where: {
        applicationDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 3. Interviews Secured
    const interviewsSecuredCount = await prisma.interview.count({
      where: {
        status: {
          in: ["SCHEDULED", "COMPLETED"],
        },
      },
    });

    // 4. Renewals Due: clients whose planEndDate is within 7 days from now or already past due within 7 days
    const renewalsDueCount = await prisma.client.count({
      where: {
        planEndDate: {
          lte: sevenDaysFromNow,
        },
        currentStage: {
          not: "RENEWED_CLOSED",
        },
      },
    });

    // 5. Client Pipeline
    const allClients = await prisma.client.findMany({
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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

    // 6. Today's Application Progress
    // Clients who have applications in progress, follow up, portal setup, report, etc.
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

    // 7. Recruiter Inbox
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
        activeClients: activeClientsCount,
        applicationsToday: applicationsTodayCount,
        interviewsSecured: interviewsSecuredCount,
        renewalsDue: renewalsDueCount,
      },
      pipeline,
      stageOrder: STAGE_LIST,
      todayProgress,
      recruiterInbox,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data", details: error.message },
      { status: 500 }
    );
  }
}
