import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out from Admin CRM" });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
