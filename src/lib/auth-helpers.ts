import crypto from "crypto";
import { cookies } from "next/headers";

const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || "ADMIN2026";
const ADMIN_COOKIE_NAME = "staff_session";
const SESSION_SECRET = process.env.PORTAL_SESSION_SECRET || "jobassist-candidate-portal-secure-key-2026";

// 1. Password Hashing (Salt + SHA256)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${salt}:${password}`)
    .digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const computedHash = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(`${salt}:${password}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(originalHash));
  } catch {
    return false;
  }
}

// 2. OTP Generation (6-digit numeric string)
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 3. Admin / Staff Session
export function signAdminToken(): string {
  const payload = {
    role: "STAFF",
    authenticatedAt: Date.now(),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };
  const json = JSON.stringify(payload);
  const base64Data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");
  return `${base64Data}.${signature}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [base64Data, signature] = parts;

    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(base64Data)
      .digest("base64url");

    if (signature !== expectedSig) return false;

    const json = Buffer.from(base64Data, "base64url").toString("utf8");
    const payload = JSON.parse(json);

    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return payload.role === "STAFF";
  } catch {
    return false;
  }
}

export async function getAdminSession(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return false;
    return verifyAdminToken(token);
  } catch {
    return false;
  }
}

export { ADMIN_SECRET_CODE, ADMIN_COOKIE_NAME };
