const assert = require("node:assert");

const BASE_URL = "http://localhost:3000";

async function runAuthTests() {
  console.log("=== Running Comprehensive End-to-End Auth & Cx Registration Tests ===\n");
  let passed = 0;
  let failed = 0;

  async function step(name, fn) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  let adminCookie = "";
  let candidateCookie = "";
  const testCandidateEmail = `candidate.${Date.now()}@example.com`;
  let testCandidateId = "";
  let firstTimeOtp = "";
  let resetOtp = "";

  // 1. Admin Login Tests
  await step("Admin Login rejects invalid secret code", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretCode: "WRONGCODE123" }),
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert(data.error.includes("Invalid secret code"));
  });

  await step("Admin Login succeeds with ADMIN2026 and sets staff_session cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretCode: "ADMIN2026" }),
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    assert(setCookie && setCookie.includes("staff_session="), "Must set staff_session cookie");
    adminCookie = setCookie.split(";")[0];
  });

  // 2. Admin Cx Registration
  await step("Admin registers new candidate in PENDING state", async () => {
    const res = await fetch(`${BASE_URL}/api/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: "Dev E2E Test Candidate",
        email: testCandidateEmail,
        phone: "+91 99999 11111",
        targetRole: "Full Stack Engineer",
        registrationStatus: "PENDING",
        portalEnabled: false,
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200 or 201, got ${res.status}`);
    const data = await res.json();
    assert(data.candidate && data.candidate.id);
    testCandidateId = data.candidate.id;
  });

  // 3. Candidate check-email when PENDING
  await step("Candidate login check rejects unapproved candidate with 403", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/auth/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testCandidateEmail }),
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert(data.error.includes("approved by the Admin yet"));
  });

  // 4. Admin Approves Candidate
  await step("Admin approves candidate registration and enables portal access", async () => {
    const res = await fetch(`${BASE_URL}/api/registrations/${testCandidateId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        registrationStatus: "APPROVED",
        portalEnabled: true,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.candidate.registrationStatus, "APPROVED");
    assert.strictEqual(data.candidate.portalEnabled, true);
  });

  // 5. Approved Candidate First-Time Login Request
  await step("Candidate checks email: generates first-time OTP (isFirstLogin = true)", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/auth/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testCandidateEmail }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.isFirstLogin, true);
    assert(data.debugOtp && data.debugOtp.length === 6, "Must provide 6-digit OTP");
    firstTimeOtp = data.debugOtp;
  });

  // 6. Verify First-Time OTP & Set Password
  await step("First-time setup rejects wrong OTP code", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/auth/verify-first-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCandidateEmail,
        otpCode: "000000",
        password: "FirstPassword@123",
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert(data.error.includes("Invalid OTP"));
  });

  await step("First-time setup succeeds with correct OTP & sets password and cx_session cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/auth/verify-first-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCandidateEmail,
        otpCode: firstTimeOtp,
        password: "FirstPassword@123",
      }),
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    assert(setCookie && setCookie.includes("cx_session="), "Must set cx_session cookie");
    candidateCookie = setCookie.split(";")[0];
  });

  // 7. Subsequent Login Check
  await step("Candidate next login: check-email returns isFirstLogin = false", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/auth/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testCandidateEmail }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.isFirstLogin, false, "Must not be first login anymore");
  });

  await step("Subsequent login succeeds with email and password", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/auth/login-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCandidateEmail,
        password: "FirstPassword@123",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.success);
    assert.strictEqual(data.candidate.email, testCandidateEmail);
  });

  await step("Subsequent login fails with wrong password", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/auth/login-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCandidateEmail,
        password: "WrongPassword@999",
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  // 8. Forgot Password Flow
  await step("Forgot password triggers OTP code to email", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCandidateEmail,
        reason: "FORGOT_PASSWORD",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.debugOtp && data.debugOtp.length === 6);
    resetOtp = data.debugOtp;
  });

  await step("Reset password succeeds with OTP and new password", async () => {
    const res = await fetch(`${BASE_URL}/api/portal/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCandidateEmail,
        otpCode: resetOtp,
        newPassword: "BrandNewPassword@2026",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.success);
  });

  await step("Old password no longer works, new password works", async () => {
    const oldRes = await fetch(`${BASE_URL}/api/portal/auth/login-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCandidateEmail,
        password: "FirstPassword@123",
      }),
    });
    assert.strictEqual(oldRes.status, 401);

    const newRes = await fetch(`${BASE_URL}/api/portal/auth/login-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCandidateEmail,
        password: "BrandNewPassword@2026",
      }),
    });
    assert.strictEqual(newRes.status, 200);
  });

  // 9. Middleware Protection Tests
  await step("Middleware redirects unauthenticated user from / to /login", async () => {
    const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
    assert(res.status === 307 || res.status === 302);
    const location = res.headers.get("location");
    assert(location && location.includes("/login"));
  });

  await step("Middleware redirects unauthenticated user from /portal to /portal/login", async () => {
    const res = await fetch(`${BASE_URL}/portal`, { redirect: "manual" });
    assert(res.status === 307 || res.status === 302);
    const location = res.headers.get("location");
    assert(location && location.includes("/portal/login"));
  });

  await step("Middleware redirects candidate from / to /portal (preventing admin CRM access)", async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: candidateCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302);
    const location = res.headers.get("location");
    assert(location && location.includes("/portal"));
  });

  await step("Middleware allows Admin with staff_session to access / and /registrations", async () => {
    const res = await fetch(`${BASE_URL}/registrations`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    assert.strictEqual(res.status, 200);
  });

  // 10. Clean up test candidate
  if (testCandidateId) {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    try {
      await prisma.client.delete({ where: { id: testCandidateId } });
    } catch {
      // ignore
    } finally {
      await prisma.$disconnect();
    }
  }

  console.log(`\n=== All Auth & Cx Tests Completed: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) process.exit(1);
}

runAuthTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
