import { NextResponse } from "next/server";
import {
  signAdminToken,
  ADMIN_SECRET_CODE,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { secretCode } = body;

    if (!secretCode || typeof secretCode !== "string") {
      return NextResponse.json(
        { error: "Secret code is required to access the Admin CRM." },
        { status: 400 }
      );
    }

    // Verify secret code (case-insensitive trim)
    if (secretCode.trim().toUpperCase() !== ADMIN_SECRET_CODE.toUpperCase()) {
      return NextResponse.json(
        { error: "Invalid secret code. Please enter the authorized Admin passkey." },
        { status: 401 }
      );
    }

    const token = signAdminToken();
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
