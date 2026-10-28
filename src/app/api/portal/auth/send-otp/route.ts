import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/auth-helpers";
import { logPortalAccess } from "@/lib/portal-auth";
import { sendOtpEmail } from "@/lib/email";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const sendOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  reason: z.string().optional().default("FORGOT_PASSWORD"),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitCheck = rateLimit(`send-otp:${ip}`, 4, 10 * 60 * 1000);
    if (!limitCheck.success) {
      return createRateLimitResponse(limitCheck.reset);
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = sendOtpSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const { email, reason } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();

    const client = await prisma.client.findFirst({
      where: { email: cleanEmail },
      select: {
        id: true,
        name: true,
        email: true,
        portalEnabled: true,
        registrationStatus: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Candidate account not found." }, { status: 404 });
    }

    if (!client.portalEnabled || client.registrationStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Account is disabled or pending Admin approval." },
        { status: 403 }
      );
    }

    // Generate cryptographic 6-digit OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.client.update({
      where: { id: client.id },
      data: {
        otpCode: otp,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
      },
    });

    await logPortalAccess(client.id, `SENT_OTP_${reason}`);

    // Dispatch real-time OTP email
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      candidateName: client.name,
      otp,
      reason,
    });

    const exposeDebug =
      process.env.NODE_ENV !== "production" &&
      process.env.EXPOSE_DEBUG_OTP === "true";

    return NextResponse.json({
      success: true,
      emailDelivered: emailResult.success,
      message: emailResult.success
        ? `A 6-digit verification code has been dispatched directly to ${cleanEmail}.`
        : `A 6-digit code has been generated for ${cleanEmail}.`,
      ...(exposeDebug ? { debugOtp: otp } : {}),
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP." }, { status: 500 });
  }
}
