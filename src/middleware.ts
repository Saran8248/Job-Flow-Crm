import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const cxSessionCookie = request.cookies.get("cx_session")?.value;
  const staffSessionCookie = request.cookies.get("staff_session")?.value;

  // Static files and internal Next.js assets are ignored
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1. Candidate Portal Login & Auth routes
  if (pathname === "/portal/login") {
    // If already logged in as candidate, redirect straight to portal
    if (cxSessionCookie) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/portal/auth")) {
    return NextResponse.next();
  }

  // 2. Admin Login page & Admin Auth routes
  if (pathname === "/login") {
    // If already logged in as admin/staff, redirect straight to CRM dashboard
    if (staffSessionCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 3. Candidate Portal UI pages (/portal, /portal/applications, /portal/interviews, etc.)
  if (pathname.startsWith("/portal")) {
    const tokenParam = searchParams.get("token");

    // If query contains token, allow through to exchange or authenticate
    if (tokenParam) {
      return NextResponse.next();
    }

    // Otherwise, require cx_session cookie
    if (!cxSessionCookie) {
      const loginUrl = new URL("/portal/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 4. Candidate Portal API routes (/api/portal/*)
  if (pathname.startsWith("/api/portal")) {
    if (!cxSessionCookie && !request.headers.get("authorization")) {
      return NextResponse.json(
        { error: "Unauthorized candidate portal request." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. Admin CRM UI Routes (/, /clients, /staff, /registrations)
  const isAdminRoute =
    pathname === "/" ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/registrations");

  if (isAdminRoute) {
    // If staff session exists, allow access
    if (staffSessionCookie) {
      return NextResponse.next();
    }

    // If logged in as candidate only, keep them inside Candidate Portal
    if (cxSessionCookie) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    // Not authenticated -> redirect to Admin Secret Code Login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Admin API Routes (/api/registrations/*)
  if (pathname.startsWith("/api/registrations")) {
    if (!staffSessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/portal/:path*",
    "/api/portal/:path*",
    "/login",
    "/",
    "/clients/:path*",
    "/staff/:path*",
    "/registrations/:path*",
    "/api/registrations/:path*",
  ],
};
