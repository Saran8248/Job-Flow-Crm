import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-helpers";
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

const loginPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitCheck = rateLimit(`candidate-login:${ip}`, 6, 5 * 60 * 1000);
    if (!limitCheck.success) {
      return createRateLimitResponse(limitCheck.reset);
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = loginPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();

    const client = await prisma.client.findFirst({
      where: { email: cleanEmail },
      select: {
        id: true,
        name: true,
        email: true,
        targetRole: true,
        passwordHash: true,
        portalEnabled: true,
        registrationStatus: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    if (!client.portalEnabled || client.registrationStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Your portal access is disabled or pending Admin approval." },
        { status: 403 }
      );
    }

    if (!client.passwordHash) {
      return NextResponse.json(
        { error: "Password not set yet. Please verify your email via OTP first." },
        { status: 400 }
      );
    }

    const isValid = verifyPassword(password, client.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password. If you forgot your password, please use 'Forgot password'." },
        { status: 401 }
      );
    }

    // Success -> sign session
    const sessionToken = signSessionToken({
      clientId: client.id,
      role: "CANDIDATE",
      email: client.email,
      name: client.name,
    });

    await logPortalAccess(client.id, "LOGIN_PASSWORD");

    const response = NextResponse.json({
      success: true,
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
    console.error("Login password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
