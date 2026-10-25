import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCandidateAuth, logPortalAccess } from "@/lib/portal-auth";
import { STAGES, StageKey } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireCandidateAuth();
    if (auth.error || !auth.client) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const clientId = auth.client.id;
    await logPortalAccess(clientId, "VIEW_TIMELINE");

    // 1. Stage transitions with client-safe notes
    const stageRecords = await prisma.clientStageHistory.findMany({
      where: { clientId },
      select: {
        id: true,
        previousStage: true,
        newStage: true,
        clientNote: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Interviews scheduled
    const interviewRecords = await prisma.interview.findMany({
      where: { clientId },
      select: {
        id: true,
        companyName: true,
        round: true,
        scheduledAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Significant milestones (Assessments & Offers)
    const milestoneApplications = await prisma.application.findMany({
      where: {
        clientId,
        visibleToClient: true,
        status: { in: ["ASSESSMENT", "OFFER", "INTERVIEW"] },
      },
      select: {
        id: true,
        companyName: true,
        jobTitle: true,
        status: true,
        applicationDate: true,
        lastStatusAt: true,
      },
      orderBy: { applicationDate: "desc" },
      take: 10,
    });

    // Consolidate into candidate-safe timeline events
    const timelineEvents: Array<{
      id: string;
      type: "STAGE_CHANGE" | "INTERVIEW_SCHEDULED" | "ASSESSMENT_RECEIVED" | "OFFER_RECEIVED";
      title: string;
      description: string;
      timestamp: Date;
      iconType: string;
      badge?: string;
    }> = [];

    stageRecords.forEach((s) => {
      const stageConfig = STAGES[s.newStage as StageKey] || { label: s.newStage };
      timelineEvents.push({
        id: `stage-${s.id}`,
        type: "STAGE_CHANGE",
        title: `Stage: ${stageConfig.label}`,
        description: s.clientNote || `Profile milestone updated to ${stageConfig.label}.`,
        timestamp: s.createdAt,
        iconType: "stage",
        badge: stageConfig.label,
      });
    });

    interviewRecords.forEach((iv) => {
      timelineEvents.push({
        id: `iv-${iv.id}`,
        type: "INTERVIEW_SCHEDULED",
        title: `Interview Scheduled: ${iv.companyName}`,
        description: `${iv.round} scheduled for ${new Date(iv.scheduledAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })}.`,
        timestamp: iv.createdAt,
        iconType: "interview",
        badge: iv.round,
      });
    });

    milestoneApplications.forEach((app) => {
      if (app.status === "OFFER") {
        timelineEvents.push({
          id: `app-offer-${app.id}`,
          type: "OFFER_RECEIVED",
          title: `Job Offer: ${app.companyName}`,
          description: `Offer received for ${app.jobTitle}!`,
          timestamp: app.lastStatusAt || app.applicationDate,
          iconType: "offer",
          badge: "OFFER",
        });
      } else if (app.status === "ASSESSMENT") {
        timelineEvents.push({
          id: `app-assess-${app.id}`,
          type: "ASSESSMENT_RECEIVED",
          title: `Assessment Requested: ${app.companyName}`,
          description: `Technical test/evaluation requested for ${app.jobTitle}.`,
          timestamp: app.lastStatusAt || app.applicationDate,
          iconType: "assessment",
          badge: "ASSESSMENT",
        });
      }
    });

    // Sort all events chronologically descending
    timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ events: timelineEvents });
  } catch (error) {
    console.error("Portal timeline API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate timeline" },
      { status: 500 }
    );
  }
}
