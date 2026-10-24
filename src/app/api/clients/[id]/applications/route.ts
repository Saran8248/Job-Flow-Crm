import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const applications = await prisma.application.findMany({
      where: { clientId: id },
      orderBy: { applicationDate: "desc" },
      include: {
        interviews: true,
      },
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch applications", details: error.message },
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
      jobTitle,
      jobLocation,
      jobPostingUrl,
      status = "APPLIED",
      recruiterContact,
      notes,
      applicationDate,
    } = body;

    if (!companyName || !jobTitle) {
      return NextResponse.json(
        { error: "Company name and job title are required" },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        clientId: id,
        companyName,
        jobTitle,
        jobLocation: jobLocation || null,
        jobPostingUrl: jobPostingUrl || null,
        status,
        recruiterContact: recruiterContact || null,
        notes: notes || null,
        applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "ADD_APPLICATION",
        entityType: "APPLICATION",
        entityId: application.id,
        details: `Submitted application for ${companyName} (${jobTitle})`,
        performedBy: "Staff Member",
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to record application", details: error.message },
      { status: 500 }
    );
  }
}
