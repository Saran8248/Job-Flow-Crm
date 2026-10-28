const assert = require("node:assert");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runStaffPerformanceTests() {
  console.log("=== JobAssist Staff Dashboard & Role Isolation Test Suite ===");
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

  let staffCookie = "";
  let adminCookie = "";

  // 1. Staff Authentication
  await step("Staff login succeeds and sets staff_session cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/staff-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "arun.k@jobassist.internal",
        passcode: "STAFF2026",
      }),
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    assert(setCookie && setCookie.includes("staff_session"));
    staffCookie = setCookie.split(";")[0];
  });

  // 2. Auth Session Check
  await step("/api/auth/me identifies role as STAFF with member details", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.role, "STAFF");
    assert.strictEqual(data.name, "Arun K");
    assert(data.staffId);
  });

  // 3. Removal & Redirection of Cx, Cx Registration, and Staff Team for Staff
  await step("Staff accessing /clients (cx) is blocked and redirected to /staff/dashboard", async () => {
    const res = await fetch(`${BASE_URL}/clients`, {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302);
    const location = res.headers.get("location");
    assert(location && location.includes("/staff/dashboard"));
  });

  await step("Staff accessing /registrations (cx registration) is blocked and redirected to /staff/dashboard", async () => {
    const res = await fetch(`${BASE_URL}/registrations`, {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302);
    const location = res.headers.get("location");
    assert(location && location.includes("/staff/dashboard"));
  });

  await step("Staff accessing /staff (staff team) is blocked and redirected to /staff/dashboard", async () => {
    const res = await fetch(`${BASE_URL}/staff`, {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302);
    const location = res.headers.get("location");
    assert(location && location.includes("/staff/dashboard"));
  });

  await step("Staff accessing / (admin dashboard) is blocked and redirected to /staff/dashboard", async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302);
    const location = res.headers.get("location");
    assert(location && location.includes("/staff/dashboard"));
  });

  // 4. Staff Allowed Routes
  await step("Staff can access /staff/dashboard with HTTP 200", async () => {
    const res = await fetch(`${BASE_URL}/staff/dashboard`, {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    assert.strictEqual(res.status, 200);
  });

  await step("Staff can access /staff/workspace with HTTP 200", async () => {
    const res = await fetch(`${BASE_URL}/staff/workspace`, {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    assert.strictEqual(res.status, 200);
  });

  // 5. Staff Performance API
  await step("/api/staff/performance returns candidates, daily targets, and application counts", async () => {
    const res = await fetch(`${BASE_URL}/api/staff/performance?dateRange=today`, {
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert(Array.isArray(data.candidates));
    assert(data.candidates.length >= 3);

    // Verify candidate names and application tracking
    const candidateNames = data.candidates.map((c) => c.name);
    assert(candidateNames.includes("Saran"));
    assert(candidateNames.includes("Priya Sharma"));
    assert(candidateNames.includes("Aarav Kumar"));

    const priya = data.candidates.find((c) => c.name === "Priya Sharma");
    assert(priya.todayAppliedCount >= priya.dailyTarget);
    assert.strictEqual(priya.statusChip, "TARGET_DONE");

    // Verify metrics
    assert(data.metrics.totalAppliedToday > 0);
    assert(data.metrics.overallCompletionRate > 0);
    assert(data.metrics.portalBreakdown.length > 0);
  });

  // 6. Admin Login and Permissions
  await step("Admin login succeeds and sets staff_session with ADMIN role", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretCode: "ADMIN2026" }),
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    adminCookie = setCookie.split(";")[0];

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: adminCookie },
    });
    const meData = await meRes.json();
    assert.strictEqual(meData.role, "ADMIN");
  });

  await step("Admin can access / (admin dashboard) and /registrations (cx registration)", async () => {
    const resRoot = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    assert.strictEqual(resRoot.status, 200);

    const resReg = await fetch(`${BASE_URL}/registrations`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    assert.strictEqual(resReg.status, 200);

    const resDash = await fetch(`${BASE_URL}/staff/dashboard`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    assert.strictEqual(resDash.status, 200);
  });

  console.log(`\n=== All Tests Completed: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) process.exit(1);
}

runStaffPerformanceTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
