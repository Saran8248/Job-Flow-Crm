import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  signAdminToken,
  verifyPassword,
  STAFF_SECRET_CODE,
  ADMIN_SECRET_CODE,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth-helpers";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const staffLoginSchema = z.object({
  email: z.string().optional(),
  passcode: z.string().optional(),
  password: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitCheck = rateLimit(`staff-login:${ip}`, 8, 5 * 60 * 1000);
    if (!limitCheck.success) {
      return createRateLimitResponse(limitCheck.reset);
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = staffLoginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid login credentials format." }, { status: 400 });
    }

    const { email, passcode, password } = parseResult.data;
    const staffEmail = (email || "").trim().toLowerCase();
    const providedCode = (passcode || "").trim();
    const providedPassword = (password || "").trim();

    let staff = null;
    if (staffEmail) {
      staff = await prisma.staff.findFirst({
        where: { email: { equals: staffEmail } },
      });

      if (staff && staff.accountStatus !== "ACTIVE") {
        return NextResponse.json(
          { error: "Staff account is suspended or inactive. Please contact administration." },
          { status: 403 }
        );
      }
    }

    // Authenticate: either by personal staff password or by authorized passcode
    let isAuthorized = false;

    if (staff && staff.passwordHash && providedPassword) {
      isAuthorized = verifyPassword(providedPassword, staff.passwordHash);
    } else if (providedCode) {
      isAuthorized =
        providedCode.toUpperCase() === STAFF_SECRET_CODE.toUpperCase() ||
        providedCode.toUpperCase() === ADMIN_SECRET_CODE.toUpperCase();
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Invalid credentials or staff access code. Please verify and try again.",
        },
        { status: 401 }
      );
    }

    // Update lastLoginAt if staff found
    if (staff) {
      await prisma.staff.update({
        where: { id: staff.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => null);
    }

    const token = signAdminToken({
      role: "STAFF",
      email: staff?.email || staffEmail || "staff@jobassist.internal",
      name: staff?.name || "Staff Member",
      staffId: staff?.id,
    });

    const response = NextResponse.json({
      success: true,
      message: `Staff authentication successful${
        staff?.name ? ` — Welcome ${staff.name}` : ""
      }`,
      staff: staff
        ? { id: staff.id, name: staff.name, email: staff.email, role: staff.role }
        : { name: "Staff Member", email: staffEmail || "staff@jobassist.internal", role: "Staff" },
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
    console.error("Staff login error:", error);
    return NextResponse.json(
      { error: "Staff authentication failed" },
      { status: 500 }
    );
  }
}
