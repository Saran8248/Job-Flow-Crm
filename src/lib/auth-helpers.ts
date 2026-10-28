import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_SECRET =
  process.env.PORTAL_SESSION_SECRET ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("CRITICAL SECURITY ERROR: PORTAL_SESSION_SECRET is required in production!");
      })()
    : "jobassist-candidate-portal-secure-key-2026");

const ADMIN_SECRET_CODE =
  process.env.ADMIN_SECRET_CODE ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("CRITICAL SECURITY ERROR: ADMIN_SECRET_CODE must be set in production!");
      })()
    : "ADMIN2026");

const STAFF_SECRET_CODE =
  process.env.STAFF_SECRET_CODE ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("CRITICAL SECURITY ERROR: STAFF_SECRET_CODE must be set in production!");
      })()
    : "STAFF2026");

const ADMIN_COOKIE_NAME = "staff_session";

// 1. Password Hashing (Cryptographic scrypt with per-user salt)
const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash || typeof storedHash !== "string") return false;

    // Scrypt format: scrypt:salt:hash
    if (storedHash.startsWith("scrypt:")) {
      const parts = storedHash.split(":");
      if (parts.length !== 3) return false;
      const [, salt, originalHash] = parts;
      const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
      const originalBuffer = Buffer.from(originalHash, "hex");
      return crypto.timingSafeEqual(derivedKey, originalBuffer);
    }

    // Legacy HMAC-SHA256 fallback format (salt:hash) for existing test/db records
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const computedHash = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(`${salt}:${password}`)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch {
    return false;
  }
}

// 2. Cryptographically Secure OTP Generation (crypto.randomInt)
export function generateOtp(): string {
  // Generates cryptographically uniform integer between 100000 and 999999
  return crypto.randomInt(100000, 1000000).toString();
}

// 3. Admin / Staff Session
export interface StaffSessionPayload {
  role: "ADMIN" | "STAFF";
  email?: string;
  name?: string;
  staffId?: string;
  authenticatedAt: number;
  exp: number;
}

export function signAdminToken(metadata?: {
  role?: string;
  email?: string;
  name?: string;
  staffId?: string;
}): string {
  const payload: StaffSessionPayload = {
    role: (metadata?.role as "ADMIN" | "STAFF") || "ADMIN",
    email: metadata?.email,
    name: metadata?.name,
    staffId: metadata?.staffId,
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

export function decodeAdminToken(token: string): StaffSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [base64Data, signature] = parts;

    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(base64Data)
      .digest("base64url");

    if (signature.length !== expectedSig.length) return null;
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(expectedSig, "utf8")
      )
    ) {
      return null;
    }

    const json = Buffer.from(base64Data, "base64url").toString("utf8");
    const payload = JSON.parse(json) as StaffSessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): boolean {
  const payload = decodeAdminToken(token);
  if (!payload) return false;
  return payload.role === "STAFF" || payload.role === "ADMIN";
}

export async function getAdminSessionPayload(): Promise<StaffSessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    return decodeAdminToken(token);
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<boolean> {
  const payload = await getAdminSessionPayload();
  return Boolean(payload);
}

export { ADMIN_SECRET_CODE, STAFF_SECRET_CODE, ADMIN_COOKIE_NAME };
