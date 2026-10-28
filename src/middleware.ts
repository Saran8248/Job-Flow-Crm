import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSessionRole(token?: string): "ADMIN" | "STAFF" | null {
  if (!token) return null;
  try {
    const [base64Data] = token.split(".");
    if (!base64Data) return null;
    const json = atob(base64Data.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json);
    return parsed.role === "ADMIN" ? "ADMIN" : parsed.role === "STAFF" ? "STAFF" : null;
  } catch {
    return null;
  }
}

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

  // 2. Admin / Staff Login page & Admin Auth routes
  if (pathname === "/login") {
    // If already logged in as admin/staff, redirect appropriately
    if (staffSessionCookie) {
      const role = getSessionRole(staffSessionCookie);
      if (role === "STAFF") {
        return NextResponse.redirect(new URL("/staff/dashboard", request.url));
      }
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

  // 5. Staff-specific routes (Staff Dashboard & Workspace)
  const isStaffWorkspaceOrDashboard =
    pathname.startsWith("/staff/workspace") ||
    pathname.startsWith("/staff/dashboard");

  if (isStaffWorkspaceOrDashboard) {
    if (!staffSessionCookie) {
      if (cxSessionCookie) {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      return NextResponse.redirect(new URL("/login?role=staff", request.url));
    }
    return NextResponse.next();
  }

  // 6. Admin-only CRM UI Routes (/, /clients, /staff team management, /registrations)
  const isAdminOnlyRoute =
    pathname === "/" ||
    pathname.startsWith("/clients") ||
    pathname === "/staff" ||
    (pathname.startsWith("/staff") && !isStaffWorkspaceOrDashboard) ||
    pathname.startsWith("/registrations");

  if (isAdminOnlyRoute) {
    // If not authenticated
    if (!staffSessionCookie) {
      // If logged in as candidate only, keep them inside Candidate Portal
      if (cxSessionCookie) {
        return NextResponse.redirect(new URL("/portal", request.url));
      }

      // Not authenticated -> redirect to Login
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated as STAFF: restrict access to admin-only pages (Clients, Registrations, Staff Team)
    const role = getSessionRole(staffSessionCookie);
    if (role === "STAFF") {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // 7. Admin API Routes (/api/registrations/*)
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
