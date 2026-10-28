import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ADMIN_SECRET_CODE: z
    .string()
    .min(6, "ADMIN_SECRET_CODE must be at least 6 characters long"),
  STAFF_SECRET_CODE: z.string().optional().default("STAFF2026"),
  PORTAL_SESSION_SECRET: z
    .string()
    .min(16, "PORTAL_SESSION_SECRET must be at least 16 characters for cryptographic signing"),
  SMTP_HOST: z.string().optional().default("smtp.gmail.com"),
  SMTP_PORT: z.string().optional().default("587"),
  SMTP_SECURE: z.string().optional().default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  EXPOSE_DEBUG_OTP: z.string().optional().default("false"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration. Check server logs.");
    }
    // Return partial fallback for local dev if missing
    return {
      DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
      NODE_ENV: (process.env.NODE_ENV as any) || "development",
      ADMIN_SECRET_CODE: process.env.ADMIN_SECRET_CODE || "ADMIN2026",
      STAFF_SECRET_CODE: process.env.STAFF_SECRET_CODE || "STAFF2026",
      PORTAL_SESSION_SECRET:
        process.env.PORTAL_SESSION_SECRET ||
        "jobassist-candidate-portal-secure-key-2026-default",
      SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
      SMTP_PORT: process.env.SMTP_PORT || "587",
      SMTP_SECURE: process.env.SMTP_SECURE || "false",
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      SMTP_FROM: process.env.SMTP_FROM,
      EXPOSE_DEBUG_OTP: process.env.EXPOSE_DEBUG_OTP || "false",
    };
  }
  return result.data;
}

export const env = validateEnv();
