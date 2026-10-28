import { NextResponse } from "next/server";
import { z } from "zod";
import {
  signAdminToken,
  ADMIN_SECRET_CODE,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth-helpers";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const adminLoginSchema = z.object({
  secretCode: z.string().min(1, "Secret code is required"),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitCheck = rateLimit(`admin-login:${ip}`, 5, 5 * 60 * 1000);
    if (!limitCheck.success) {
      return createRateLimitResponse(limitCheck.reset);
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = adminLoginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Secret code is required to access the Admin CRM." },
        { status: 400 }
      );
    }

    const { secretCode } = parseResult.data;

    // Verify secret code (case-insensitive trim)
    if (secretCode.trim().toUpperCase() !== ADMIN_SECRET_CODE.toUpperCase()) {
      return NextResponse.json(
        { error: "Invalid secret code. Please enter the authorized Admin passkey." },
        { status: 401 }
      );
    }

    const token = signAdminToken({
      role: "ADMIN",
      email: "admin@jobassist.com",
      name: "Administrator",
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
