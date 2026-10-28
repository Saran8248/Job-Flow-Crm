import { NextResponse } from "next/server";
import { getAdminSessionPayload } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getAdminSessionPayload();
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      role: payload.role,
      name: payload.name || (payload.role === "ADMIN" ? "Administrator" : "Staff Member"),
      email: payload.email,
      staffId: payload.staffId,
    });
  } catch (error) {
    console.error("Auth session check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
