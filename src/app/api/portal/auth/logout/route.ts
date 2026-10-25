import { NextResponse } from "next/server";
import {
  getCandidateSession,
  logPortalAccess,
  SESSION_COOKIE_NAME,
} from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getCandidateSession();
    if (session) {
      await logPortalAccess(session.clientId, "LOGOUT");
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
