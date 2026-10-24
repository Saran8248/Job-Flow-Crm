import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const interviews = await prisma.interview.findMany({
      where: { clientId: id },
      orderBy: { scheduledAt: "asc" },
      include: { application: true },
    });
    return NextResponse.json({ interviews });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch interviews", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      companyName,
      round = "Round 1",
      scheduledAt,
      meetingLink,
      notes,
      applicationId,
    } = body;

    if (!companyName || !scheduledAt) {
      return NextResponse.json(
        { error: "Company name and scheduled date/time are required" },
        { status: 400 }
      );
    }

    const interview = await prisma.interview.create({
      data: {
        clientId: id,
        applicationId: applicationId || null,
        companyName,
        round,
        scheduledAt: new Date(scheduledAt),
        meetingLink: meetingLink || null,
        notes: notes || null,
        status: "SCHEDULED",
      },
    });

    const client = await prisma.client.findUnique({ where: { id } });

    await prisma.notification.create({
      data: {
        title: "Interview Scheduled",
        message: `${client?.name || "Client"} has a ${round} interview with ${companyName}.`,
        type: "SUCCESS",
      },
    });

    return NextResponse.json({ interview }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to schedule interview", details: error.message },
      { status: 500 }
    );
  }
}
