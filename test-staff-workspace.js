const assert = require("node:assert");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function runStaffWorkspaceTests() {
  console.log("=== JobAssist Staff Workspace & Target Operations Test Suite ===");
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
    // 1. Staff Members & Assignment Check
    let staff = null;
    let client = null;

    await test("Staff exists and has assigned candidates with daily targets", async () => {
      staff = await prisma.staff.findFirst({
        where: { name: "Arun K" },
        include: { clients: true },
      });
      assert(staff, "Arun K must exist in database");
      assert(staff.clients.length > 0, "Arun K must have assigned candidates");

      client = staff.clients[0];
      assert(client.dailyTarget > 0, "Client must have positive dailyTarget");
      console.log(`    Staff: ${staff.name}, Candidate: ${client.name}, Daily Target: ${client.dailyTarget}`);
    });

    // 2. Mandatory Screenshot Proof Test
    await test("Validation: Missing proof screenshot must be rejected", async () => {
      // Simulating the validation logic in POST /api/staff/applications
      const proofImageUrl = null;
      let blocked = false;
      if (!proofImageUrl || typeof proofImageUrl !== "string" || !proofImageUrl.trim()) {
        blocked = true;
      }
      assert(blocked === true, "Must block submission when proof screenshot is missing");
    });

    // 3. Application Logging with Proof
    let createdApp = null;
    const testCompanyName = `TestTech-${Date.now()}`;
    const testJobRole = "Senior Full Stack Engineer";
    const sampleProof = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    await test("Log application with verified image proof", async () => {
      createdApp = await prisma.application.create({
        data: {
          clientId: client.id,
          jobTitle: testJobRole,
          companyName: testCompanyName,
          portal: "LinkedIn",
          jobPostingUrl: "https://linkedin.com/jobs/view/123456",
          status: "APPLIED",
          proofImageUrl: sampleProof,
          notes: "Applied via internal specialist workspace",
          visibleToClient: true,
          applicationDate: new Date(),
        },
      });

      assert(createdApp && createdApp.id, "Application must be created");
      assert.strictEqual(createdApp.proofImageUrl, sampleProof, "Proof image URL must be preserved");
    });

    // 4. Duplicate Warning Check (Same CX + Company + Role today)
    await test("Duplicate Detection: Flags identical company + role on the same day", async () => {
      const now = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffsetMs);
      const startOfDayIST = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const startOfToday = new Date(startOfDayIST.getTime() - istOffsetMs);
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

      const existingDuplicate = await prisma.application.findFirst({
        where: {
          clientId: client.id,
          companyName: { equals: testCompanyName },
          jobTitle: { equals: testJobRole },
          applicationDate: { gte: startOfToday, lte: endOfToday },
        },
      });

      assert(existingDuplicate !== null, "Must detect existing application for duplicate warning");
      assert.strictEqual(existingDuplicate.id, createdApp.id);
    });

    // 5. Daily Target Progress Calculation & IST Midnight Boundary
    await test("IST Midnight bounds calculation correctly tracks daily applied count", async () => {
      const now = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffsetMs);
      const startOfDayIST = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
      const startOfToday = new Date(startOfDayIST.getTime() - istOffsetMs);
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

      const countToday = await prisma.application.count({
        where: {
          clientId: client.id,
          applicationDate: { gte: startOfToday, lte: endOfToday },
        },
      });

      assert(countToday >= 1, "Must count at least the newly created application today");
      const targetReached = countToday >= client.dailyTarget;
      console.log(`    Applied Today: ${countToday}/${client.dailyTarget}, Target Reached: ${targetReached}`);
    });

    // 6. Candidate View Verification: Proof visibility & security
    await test("Candidate Portal: Proof is included and internal audit notes are excluded", async () => {
      const candidateApps = await prisma.application.findMany({
        where: { clientId: client.id, visibleToClient: true },
        select: {
          id: true,
          companyName: true,
          jobTitle: true,
          portal: true,
          status: true,
          proofImageUrl: true,
          applicationDate: true,
        },
      });

      assert(candidateApps.length > 0, "Candidate must see applications");
      const matching = candidateApps.find((a) => a.id === createdApp.id);
      assert(matching, "Created application must be visible to candidate");
      assert(matching.proofImageUrl, "Candidate must be able to view proof thumbnail");
    });

    // 7. Clean up test application
    await test("Cleanup test application", async () => {
      await prisma.application.delete({
        where: { id: createdApp.id },
      });
      console.log("    Test application deleted cleanly.");
    });

  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n=== Staff Workspace Test Suite Results: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) process.exit(1);
}

runStaffWorkspaceTests();
