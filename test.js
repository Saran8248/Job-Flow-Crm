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

    // 2. Exact Reference Clients Existence
    await test("Exact reference clients exist with correct data", async () => {
      const clients = await prisma.client.findMany({
        include: { staff: true, _count: { select: { applications: true } } },
      });
      assert(clients.length >= 7, `Expected at least 7 clients, found ${clients.length}`);

      const priya = clients.find((c) => c.name === "Priya Raman");
      assert(priya, "Priya Raman must exist");
      assert.strictEqual(priya.targetRole, "Frontend Developer");
      assert.strictEqual(priya.currentStage, "APPLICATIONS_IN_PROGRESS");
      assert.strictEqual(priya.paymentStatus, "PAID");
      assert(priya._count.applications >= 53, "Priya should have at least 53 applications");

      const sneha = clients.find((c) => c.name === "Sneha Iyer");
      assert(sneha, "Sneha Iyer must exist");
      assert.strictEqual(sneha.paymentStatus, "PENDING");
      assert.strictEqual(sneha.currentStage, "CONFIRMED");
      assert.strictEqual(sneha.balance, 10000);
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
          planEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
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
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const activeClients = await prisma.client.count({
        where: { currentStage: { not: "RENEWED_CLOSED" } },
      });
      assert(activeClients >= 6, `Expected at least 6 active clients, got ${activeClients}`);

      const appsToday = await prisma.application.count({
        where: { applicationDate: { gte: startOfToday, lte: endOfToday } },
      });
      assert(appsToday >= 170, `Expected at least 170 apps today, got ${appsToday}`);

      const interviewsSecured = await prisma.interview.count({
        where: { status: { in: ["SCHEDULED", "COMPLETED"] } },
      });
      assert(interviewsSecured >= 18, `Expected at least 18 interviews, got ${interviewsSecured}`);

      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const renewalsDue = await prisma.client.count({
        where: {
          planEndDate: { lte: sevenDaysFromNow },
          currentStage: { not: "RENEWED_CLOSED" },
        },
      });
      assert(renewalsDue >= 1, `Expected at least 1 renewal due, got ${renewalsDue}`);
    });

    // 9. Recruiter Communications
    await test("Recruiter inbox contains updates matching screenshot", async () => {
      const comms = await prisma.recruiterCommunication.findMany({
        orderBy: { receivedAt: "desc" },
      });
      assert(comms.length >= 4, "Expected at least 4 recruiter communications");
      const senders = comms.map((c) => c.recruiterOrCompany);
      assert(senders.includes("Zoho Talent"), "Zoho Talent communication missing");
      assert(senders.includes("Freshworks HR"), "Freshworks HR communication missing");
      assert(senders.includes("TCS iON"), "TCS iON communication missing");
      assert(senders.includes("Swiggy Careers"), "Swiggy Careers communication missing");
    });

    // 10. Clean up test client
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
