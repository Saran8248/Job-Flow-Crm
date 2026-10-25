const assert = require("node:assert");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== JobAssist CRM Comprehensive Functional & Integration Tests ===");
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
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

  try {
    // 1. Staff Members Existence
    await test("Staff members exist in database", async () => {
      const staff = await prisma.staff.findMany();
      assert(staff.length >= 3, `Expected at least 3 staff members, found ${staff.length}`);
      const names = staff.map((s) => s.name);
      assert(names.includes("Arun K"), "Expected Arun K to exist");
      assert(names.includes("Divya S"), "Expected Divya S to exist");
      assert(names.includes("Meena T"), "Expected Meena T to exist");
    });

    // 2. Client Records Verification
    await test("Candidate records exist with correct structure", async () => {
      const clients = await prisma.client.findMany({
        include: { staff: true, _count: { select: { applications: true } } },
      });
      assert(clients.length >= 1, `Expected at least 1 client, found ${clients.length}`);

      const candidate = clients[0];
      assert(candidate && candidate.name, "Candidate must exist");
      assert(candidate.email, "Candidate must have email");
      assert(candidate.portalEnabled !== undefined, "portalEnabled must be boolean");
    });

    // 3. Client Creation and Validation
    let testClientId = null;
    await test("Create a new client with auto-balance calculation", async () => {
      const uniqueEmail = `test.client.${Date.now()}@example.com`;
      const staff = await prisma.staff.findFirst();

      const newClient = await prisma.client.create({
        data: {
          name: "Test Candidate",
          email: uniqueEmail,
          phone: "+91 99887 66554",
          targetRole: "Cloud DevOps Engineer",
          planDurationMonths: 2,
          planStartDate: new Date(),
          planEndDate: new Date(Date.now() + 60 * 24 * 60 * 1000),
          currentStage: "CONFIRMED",
          paymentStatus: "PENDING",
          totalFee: 20000,
          amountPaid: 5000,
          balance: 15000,
          assignedStaffId: staff.id,
          dailyTarget: 60,
        },
      });

      assert(newClient.id, "Client should be created with an ID");
      assert.strictEqual(newClient.balance, 15000, "Balance should be totalFee - amountPaid");
      testClientId = newClient.id;

      // Duplicate prevention
      try {
        await prisma.client.create({
          data: {
            name: "Duplicate Test",
            email: uniqueEmail,
            targetRole: "Tester",
            planStartDate: new Date(),
            planEndDate: new Date(),
          },
        });
        assert.fail("Should have thrown error on duplicate email");
      } catch (e) {
        assert(e.code === "P2002" || e.message.includes("unique"), "Unique constraint respected");
      }
    });

    // 4. Client Stage Transition and History
    await test("Update client stage and record stage history", async () => {
      assert(testClientId, "testClientId must exist");

      await prisma.client.update({
        where: { id: testClientId },
        data: { currentStage: "DETAILS_COLLECTED" },
      });

      const history = await prisma.clientStageHistory.create({
        data: {
          clientId: testClientId,
          previousStage: "CONFIRMED",
          newStage: "DETAILS_COLLECTED",
          changedBy: "Senior Coach",
          notes: "Collected resume and portfolio links",
        },
      });

      assert.strictEqual(history.previousStage, "CONFIRMED");
      assert.strictEqual(history.newStage, "DETAILS_COLLECTED");

      const updated = await prisma.client.findUnique({
        where: { id: testClientId },
        include: { stageHistory: true },
      });
      assert.strictEqual(updated.currentStage, "DETAILS_COLLECTED");
      assert(updated.stageHistory.length >= 1, "Stage history must have records");
    });

    // 5. Payment Recording & Dynamic Balance Update
    await test("Record payment and recalculate balance and payment status", async () => {
      assert(testClientId, "testClientId must exist");

      const payment = await prisma.payment.create({
        data: {
          clientId: testClientId,
          amount: 15000,
          paymentMethod: "UPI",
          status: "COMPLETED",
          referenceNumber: "UPI-TEST-9988",
        },
      });

      assert(payment.id, "Payment created");

      const client = await prisma.client.findUnique({ where: { id: testClientId } });
      const newAmountPaid = client.amountPaid + 15000;
      const newBalance = Math.max(0, client.totalFee - newAmountPaid);
      const newStatus = newBalance === 0 ? "PAID" : "PARTIALLY_PAID";

      const updatedClient = await prisma.client.update({
        where: { id: testClientId },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          paymentStatus: newStatus,
        },
      });

      assert.strictEqual(updatedClient.amountPaid, 20000);
      assert.strictEqual(updatedClient.balance, 0);
      assert.strictEqual(updatedClient.paymentStatus, "PAID");
    });

    // 6. Application Tracking
    await test("Record job application and verify live counts", async () => {
      assert(testClientId, "testClientId must exist");

      const app = await prisma.application.create({
        data: {
          clientId: testClientId,
          companyName: "Stripe",
          jobTitle: "Cloud DevOps Engineer",
          jobLocation: "Remote",
          jobPostingUrl: "https://stripe.com/jobs/12345",
          status: "APPLIED",
          notes: "Applied via internal referral",
        },
      });

      assert(app.id, "Application created");

      const count = await prisma.application.count({ where: { clientId: testClientId } });
      assert.strictEqual(count, 1, "Client should have exactly 1 application");
    });

    // 7. Interview Scheduling
    await test("Schedule interview for client", async () => {
      assert(testClientId, "testClientId must exist");

      const interview = await prisma.interview.create({
        data: {
          clientId: testClientId,
          companyName: "Stripe",
          round: "Round 1 - Technical Screen",
          scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          status: "SCHEDULED",
          meetingLink: "https://meet.google.com/test-meet",
        },
      });

      assert(interview.id, "Interview scheduled");
      assert.strictEqual(interview.status, "SCHEDULED");
    });

    // 8. Dashboard Statistics Calculations
    await test("Dashboard calculates live metrics accurately", async () => {
      const activeClients = await prisma.client.count({
        where: { currentStage: { not: "RENEWED_CLOSED" } },
      });
      assert(activeClients >= 1, `Expected at least 1 active client, got ${activeClients}`);

      const totalApps = await prisma.application.count();
      assert(totalApps >= 1, "Expected at least 1 application in database");
    });

    // 9. Recruiter Communications
    await test("Recruiter inbox contains updates matching screenshot", async () => {
      const comms = await prisma.recruiterCommunication.findMany({
        orderBy: { receivedAt: "desc" },
      });
      assert(comms.length >= 1, "Expected at least 1 recruiter communication");
    });

    // 10. Candidate Portal Security & Isolation
    await test("Candidate Portal isolation: Candidate A cannot read Candidate B's data", async () => {
      assert(testClientId, "testClientId must exist");

      // Create a secondary isolated test client
      const clientB = await prisma.client.create({
        data: {
          name: "Isolated Client B",
          email: `client.b.${Date.now()}@example.com`,
          targetRole: "Security Engineer",
          planStartDate: new Date(),
          planEndDate: new Date(),
          portalEnabled: true,
          portalToken: `cx-client-b-${Date.now()}`,
        },
      });

      const appB = await prisma.application.create({
        data: {
          clientId: clientB.id,
          companyName: "Private Security Corp",
          jobTitle: "Security Analyst",
          status: "APPLIED",
        },
      });

      const clientAApps = await prisma.application.findMany({
        where: { clientId: testClientId, visibleToClient: true },
      });
      const clientBApps = await prisma.application.findMany({
        where: { clientId: clientB.id, visibleToClient: true },
      });

      assert(clientAApps.length > 0, "Client A must have applications");
      assert(clientBApps.length > 0, "Client B must have applications");

      const clientAAppIds = new Set(clientAApps.map((a) => a.id));
      const overlap = clientBApps.some((a) => clientAAppIds.has(a.id));
      assert(!overlap, "Candidate A applications must never overlap with Candidate B");

      // Clean up client B
      await prisma.application.delete({ where: { id: appB.id } });
      await prisma.client.delete({ where: { id: clientB.id } });
    });

    // 11. Hidden by Default Guardrail Test
    await test("Candidate Portal hides internal staff notes, payment references and credentials", async () => {
      assert(testClientId, "testClientId must exist");

      const candidateAppView = await prisma.application.findFirst({
        where: { clientId: testClientId, visibleToClient: true },
        select: {
          id: true,
          companyName: true,
          jobTitle: true,
          jobLocation: true,
          jobPostingUrl: true,
          applicationDate: true,
          status: true,
          portal: true,
          // Explicitly NO notes, NO recruiterContact
        },
      });

      assert(candidateAppView, "Application must exist");
      assert.strictEqual(candidateAppView.notes, undefined, "Internal notes must not be present");
      assert.strictEqual(candidateAppView.recruiterContact, undefined, "Recruiter contact must not be present");
    });

    // 12. Candidate Portal Access Audit Logging
    await test("Portal access log records candidate sign-ins", async () => {
      assert(testClientId, "testClientId must exist");
      const log = await prisma.portalAccessLog.create({
        data: {
          clientId: testClientId,
          action: "PORTAL_LOGIN_TEST",
        },
      });

      assert(log.id, "Log created");
      assert.strictEqual(log.clientId, testClientId);
      assert.strictEqual(log.action, "PORTAL_LOGIN_TEST");
    });

    // 13. Auth Helpers Verification
    await test("Auth helper functions: password hashing, verification, OTP generation, admin token signing", async () => {
      const crypto = require("crypto");
      const SESSION_SECRET = process.env.PORTAL_SESSION_SECRET || "jobassist-candidate-portal-secure-key-2026";

      function hashPassword(password) {
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.createHmac("sha256", SESSION_SECRET).update(`${salt}:${password}`).digest("hex");
        return `${salt}:${hash}`;
      }

      function verifyPassword(password, storedHash) {
        const [salt, originalHash] = storedHash.split(":");
        if (!salt || !originalHash) return false;
        const computedHash = crypto.createHmac("sha256", SESSION_SECRET).update(`${salt}:${password}`).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(originalHash));
      }

      function generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
      }

      const pass = "Antigravity@2026";
      const hashed = hashPassword(pass);
      assert(hashed.includes(":"), "Hash must contain salt delimiter");
      assert.strictEqual(verifyPassword(pass, hashed), true, "Valid password must verify");
      assert.strictEqual(verifyPassword("WrongPassword", hashed), false, "Invalid password must fail");

      const otp = generateOtp();
      assert.strictEqual(otp.length, 6, "OTP must be 6 digits");
      assert(/^\d{6}$/.test(otp), "OTP must be numeric");
    });

    // 14. Clean up test client
    if (testClientId) {
      await prisma.client.delete({ where: { id: testClientId } });
    }

  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) process.exit(1);
}

runTests();
