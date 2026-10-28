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

const checkEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitCheck = rateLimit(`check-email:${ip}`, 6, 5 * 60 * 1000);
    if (!limitCheck.success) {
      return createRateLimitResponse(limitCheck.reset);
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = checkEmailSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Please enter your registered email address." },
        { status: 400 }
      );
    }

    const cleanEmail = parseResult.data.email.trim().toLowerCase();

    const client = await prisma.client.findFirst({
      where: { email: cleanEmail },
      select: {
        id: true,
        name: true,
        email: true,
        portalEnabled: true,
        registrationStatus: true,
        isFirstLogin: true,
        passwordHash: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "No candidate account found with this email. Please contact your Career Specialist." },
        { status: 404 }
      );
    }

    // Check if accepted/approved by Admin
    if (!client.portalEnabled || client.registrationStatus !== "APPROVED") {
      return NextResponse.json(
        {
          error: "Your candidate account has not been approved by the Admin yet. Please wait for authorization or contact the administrator.",
          isApproved: false,
        },
        { status: 403 }
      );
    }

    const isFirstTime = client.isFirstLogin || !client.passwordHash;

    if (isFirstTime) {
      // Generate 6-digit cryptographic OTP (crypto.randomInt)
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await prisma.client.update({
        where: { id: client.id },
        data: {
          otpCode: otp,
          otpExpiresAt: expiresAt,
          otpAttempts: 0, // Reset attempt counter
        },
      });

      await logPortalAccess(client.id, "SENT_FIRST_LOGIN_OTP");

      // Dispatch real-time OTP email
      const emailResult = await sendOtpEmail({
        to: cleanEmail,
        candidateName: client.name,
        otp,
        reason: "FIRST_LOGIN",
      });

      // ONLY expose debugOtp in non-production local development if explicitly enabled
      const exposeDebug =
        process.env.NODE_ENV !== "production" &&
        process.env.EXPOSE_DEBUG_OTP === "true";

      return NextResponse.json({
        success: true,
        isFirstLogin: true,
        candidateName: client.name,
        emailDelivered: emailResult.success,
        message: emailResult.success
          ? `A 6-digit verification OTP has been sent directly to your email (${cleanEmail}).`
          : `A 6-digit verification OTP has been generated for ${cleanEmail}.`,
        ...(exposeDebug ? { debugOtp: otp } : {}),
      });
    }

    // Returning candidate -> proceed to password verification
    return NextResponse.json({
      success: true,
      isFirstLogin: false,
      candidateName: client.name,
      message: "Please enter your candidate password.",
    });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
