import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCandidateAuth, logPortalAccess } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireCandidateAuth();
    if (auth.error || !auth.client) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const clientId = auth.client.id;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "ALL";
    const portal = searchParams.get("portal")?.trim() || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    await logPortalAccess(clientId, "VIEW_APPLICATIONS");

    // Build filter query scoped strictly to session's clientId
    const where: any = {
      clientId,
      visibleToClient: true,
    };

    if (status !== "ALL" && status !== "") {
      where.status = status;
    }

    if (portal !== "ALL" && portal !== "") {
      where.portal = portal;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { jobTitle: { contains: search } },
        { jobLocation: { contains: search } },
      ];
    }

    const [total, applications, statusCounts] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        select: {
          id: true,
          companyName: true,
          jobTitle: true,
          jobLocation: true,
          jobPostingUrl: true,
          applicationDate: true,
          status: true,
          portal: true,
          lastStatusAt: true,
          // Intentionally omitting internal staff notes and recruiter contact info
        },
        orderBy: { applicationDate: "desc" },
        skip,
        take: limit,
      }),
      // Aggregate summary counts for quick tab filters
      prisma.application.groupBy({
        by: ["status"],
        where: { clientId, visibleToClient: true },
        _count: { status: true },
      }),
    ]);

    const countsMap: Record<string, number> = {
      ALL: 0,
      APPLIED: 0,
      ASSESSMENT: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
    };

    statusCounts.forEach((sc) => {
      countsMap[sc.status] = sc._count.status;
      countsMap.ALL += sc._count.status;
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      counts: countsMap,
    });
  } catch (error) {
    console.error("Portal applications API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate applications" },
      { status: 500 }
    );
  }
}
