import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-helpers";
import {
  signSessionToken,
  logPortalAccess,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, otpCode, password } = body;

    if (!email || !otpCode || !password) {
      return NextResponse.json(
        { error: "Email, OTP code, and password are all required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const client = await prisma.client.findFirst({
      where: { email: cleanEmail },
      select: {
        id: true,
        name: true,
        email: true,
        targetRole: true,
        otpCode: true,
        otpExpiresAt: true,
        portalEnabled: true,
        registrationStatus: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    if (!client.portalEnabled || client.registrationStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Your portal access is disabled or pending Admin approval." },
        { status: 403 }
      );
    }

    // Verify OTP
    if (!client.otpCode || client.otpCode.trim() !== otpCode.trim()) {
      return NextResponse.json(
        { error: "Invalid OTP code. Please check the 6-digit code sent to your email." },
        { status: 400 }
      );
    }

    if (client.otpExpiresAt && new Date(client.otpExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new verification code." },
        { status: 400 }
      );
    }

    // Hash password & mark first-time login complete
    const hashed = hashPassword(password);

    await prisma.client.update({
      where: { id: client.id },
      data: {
        passwordHash: hashed,
        isFirstLogin: false,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    await logPortalAccess(client.id, "FIRST_TIME_PASSWORD_SET");

    // Sign session token & log in
    const sessionToken = signSessionToken({
      clientId: client.id,
      role: "CANDIDATE",
      email: client.email,
      name: client.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Password set successfully! Welcome to your candidate portal.",
      candidate: {
        id: client.id,
        name: client.name,
        email: client.email,
        targetRole: client.targetRole,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("First-time setup error:", error);
    return NextResponse.json(
      { error: "Failed to complete first-time verification." },
      { status: 500 }
    );
  }
}
