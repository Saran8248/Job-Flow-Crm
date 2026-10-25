import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.portalAccessLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.clientTask.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.clientStageHistory.deleteMany();
  await prisma.recruiterCommunication.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.application.deleteMany();
  await prisma.client.deleteMany();
  await prisma.staff.deleteMany();

  // 1. Create Staff Members
  const arun = await prisma.staff.create({
    data: {
      name: "Arun K",
      email: "arun.k@jobassist.internal",
      role: "Lead Career Specialist",
      accountStatus: "ACTIVE",
    },
  });

  const divya = await prisma.staff.create({
    data: {
      name: "Divya S",
      email: "divya.s@jobassist.internal",
      role: "Senior Application Manager",
      accountStatus: "ACTIVE",
    },
  });

  const meena = await prisma.staff.create({
    data: {
      name: "Meena T",
      email: "meena.t@jobassist.internal",
      role: "Career Coach & Outreach",
      accountStatus: "ACTIVE",
    },
  });

  const meera = await prisma.staff.create({
    data: {
      name: "Meera K.",
      email: "meera.k@jobassist.internal",
      role: "Lead Career Specialist",
      accountStatus: "ACTIVE",
    },
  });

  console.log("Created staff members");

  // 2. Reference Clients (including Aarav Kumar from Candidate Portal PRD mockup)
  const clientsData = [
    {
      name: "Aarav Kumar",
      email: "aarav.kumar@gmail.com",
      phone: "+91 98111 22334",
      targetRole: "Frontend / UI Engineer",
      preferredLocation: "Bengaluru / Remote",
      experienceLevel: "3.5 Years",
      skills: "React, TypeScript, Next.js, Tailwind CSS, Redux",
      currentStage: "APPLICATIONS_IN_PROGRESS",
      paymentStatus: "PARTIALLY_PAID",
      assignedStaffId: meera.id,
      totalFee: 30000,
      amountPaid: 24000,
      balance: 6000,
      planDurationMonths: 3,
      planStartDate: new Date("2026-08-20"),
      planEndDate: new Date("2026-11-20"),
      dailyTarget: 60,
      totalApps: 248,
      todayApps: 42,
    },
    {
      name: "Priya Raman",
      email: "priya.joka@gmail.com",
      phone: "+91 98765 43210",
      targetRole: "Frontend Developer",
      preferredLocation: "Bangalore / Remote",
      experienceLevel: "3+ Years",
      skills: "React, Next.js, TypeScript, Tailwind, Redux",
      currentStage: "APPLICATIONS_IN_PROGRESS",
      paymentStatus: "PAID",
      assignedStaffId: arun.id,
      totalFee: 25000,
      amountPaid: 25000,
      balance: 0,
      planDurationMonths: 3,
      planStartDate: new Date("2026-08-30"),
      planEndDate: new Date("2026-11-30"),
      dailyTarget: 60,
      totalApps: 1245,
      todayApps: 53,
    },
    {
      name: "Rahul Menon",
      email: "rahul.menon.hp@gmail.com",
      phone: "+91 98451 22334",
      targetRole: "Data Analyst",
      preferredLocation: "Hyderabad / Pune",
      experienceLevel: "2 Years",
      skills: "SQL, Python, PowerBI, Tableau, Excel",
      currentStage: "FOLLOW_UP",
      paymentStatus: "PAID",
      assignedStaffId: divya.id,
      totalFee: 18000,
      amountPaid: 18000,
      balance: 0,
      planDurationMonths: 2,
      planStartDate: new Date("2026-08-19"),
      planEndDate: new Date("2026-10-19"),
      dailyTarget: 60,
      totalApps: 1560,
      todayApps: 56,
    },
  ];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

  const createdClients = [];

  const stageOrder = [
    "CONFIRMED",
    "PAID",
    "DETAILS_COLLECTED",
    "DOCUMENTS_APPROVED",
    "PORTAL_SETUP",
    "APPLICATIONS_IN_PROGRESS",
    "FOLLOW_UP",
    "REPORT",
    "RENEWED_CLOSED",
  ];

  for (const c of clientsData) {
    const portalSlug = c.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const client = await prisma.client.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        targetRole: c.targetRole,
        preferredLocation: c.preferredLocation,
        experienceLevel: c.experienceLevel,
        skills: c.skills,
        currentStage: c.currentStage,
        paymentStatus: c.paymentStatus,
        assignedStaffId: c.assignedStaffId,
        totalFee: c.totalFee,
        amountPaid: c.amountPaid,
        balance: c.balance,
        planDurationMonths: c.planDurationMonths,
        planStartDate: c.planStartDate,
        planEndDate: c.planEndDate,
        dailyTarget: c.dailyTarget,
        portalEnabled: true,
        portalToken: `cx-${portalSlug}-2026`,
      },
    });
    createdClients.push(client);

    // Initial stage history milestones leading up to current stage
    if (c.name === "Aarav Kumar") {
      // Use exact milestone dates from the mockup:
      // 2 Oct: Confirmed, 3 Oct: Paid, 5 Oct: Details, 8 Oct: Documents, 12 Oct: Portals, Current: Applying in progress
      const aaravMilestones = [
        { stage: "CONFIRMED", date: new Date("2026-10-02T10:00:00Z"), note: "Candidate confirmed package enrollment" },
        { stage: "PAID", date: new Date("2026-10-03T11:30:00Z"), note: "Payment of ₹24,000 received via UPI" },
        { stage: "DETAILS_COLLECTED", date: new Date("2026-10-05T14:15:00Z"), note: "Target roles & preferred locations finalized" },
        { stage: "DOCUMENTS_APPROVED", date: new Date("2026-10-08T16:00:00Z"), note: "Resume approved by Meera K." },
        { stage: "PORTAL_SETUP", date: new Date("2026-10-12T12:00:00Z"), note: "Job-board profiles configured across LinkedIn & Naukri" },
        { stage: "APPLICATIONS_IN_PROGRESS", date: new Date("2026-10-13T09:00:00Z"), note: "Active daily dispatches initiated (Target: 60/day)" },
      ];

      for (let m = 0; m < aaravMilestones.length; m++) {
        await prisma.clientStageHistory.create({
          data: {
            clientId: client.id,
            previousStage: m === 0 ? "CONFIRMED" : aaravMilestones[m - 1].stage,
            newStage: aaravMilestones[m].stage,
            changedBy: "Meera K.",
            notes: aaravMilestones[m].note,
            clientNote: `Stage milestone reached: ${aaravMilestones[m].stage.replace(/_/g, " ")}.`,
            createdAt: aaravMilestones[m].date,
          },
        });
      }
    } else {
      const currentIdx = stageOrder.indexOf(c.currentStage);
      const stagesToCreate = currentIdx >= 0 ? stageOrder.slice(0, currentIdx + 1) : ["CONFIRMED"];

      for (let sIdx = 0; sIdx < stagesToCreate.length; sIdx++) {
        const st = stagesToCreate[sIdx];
        const daysBack = (stagesToCreate.length - 1 - sIdx) * 3;
        const historyDate = new Date(c.planStartDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

        await prisma.clientStageHistory.create({
          data: {
            clientId: client.id,
            previousStage: sIdx === 0 ? "CONFIRMED" : stagesToCreate[sIdx - 1],
            newStage: st,
            changedBy: "Career Specialist",
            notes: `Internal transition note for ${st}`,
            clientNote: `Stage updated to ${st.replace(/_/g, " ")}. Your specialist is advancing your profile.`,
            createdAt: historyDate,
          },
        });
      }
    }

    // Payment record if paid
    if (c.amountPaid > 0) {
      await prisma.payment.create({
        data: {
          clientId: client.id,
          amount: c.amountPaid,
          paymentDate: c.planStartDate,
          paymentMethod: "UPI / Bank Transfer",
          status: c.balance === 0 ? "COMPLETED" : "PARTIAL",
          referenceNumber: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: "Service package payment confirmed",
        },
      });
    }

    // For Aarav Kumar, generate the exact applications from the mockup
    if (c.name === "Aarav Kumar") {
      const aaravApplications = [
        { company: "Pinecrest Software", role: "UI Engineer", loc: "Bengaluru", via: "Naukri", date: "2026-10-25T14:30:00Z", status: "APPLIED" },
        { company: "Lumen Cloud", role: "Frontend Engineer", loc: "Remote", via: "LinkedIn", date: "2026-10-25T11:00:00Z", status: "REPLIED" },
        { company: "Octave Analytics", role: "Software Engineer II", loc: "Hyderabad", via: "LinkedIn", date: "2026-10-24T16:20:00Z", status: "ASSESSMENT" },
        { company: "Harbor Systems", role: "React Developer", loc: "Pune", via: "Indeed", date: "2026-10-23T10:15:00Z", status: "APPLIED" },
        { company: "Kestrel Labs", role: "Full Stack Engineer", loc: "Bengaluru", via: "Indeed", date: "2026-10-22T09:40:00Z", status: "INTERVIEW" },
        { company: "Brightlane Systems", role: "React Developer", loc: "Chennai", via: "Naukri", date: "2026-10-19T15:30:00Z", status: "INTERVIEW" },
        { company: "Northwind Tech", role: "Frontend Engineer", loc: "Bengaluru", via: "LinkedIn", date: "2026-10-18T13:10:00Z", status: "INTERVIEW" },
        { company: "Quarry Digital", role: "Web Developer", loc: "Remote", via: "Naukri", date: "2026-10-15T11:45:00Z", status: "REPLIED" },
        { company: "Ardent Software", role: "Frontend Engineer", loc: "Bengaluru", via: "Indeed", date: "2026-10-12T16:00:00Z", status: "OFFER" },
        { company: "Silverline Apps", role: "UI Developer", loc: "Mumbai", via: "LinkedIn", date: "2026-10-12T09:30:00Z", status: "APPLIED" },
      ];

      for (const item of aaravApplications) {
        await prisma.application.create({
          data: {
            clientId: client.id,
            companyName: item.company,
            jobTitle: item.role,
            jobLocation: item.loc,
            portal: item.via,
            status: item.status,
            visibleToClient: true,
            applicationDate: new Date(item.date),
            jobPostingUrl: `https://www.linkedin.com/jobs/view/${Math.floor(3800000 + Math.random() * 50000)}`,
          },
        });
      }

      // Add remaining sample applications to hit total 248 and today 42:
      // 40 more for today
      for (let i = 0; i < 40; i++) {
        const appTime = new Date(todayStart.getTime() + (i + 2) * 8 * 60 * 1000);
        await prisma.application.create({
          data: {
            clientId: client.id,
            companyName: ["Razorpay", "Swiggy", "Zomato", "Cred", "PhonePe", "Flipkart", "Tekion", "Urban Company", "CleverTap", "Jio"][i % 10],
            jobTitle: "Frontend / React Engineer",
            jobLocation: "Bengaluru",
            portal: ["LinkedIn", "Naukri", "Indeed"][i % 3],
            status: "APPLIED",
            visibleToClient: true,
            applicationDate: appTime,
          },
        });
      }

      // Add historical applications to hit total 248:
      const remainingCount = 248 - 50;
      for (let i = 0; i < remainingCount; i++) {
        const daysAgo = Math.floor(Math.random() * 15) + 2;
        const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        // Distribute statuses: total assessment 14, interview 7, replied 52, offer 1
        let st = "APPLIED";
        if (i < 13) st = "ASSESSMENT";
        else if (i < 17) st = "INTERVIEW";
        else if (i < 55) st = "REPLIED";

        await prisma.application.create({
          data: {
            clientId: client.id,
            companyName: ["Amazon", "Google", "Microsoft", "TCS", "Infosys", "Wipro", "HCL", "Dell", "Oracle", "Cisco"][i % 10],
            jobTitle: "UI / Frontend Developer",
            jobLocation: "Bengaluru",
            portal: ["LinkedIn", "Naukri", "Indeed"][i % 3],
            status: st,
            visibleToClient: true,
            applicationDate: pastDate,
          },
        });
      }

      // Aarav Kumar's Upcoming Interviews from the mockup:
      // 1. Northwind Tech - Round 2 round · Tue, 11:00 AM (27 Oct)
      // 2. Brightlane Systems - HR round · Thu, 3:30 PM (29 Oct)
      // 3. Kestrel Labs - Managerial round · Mon, 10:00 AM (2 Nov)
      const aaravInterviews = [
        { company: "Northwind Tech", round: "Round 2 round", date: new Date("2026-10-27T11:00:00Z"), link: "https://meet.google.com/nwt-live" },
        { company: "Brightlane Systems", round: "HR round", date: new Date("2026-10-29T15:30:00Z"), link: "https://meet.google.com/bls-call" },
        { company: "Kestrel Labs", round: "Managerial round", date: new Date("2026-11-02T10:00:00Z"), link: "https://meet.google.com/ksl-meet" },
        { company: "Ardent Software", round: "Final Hiring Manager", date: new Date("2026-10-10T14:00:00Z"), link: "https://meet.google.com/ard-fin", status: "COMPLETED" },
        { company: "Quarry Digital", round: "Tech Screening", date: new Date("2026-10-14T11:00:00Z"), link: "https://meet.google.com/qrd-scr", status: "COMPLETED" },
        { company: "Lumen Cloud", round: "Culture Fit", date: new Date("2026-10-20T16:00:00Z"), link: "https://meet.google.com/lum-cul", status: "COMPLETED" },
        { company: "Octave Analytics", round: "Assessment Discussion", date: new Date("2026-10-24T15:00:00Z"), link: "https://meet.google.com/oct-dsc", status: "COMPLETED" },
      ];

      for (const iv of aaravInterviews) {
        await prisma.interview.create({
          data: {
            clientId: client.id,
            companyName: iv.company,
            round: iv.round,
            scheduledAt: iv.date,
            status: iv.status || "SCHEDULED",
            meetingLink: iv.link,
          },
        });
      }
    } else {
      // Generate applications for other clients
      const portals = ["LinkedIn", "Naukri", "Indeed", "Foundit", "Instahyre"];
      for (let i = 0; i < c.todayApps; i++) {
        const appTime = new Date(todayStart.getTime() + i * 8 * 60 * 1000);
        await prisma.application.create({
          data: {
            clientId: client.id,
            companyName: ["Zoho", "Freshworks", "Infosys", "TCS", "Accenture", "Swiggy", "Zomato", "PhonePe", "Flipkart", "Razorpay"][i % 10],
            jobTitle: c.targetRole,
            jobLocation: c.preferredLocation?.split("/")[0]?.trim() || "Bangalore",
            jobPostingUrl: `https://linkedin.com/jobs/view/${3900000 + i}`,
            applicationDate: appTime,
            status: i % 7 === 0 ? "ASSESSMENT" : i % 11 === 0 ? "INTERVIEW" : "APPLIED",
            visibleToClient: true,
            portal: portals[i % portals.length],
            lastStatusAt: appTime,
            notes: `Batch application #${i + 1}`,
          },
        });
      }

      const historicalNeeded = c.totalApps - c.todayApps;
      if (historicalNeeded > 0) {
        const sampleCount = Math.min(historicalNeeded, 30);
        for (let i = 0; i < sampleCount; i++) {
          const daysAgo = Math.floor(Math.random() * 30) + 1;
          const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          await prisma.application.create({
            data: {
              clientId: client.id,
              companyName: ["Amazon", "Microsoft", "Google", "Paytm", "Cred", "Delhivery", "Meesho", "Ola", "Wipro", "HCL"][i % 10],
              jobTitle: c.targetRole,
              jobLocation: c.preferredLocation || "Remote",
              jobPostingUrl: `https://linkedin.com/jobs/view/${3800000 + i}`,
              applicationDate: pastDate,
              status: i % 5 === 0 ? "INTERVIEW" : i % 3 === 0 ? "ASSESSMENT" : "APPLIED",
              visibleToClient: true,
              portal: portals[i % portals.length],
              lastStatusAt: pastDate,
              notes: `Auto-dispatched via JobAssist pipeline`,
            },
          });
        }
      }
    }

    // Portal access log
    await prisma.portalAccessLog.create({
      data: {
        clientId: client.id,
        action: "PORTAL_LOGIN",
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    });
  }

  // 3. Additional Interviews
  const interviewData = [
    { client: createdClients[1], company: "Zoho", round: "Round 1 - Technical", daysAhead: 1 },
    { client: createdClients[1], company: "Freshworks", round: "Round 2 - Live Coding", daysAhead: 3 },
    { client: createdClients[1], company: "PhonePe", round: "Screening Call", daysAhead: 4 },
    { client: createdClients[1], company: "Razorpay", round: "System Design", daysAhead: 6 },
    { client: createdClients[2], company: "Fractal Analytics", round: "SQL Assessment Discussion", daysAhead: 2 },
    { client: createdClients[2], company: "Mu Sigma", round: "Case Study Round", daysAhead: 5 },
    { client: createdClients[2], company: "LatentView", round: "Hiring Manager", daysAhead: 7 },
    { client: createdClients[2], company: "Tiger Analytics", round: "Technical Round 1", daysAhead: 8 },
  ];

  for (const item of interviewData) {
    const interviewDate = new Date(now.getTime() + item.daysAhead * 24 * 60 * 60 * 1000);
    await prisma.interview.create({
      data: {
        clientId: item.client.id,
        companyName: item.company,
        round: item.round,
        scheduledAt: interviewDate,
        status: "SCHEDULED",
        meetingLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`,
        notes: `Confirmed recruiter call with ${item.company}`,
      },
    });
  }

  // 4. Recruiter Inbox items
  const inboxItems = [
    {
      clientId: createdClients[1].id,
      recruiterOrCompany: "Zoho Talent",
      subject: "Online assessment - Frontend role",
      preview: "Please complete your frontend technical evaluation within 48 hours of receiving this link.",
      type: "ASSESSMENT",
      status: "UNREAD",
      receivedAt: new Date(now.getTime() - 25 * 60 * 1000),
    },
    {
      clientId: createdClients[1].id,
      recruiterOrCompany: "Freshworks HR",
      subject: "Interview schedule - Round 1",
      preview: "We have confirmed your technical interview round for tomorrow at 3:00 PM IST.",
      type: "INTERVIEW",
      status: "UNREAD",
      receivedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      clientId: createdClients[2].id,
      recruiterOrCompany: "TCS iON",
      subject: "Application update",
      preview: "Thank you for taking the time to apply. At this time we have decided to move ahead with other applicants.",
      type: "REJECTION",
      status: "READ",
      receivedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      clientId: createdClients[0].id,
      recruiterOrCompany: "Swiggy Careers",
      subject: "Thanks for applying",
      preview: "Your profile has been received for Frontend / UI Engineer and is currently under review by our team.",
      type: "ACKNOWLEDGED",
      status: "READ",
      receivedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
  ];

  for (const item of inboxItems) {
    await prisma.recruiterCommunication.create({
      data: item,
    });
  }

  // 5. Initial Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: "Interview scheduled",
        message: "Aarav Kumar has a Round 2 interview with Northwind Tech.",
        type: "SUCCESS",
      },
      {
        title: "Profile update",
        message: "Priya Raman submitted updated portfolio documents.",
        type: "INFO",
      },
      {
        title: "Target Achieved",
        message: "Rahul Menon's daily job application quota reached.",
        type: "SUCCESS",
      },
    ],
  });

  console.log("Database seeded successfully with exact PRD reference data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
