import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  signSessionToken,
  logPortalAccess,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, token } = body;

    let client = null;

    if (token && typeof token === "string" && token.trim()) {
      client = await prisma.client.findFirst({
        where: {
          portalToken: token.trim(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          targetRole: true,
          portalEnabled: true,
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Invalid portal link or token. Please request a new link from your specialist." },
          { status: 401 }
        );
      }

      if (!client.portalEnabled) {
        return NextResponse.json(
          { error: "Candidate portal access is currently disabled for your account. Please contact your Career Specialist." },
          { status: 403 }
        );
      }

      await logPortalAccess(client.id, "LOGIN_TOKEN");
    } else if (email && typeof email === "string" && email.trim()) {
      client = await prisma.client.findFirst({
        where: {
          email: email.trim().toLowerCase(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          targetRole: true,
          portalEnabled: true,
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: "No candidate found with this email address. Please verify your registered email." },
          { status: 401 }
        );
      }

      if (!client.portalEnabled) {
        return NextResponse.json(
          { error: "Candidate portal access is currently disabled for your account. Please contact your Career Specialist." },
          { status: 403 }
        );
      }

      await logPortalAccess(client.id, "LOGIN_EMAIL");
    } else {
      return NextResponse.json(
        { error: "Please provide either your registered email address or access token." },
        { status: 400 }
      );
    }

    // Create session token
    const sessionToken = signSessionToken({
      clientId: client.id,
      role: "CANDIDATE",
      email: client.email,
      name: client.name,
    });

    const response = NextResponse.json({
      success: true,
      candidate: {
        id: client.id,
        name: client.name,
        email: client.email,
        targetRole: client.targetRole,
      },
    });

    // Set HTTP-only secure cookie
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
    console.error("Portal login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
