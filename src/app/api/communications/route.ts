import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const communications = await prisma.recruiterCommunication.findMany({
      orderBy: { receivedAt: "desc" },
      include: {
        client: {
          select: { id: true, name: true, targetRole: true },
        },
      },
    });
    return NextResponse.json({ communications });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch communications", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recruiterOrCompany,
      subject,
      preview,
      type = "ACKNOWLEDGED",
      clientId,
    } = body;

    if (!recruiterOrCompany || !subject) {
      return NextResponse.json(
        { error: "Recruiter/Company and Subject are required" },
        { status: 400 }
      );
    }

    const communication = await prisma.recruiterCommunication.create({
      data: {
        recruiterOrCompany,
        subject,
        preview: preview || subject,
        type,
        clientId: clientId || null,
        status: "UNREAD",
      },
    });

    return NextResponse.json({ communication }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create recruiter communication", details: error.message },
      { status: 500 }
    );
  }
}
