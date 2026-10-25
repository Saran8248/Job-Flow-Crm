import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCandidateAuth, logPortalAccess } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireCandidateAuth();
    if (auth.error || !auth.client) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const clientId = auth.client.id;
    await logPortalAccess(clientId, "VIEW_INTERVIEWS");

    const now = new Date();

    // 1. Fetch Interviews
    const interviews = await prisma.interview.findMany({
      where: { clientId },
      select: {
        id: true,
        companyName: true,
        round: true,
        scheduledAt: true,
        status: true,
        meetingLink: true,
        createdAt: true,
        application: {
          select: {
            id: true,
            jobTitle: true,
            jobLocation: true,
            portal: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // 2. Fetch Assessments (from applications with status ASSESSMENT)
    const assessments = await prisma.application.findMany({
      where: {
        clientId,
        visibleToClient: true,
        status: "ASSESSMENT",
      },
      select: {
        id: true,
        companyName: true,
        jobTitle: true,
        jobPostingUrl: true,
        portal: true,
        applicationDate: true,
        lastStatusAt: true,
      },
      orderBy: { applicationDate: "desc" },
    });

    const upcoming = interviews.filter((i) => new Date(i.scheduledAt) >= now);
    const past = interviews.filter((i) => new Date(i.scheduledAt) < now);

    return NextResponse.json({
      upcoming,
      past,
      assessments,
      totalInterviews: interviews.length,
      upcomingCount: upcoming.length,
      assessmentsCount: assessments.length,
    });
  } catch (error) {
    console.error("Portal interviews API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}
