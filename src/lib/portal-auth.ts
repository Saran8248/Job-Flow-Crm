import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "cx_session";
const SESSION_SECRET = process.env.PORTAL_SESSION_SECRET || "jobassist-candidate-portal-secure-key-2026";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface CandidateSessionPayload {
  clientId: string;
  role: "CANDIDATE";
  email: string;
  name: string;
  exp: number;
}

export function signSessionToken(payload: Omit<CandidateSessionPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const fullPayload: CandidateSessionPayload = { ...payload, exp };
  const json = JSON.stringify(fullPayload);
  const base64Data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");
  return `${base64Data}.${signature}`;
}

export function verifySessionToken(token: string): CandidateSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [base64Data, signature] = parts;

    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(base64Data)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    const json = Buffer.from(base64Data, "base64url").toString("utf8");
    const payload = JSON.parse(json) as CandidateSessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    if (payload.role !== "CANDIDATE" || !payload.clientId) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getCandidateSession(): Promise<CandidateSessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireCandidateAuth() {
  const session = await getCandidateSession();
  if (!session) {
    return { error: "Unauthorized. Please sign in to candidate portal.", status: 401, client: null };
  }

  // Ensure client still exists and portalEnabled is true
  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    select: {
      id: true,
      name: true,
      email: true,
      targetRole: true,
      currentStage: true,
      portalEnabled: true,
      portalToken: true,
    },
  });

  if (!client || !client.portalEnabled) {
    return {
      error: "Portal access disabled or client not found. Please contact your Career Specialist.",
      status: 403,
      client: null,
    };
  }

  return { error: null, status: 200, client };
}

export async function logPortalAccess(clientId: string, action: string) {
  try {
    await prisma.portalAccessLog.create({
      data: {
        clientId,
        action,
      },
    });
  } catch (err) {
    console.error("Failed to log portal access:", err);
  }
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
