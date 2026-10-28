import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-helpers";
import {
  signSessionToken,
  logPortalAccess,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/portal-auth";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const verifyFirstLoginSchema = z.object({
  email: z.string().email("Valid email required"),
  otpCode: z.string().min(6).max(6, "OTP must be exactly 6 digits"),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitCheck = rateLimit(`verify-first-login:${ip}`, 6, 5 * 60 * 1000);
    if (!limitCheck.success) {
      return createRateLimitResponse(limitCheck.reset);
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = verifyFirstLoginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Email, 6-digit OTP code, and password are all required." },
        { status: 400 }
      );
    }

    const { email, otpCode, password } = parseResult.data;
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
        otpAttempts: true,
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

    // Check expiration
    if (client.otpExpiresAt && new Date(client.otpExpiresAt) < new Date()) {
      await prisma.client.update({
        where: { id: client.id },
        data: { otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
      });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new verification code." },
        { status: 400 }
      );
    }

    // Verify OTP code
    if (!client.otpCode || client.otpCode.trim() !== otpCode.trim()) {
      const currentAttempts = (client.otpAttempts || 0) + 1;
      const isLocked = currentAttempts >= 5;

      await prisma.client.update({
        where: { id: client.id },
        data: {
          otpAttempts: currentAttempts,
          ...(isLocked ? { otpCode: null, otpExpiresAt: null } : {}),
        },
      });

      if (isLocked) {
        return NextResponse.json(
          { error: "Maximum OTP attempts exceeded. Please request a new verification code." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Invalid OTP code. Please check the 6-digit code sent to your email (${5 - currentAttempts} attempts remaining).` },
        { status: 400 }
      );
    }

    // Hash password with cryptographically secure scrypt & mark first-time login complete
    const hashed = hashPassword(password);

    await prisma.client.update({
      where: { id: client.id },
      data: {
        passwordHash: hashed,
        isFirstLogin: false,
        otpCode: null,
        otpExpiresAt: null,
        otpAttempts: 0,
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
