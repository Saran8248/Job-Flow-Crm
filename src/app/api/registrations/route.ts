import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        targetRole: true,
        portalEnabled: true,
        portalToken: true,
        registrationStatus: true,
        isFirstLogin: true,
        passwordHash: true,
        currentStage: true,
        dailyTarget: true,
        createdAt: true,
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = clients.map((c) => ({
      ...c,
      hasPassword: Boolean(c.passwordHash),
      passwordHash: undefined, // never expose hash
    }));

    return NextResponse.json({ candidates: formatted });
  } catch (error) {
    console.error("GET /api/registrations error:", error);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      name,
      email,
      phone,
      targetRole,
      assignedStaffId,
      password,
      portalEnabled = true,
      registrationStatus = "APPROVED",
      dailyTarget = 60,
    } = body;

    if (!name || !email || !targetRole) {
      return NextResponse.json(
        { error: "Name, email, and target role are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await prisma.client.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json(
        { error: `A candidate with email ${cleanEmail} is already registered.` },
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const portalToken = `cx-${slug}-${Math.random().toString(36).substring(2, 7)}`;

    let passwordHash = null;
    let isFirstLogin = true;

    if (password && typeof password === "string" && password.trim().length >= 6) {
      passwordHash = hashPassword(password.trim());
      isFirstLogin = false; // password already assigned by admin
    }

    const now = new Date();
    const planEndDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months default

    const newCandidate = await prisma.client.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone?.trim() || null,
        targetRole: targetRole.trim(),
        assignedStaffId: assignedStaffId || null,
        portalEnabled: Boolean(portalEnabled),
        registrationStatus: registrationStatus || "APPROVED",
        portalToken,
        passwordHash,
        isFirstLogin,
        dailyTarget: Number(dailyTarget) || 60,
        planStartDate: now,
        planEndDate,
      },
      include: {
        staff: true,
      },
    });

    // Create initial stage history
    await prisma.clientStageHistory.create({
      data: {
        clientId: newCandidate.id,
        previousStage: "CONFIRMED",
        newStage: "CONFIRMED",
        changedBy: "Admin Registration",
        notes: "Candidate registered via Admin portal",
        clientNote: "Welcome! Your account has been approved and configured by Admin.",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "REGISTER_CANDIDATE",
        entityType: "CLIENT",
        entityId: newCandidate.id,
        details: `Registered candidate ${newCandidate.name} (${newCandidate.email}) with portal access: ${portalEnabled}`,
        performedBy: "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Candidate registered and access configured successfully",
      candidate: {
        ...newCandidate,
        hasPassword: Boolean(newCandidate.passwordHash),
        passwordHash: undefined,
      },
    });
  } catch (error: any) {
    console.error("POST /api/registrations error:", error);
    return NextResponse.json(
      { error: "Failed to register candidate", details: error.message },
      { status: 500 }
    );
  }
}
