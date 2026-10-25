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
    const { email, otpCode, newPassword } = body;

    if (!email || !otpCode || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP code, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
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
        { error: "Invalid OTP code. Please check the code sent to your email." },
        { status: 400 }
      );
    }

    if (client.otpExpiresAt && new Date(client.otpExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Update password
    const hashed = hashPassword(newPassword);

    await prisma.client.update({
      where: { id: client.id },
      data: {
        passwordHash: hashed,
        isFirstLogin: false,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    await logPortalAccess(client.id, "PASSWORD_RESET_SUCCESS");

    // Sign session
    const sessionToken = signSessionToken({
      clientId: client.id,
      role: "CANDIDATE",
      email: client.email,
      name: client.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Password reset successfully! Logged in to your portal.",
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
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
