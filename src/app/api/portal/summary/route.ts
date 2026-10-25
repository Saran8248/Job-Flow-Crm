import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCandidateAuth, logPortalAccess } from "@/lib/portal-auth";
import { STAGE_LIST, STAGES, StageKey } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireCandidateAuth();
    if (auth.error || !auth.client) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const clientId = auth.client.id;

    // Log view action
    await logPortalAccess(clientId, "VIEW_SUMMARY");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Fetch client with safe relations using explicit whitelist
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        targetRole: true,
        preferredLocation: true,
        experienceLevel: true,
        skills: true,
        currentStage: true,
        dailyTarget: true,
        planDurationMonths: true,
        planStartDate: true,
        planEndDate: true,
        totalFee: true,
        amountPaid: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
        stageHistory: {
          select: {
            id: true,
            previousStage: true,
            newStage: true,
            clientNote: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // 1. Headline Counters
    const totalApplied = await prisma.application.count({
      where: {
        clientId,
        visibleToClient: true,
      },
    });

    const appliedToday = await prisma.application.count({
      where: {
        clientId,
        visibleToClient: true,
        applicationDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const assessmentCount = await prisma.application.count({
      where: {
        clientId,
        visibleToClient: true,
        status: "ASSESSMENT",
      },
    });

    const interviewsCount = await prisma.interview.count({
      where: {
        clientId,
        status: {
          in: ["SCHEDULED", "COMPLETED"],
        },
      },
    });

    const offersCount = await prisma.application.count({
      where: {
        clientId,
        visibleToClient: true,
        status: "OFFER",
      },
    });

    // 2. Application Funnel
    // Applied -> Replied -> Assessment -> Interview -> Offer
    const repliedCount = await prisma.application.count({
      where: {
        clientId,
        visibleToClient: true,
        status: {
          in: ["ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED", "REPLIED", "SHORTLISTED"],
        },
      },
    });

    const funnel = {
      applied: totalApplied,
      replied: repliedCount,
      assessment: assessmentCount,
      interview: interviewsCount,
      offer: offersCount,
    };

    // 3. 9-Stage Progress Tracker with dates
    const currentStageIndex = STAGE_LIST.indexOf(client.currentStage as StageKey);

    const stagesTracker = STAGE_LIST.map((key, index) => {
      const config = STAGES[key];
      const historyEntry = client.stageHistory.find((h) => h.newStage === key);
      const isCompleted = index <= currentStageIndex;
      const isCurrent = key === client.currentStage;

      return {
        key,
        label: config.label,
        isCompleted,
        isCurrent,
        reachedDate: historyEntry ? historyEntry.createdAt : isCompleted ? client.createdAt : null,
        clientNote: historyEntry?.clientNote || null,
      };
    });

    // 4. Upcoming Interview preview
    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        clientId,
        scheduledAt: { gte: now },
      },
      select: {
        id: true,
        companyName: true,
        round: true,
        scheduledAt: true,
        status: true,
        meetingLink: true,
      },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    });

    // 5. Recent application updates
    const recentApplications = await prisma.application.findMany({
      where: { clientId, visibleToClient: true },
      select: {
        id: true,
        companyName: true,
        jobTitle: true,
        jobLocation: true,
        portal: true,
        status: true,
        applicationDate: true,
        jobPostingUrl: true,
      },
      orderBy: { applicationDate: "desc" },
      take: 5,
    });

    // 6. Plan validity calculations
    const planEndDate = new Date(client.planEndDate);
    const msRemaining = planEndDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      candidate: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        targetRole: client.targetRole,
        preferredLocation: client.preferredLocation,
        experienceLevel: client.experienceLevel,
        skills: client.skills,
        currentStage: client.currentStage,
        dailyTarget: client.dailyTarget,
      },
      specialist: client.staff
        ? {
            name: client.staff.name,
            role: client.staff.role,
            email: client.staff.email,
          }
        : null,
      counters: {
        totalApplied,
        appliedToday,
        dailyTarget: client.dailyTarget,
        assessments: assessmentCount,
        interviews: interviewsCount,
        offers: offersCount,
      },
      funnel,
      stagesTracker,
      upcomingInterviews,
      recentApplications,
      plan: {
        planDurationMonths: client.planDurationMonths,
        planStartDate: client.planStartDate,
        planEndDate: client.planEndDate,
        daysRemaining,
        totalFee: client.totalFee,
        amountPaid: client.amountPaid,
        balance: client.balance,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Portal summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching candidate summary" },
      { status: 500 }
    );
  }
}
