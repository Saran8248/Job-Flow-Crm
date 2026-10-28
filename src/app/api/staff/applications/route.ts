import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const dateParam = searchParams.get("date"); // "today", "all", or "YYYY-MM-DD"

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    let dateFilter: any = {};
    const istOffsetMs = 5.5 * 60 * 60 * 1000;

    if (dateParam === "all") {
      dateFilter = {};
    } else if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const [y, m, d] = dateParam.split("-").map(Number);
      const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - istOffsetMs);
      const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - istOffsetMs);
      dateFilter = {
        applicationDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    } else {
      // Default: today in IST
      const now = new Date();
      const istNow = new Date(now.getTime() + istOffsetMs);
      const todayStartIST = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const todayStart = new Date(todayStartIST.getTime() - istOffsetMs);
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      dateFilter = {
        applicationDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      };
    }

    const applications = await prisma.application.findMany({
      where: {
        clientId,
        ...dateFilter,
      },
      orderBy: { applicationDate: "desc" },
      select: {
        id: true,
        clientId: true,
        jobTitle: true,
        companyName: true,
        jobPostingUrl: true,
        portal: true,
        status: true,
        proofImageUrl: true,
        notes: true,
        applicationDate: true,
      },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error("Fetch staff applications error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      clientId,
      jobTitle,
      companyName,
      jobPostingUrl,
      portal,
      notes,
      proofImageUrl,
      allowDuplicate = false,
    } = body;

    // 1. Validation
    if (!clientId || !jobTitle?.trim() || !companyName?.trim()) {
      return NextResponse.json(
        { error: "Client ID, Job Role, and Company Name are required." },
        { status: 400 }
      );
    }

    // 2. Mandatory Screenshot Proof Validation
    if (!proofImageUrl || typeof proofImageUrl !== "string" || !proofImageUrl.trim()) {
      return NextResponse.json(
        { error: "Mandatory proof screenshot is missing. Please upload proof of application." },
        { status: 400 }
      );
    }

    // Verify candidate exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, dailyTarget: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    // Calculate today's IST range
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);
    const todayStartIST = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0));
    const todayStart = new Date(todayStartIST.getTime() - istOffsetMs);

    // 3. Duplicate Application Warning Check
    if (!allowDuplicate) {
      const existingToday = await prisma.application.findFirst({
        where: {
          clientId,
          applicationDate: { gte: todayStart },
          companyName: { equals: companyName.trim() },
          jobTitle: { equals: jobTitle.trim() },
        },
      });

      if (existingToday) {
        return NextResponse.json(
          {
            isDuplicate: true,
            error: `An application for "${jobTitle.trim()}" at "${companyName.trim()}" was already logged today for ${client.name}.`,
          },
          { status: 409 }
        );
      }
    }

    // 4. Create the application entry
    const newApplication = await prisma.application.create({
      data: {
        clientId,
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        jobPostingUrl: jobPostingUrl?.trim() || null,
        portal: portal || "LinkedIn",
        status: "APPLIED",
        notes: notes?.trim() || null,
        proofImageUrl: proofImageUrl.trim(),
        visibleToClient: true,
      },
    });

    // 5. Compute updated today count and check if target reached
    const appliedToday = await prisma.application.count({
      where: {
        clientId,
        applicationDate: { gte: todayStart },
      },
    });

    const dailyTarget = client.dailyTarget || 20;
    const targetReached = appliedToday >= dailyTarget;
    const targetJustMet = appliedToday === dailyTarget;

    return NextResponse.json({
      success: true,
      message: `Application for ${companyName.trim()} logged successfully!`,
      application: newApplication,
      appliedToday,
      dailyTarget,
      targetReached,
      targetJustMet,
    });
  } catch (error) {
    console.error("Log application error:", error);
    return NextResponse.json({ error: "Failed to log job application." }, { status: 500 });
  }
}
