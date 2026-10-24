import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
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

  console.log("Created staff members");

  // 2. Create Clients with exact reference data
  const clientsData = [
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
    {
      name: "Sneha Iyer",
      email: "sneha.careershp@gmail.com",
      phone: "+91 97112 34567",
      targetRole: "HR Executive",
      preferredLocation: "Mumbai / Chennai",
      experienceLevel: "1 Year",
      skills: "Talent Acquisition, HR Operations, Onboarding",
      currentStage: "CONFIRMED",
      paymentStatus: "PENDING",
      assignedStaffId: arun.id,
      totalFee: 10000,
      amountPaid: 0,
      balance: 10000,
      planDurationMonths: 1,
      planStartDate: new Date("2026-10-24"),
      planEndDate: new Date("2026-11-25"),
      dailyTarget: 60,
      totalApps: 0,
      todayApps: 0,
    },
    {
      name: "Karthik Subramanian",
      email: "karthik.svep@gmail.com",
      phone: "+91 99001 88776",
      targetRole: "Backend Engineer",
      preferredLocation: "Bangalore",
      experienceLevel: "4 Years",
      skills: "Node.js, Go, PostgreSQL, Redis, Docker, AWS",
      currentStage: "DOCUMENTS_APPROVED",
      paymentStatus: "PAID",
      assignedStaffId: meena.id,
      totalFee: 25000,
      amountPaid: 25000,
      balance: 0,
      planDurationMonths: 3,
      planStartDate: new Date("2026-10-14"),
      planEndDate: new Date("2027-01-14"),
      dailyTarget: 60,
      totalApps: 0,
      todayApps: 0,
    },
    {
      name: "Anjali Nair",
      email: "anjalinair.hp@gmail.com",
      phone: "+91 96554 11223",
      targetRole: "UI/UX Designer",
      preferredLocation: "Kochi / Remote",
      experienceLevel: "2 Years",
      skills: "Figma, User Research, Wireframing, Design Systems",
      currentStage: "PORTAL_SETUP",
      paymentStatus: "PAID",
      assignedStaffId: divya.id,
      totalFee: 18000,
      amountPaid: 18000,
      balance: 0,
      planDurationMonths: 2,
      planStartDate: new Date("2026-10-17"),
      planEndDate: new Date("2026-12-17"),
      dailyTarget: 50,
      totalApps: 8,
      todayApps: 6,
    },
    {
      name: "Vignesh Kumar",
      email: "vigneshj_dev@gmail.com",
      phone: "+91 91234 56789",
      targetRole: "QA Engineer",
      preferredLocation: "Chennai",
      experienceLevel: "3 Years",
      skills: "Selenium, Cypress, Jest, API Testing, Postman",
      currentStage: "REPORT",
      paymentStatus: "PAID",
      assignedStaffId: meena.id,
      totalFee: 12000,
      amountPaid: 12000,
      balance: 0,
      planDurationMonths: 1,
      planStartDate: new Date("2026-09-24"),
      planEndDate: new Date("2026-10-24"),
      dailyTarget: 60,
      totalApps: 1710,
      todayApps: 57,
    },
    {
      name: "Deepa Lakshmi",
      email: "deepa.lg@gmail.com",
      phone: "+91 94433 99881",
      targetRole: "Business Analyst",
      preferredLocation: "Bangalore / Remote",
      experienceLevel: "5 Years",
      skills: "Agile, JIRA, Business Requirements, Data Modeling",
      currentStage: "DETAILS_COLLECTED",
      paymentStatus: "PAID",
      assignedStaffId: arun.id,
      totalFee: 20000,
      amountPaid: 20000,
      balance: 0,
      planDurationMonths: 2,
      planStartDate: new Date("2026-11-21"),
      planEndDate: new Date("2027-01-21"),
      dailyTarget: 60,
      totalApps: 0,
      todayApps: 0,
    },
  ];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

  const createdClients = [];

  for (const c of clientsData) {
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
      },
    });
    createdClients.push(client);

    // Initial stage history
    await prisma.clientStageHistory.create({
      data: {
        clientId: client.id,
        previousStage: "CONFIRMED",
        newStage: c.currentStage,
        changedBy: "System Setup",
        notes: "Initial client onboarding stage",
      },
    });

    // Payment record if paid
    if (c.amountPaid > 0) {
      await prisma.payment.create({
        data: {
          clientId: client.id,
          amount: c.amountPaid,
          paymentDate: c.planStartDate,
          paymentMethod: "UPI / Bank Transfer",
          status: "COMPLETED",
          referenceNumber: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: "Service package payment confirmed",
        },
      });
    }

    // Generate applications
    // Today's applications
    for (let i = 0; i < c.todayApps; i++) {
      const appTime = new Date(todayStart.getTime() + i * 8 * 60 * 1000); // spread through today
      await prisma.application.create({
        data: {
          clientId: client.id,
          companyName: ["Zoho", "Freshworks", "Infosys", "TCS", "Accenture", "Swiggy", "Zomato", "PhonePe", "Flipkart", "Razorpay"][i % 10],
          jobTitle: c.targetRole,
          jobLocation: c.preferredLocation?.split("/")[0]?.trim() || "Bangalore",
          jobPostingUrl: `https://linkedin.com/jobs/view/${3900000 + i}`,
          applicationDate: appTime,
          status: i % 7 === 0 ? "ASSESSMENT" : i % 11 === 0 ? "INTERVIEW" : "APPLIED",
          notes: `Batch application #${i + 1}`,
        },
      });
    }

    // Historical applications before today to match totalApps
    const historicalNeeded = c.totalApps - c.todayApps;
    if (historicalNeeded > 0) {
      // Create representative sample application records
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
            notes: `Auto-dispatched via JobAssist pipeline`,
          },
        });
      }
    }
  }

  // 3. Create Interviews to hit "Interviews secured: 18"
  // Spread across clients
  const interviewData = [
    { client: createdClients[0], company: "Zoho", round: "Round 1 - Technical", daysAhead: 1 },
    { client: createdClients[0], company: "Freshworks", round: "Round 2 - Live Coding", daysAhead: 3 },
    { client: createdClients[0], company: "PhonePe", round: "Screening Call", daysAhead: 4 },
    { client: createdClients[0], company: "Razorpay", round: "System Design", daysAhead: 6 },
    { client: createdClients[1], company: "Fractal Analytics", round: "SQL Assessment Discussion", daysAhead: 2 },
    { client: createdClients[1], company: "Mu Sigma", round: "Case Study Round", daysAhead: 5 },
    { client: createdClients[1], company: "LatentView", round: "Hiring Manager", daysAhead: 7 },
    { client: createdClients[1], company: "Tiger Analytics", round: "Technical Round 1", daysAhead: 8 },
    { client: createdClients[4], company: "Swiggy", round: "Portfolio Walkthrough", daysAhead: 2 },
    { client: createdClients[4], company: "Urban Company", round: "Design Challenge Review", daysAhead: 4 },
    { client: createdClients[5], company: "Qualitest", round: "Automation Round", daysAhead: 1 },
    { client: createdClients[5], company: "Cigniti", round: "Managerial Round", daysAhead: 3 },
    { client: createdClients[5], company: "Epam", round: "Framework Discussion", daysAhead: 5 },
    { client: createdClients[0], company: "Tekion", round: "Architect Interview", daysAhead: 9 },
    { client: createdClients[1], company: "Nielsen", round: "Domain Interview", daysAhead: 10 },
    { client: createdClients[4], company: "CleverTap", round: "App Critique", daysAhead: 11 },
    { client: createdClients[5], company: "Cognizant", round: "Client Round", daysAhead: 6 },
    { client: createdClients[0], company: "JioCinema", round: "Staff Engineer Chat", daysAhead: 12 },
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

  // 4. Create Recruiter Inbox items exactly as shown in screenshot:
  // - Zoho Talent: Online assessment - Frontend role | Assessment
  // - Freshworks HR: Interview schedule - Round 1 | Interview
  // - TCS iON: Application update | Rejection
  // - Swiggy Careers: Thanks for applying | Acknowledged
  const inboxItems = [
    {
      clientId: createdClients[0].id,
      recruiterOrCompany: "Zoho Talent",
      subject: "Online assessment - Frontend role",
      preview: "Please complete your frontend technical evaluation within 48 hours of receiving this link.",
      type: "ASSESSMENT",
      status: "UNREAD",
      receivedAt: new Date(now.getTime() - 25 * 60 * 1000), // 25 mins ago
    },
    {
      clientId: createdClients[0].id,
      recruiterOrCompany: "Freshworks HR",
      subject: "Interview schedule - Round 1",
      preview: "We have confirmed your technical interview round for tomorrow at 3:00 PM IST.",
      type: "INTERVIEW",
      status: "UNREAD",
      receivedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      clientId: createdClients[1].id,
      recruiterOrCompany: "TCS iON",
      subject: "Application update",
      preview: "Thank you for taking the time to apply. At this time we have decided to move ahead with other applicants.",
      type: "REJECTION",
      status: "READ",
      receivedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      clientId: createdClients[4].id,
      recruiterOrCompany: "Swiggy Careers",
      subject: "Thanks for applying",
      preview: "Your profile has been received for UI/UX Designer and is currently under review by our team.",
      type: "ACKNOWLEDGED",
      status: "READ",
      receivedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
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
        message: "Priya Raman has a Round 1 Technical interview with Freshworks HR.",
        type: "SUCCESS",
      },
      {
        title: "Renewal reminder",
        message: "Vignesh Kumar's QA Engineer plan expires today (2026-10-24).",
        type: "WARNING",
      },
      {
        title: "Payment pending",
        message: "Sneha Iyer's service plan has an outstanding balance of ₹10,000.",
        type: "INFO",
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
