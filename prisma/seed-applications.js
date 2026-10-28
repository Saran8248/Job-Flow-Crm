const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedApplications() {
  const staff = await prisma.staff.findFirst({
    where: { name: "Arun K" },
    include: { clients: true },
  });

  if (!staff || staff.clients.length === 0) {
    console.log("No clients found for Arun K");
    return;
  }

  const sampleProof =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  const companies = [
    { company: "Google", role: "Staff Software Engineer", portal: "LinkedIn" },
    { company: "Microsoft", role: "Senior Full Stack Engineer", portal: "LinkedIn" },
    { company: "Amazon", role: "Software Development Engineer II", portal: "Indeed" },
    { company: "Flipkart", role: "Lead Frontend Developer", portal: "Naukri" },
    { company: "Uber", role: "Backend Platform Engineer", portal: "LinkedIn" },
    { company: "Swiggy", role: "React Native Mobile Developer", portal: "Naukri" },
    { company: "Razorpay", role: "Full Stack Product Engineer", portal: "LinkedIn" },
    { company: "Zomato", role: "Senior Software Engineer", portal: "Indeed" },
    { company: "Cred", role: "Core Systems Engineer", portal: "LinkedIn" },
    { company: "PhonePe", role: "Senior Backend Engineer", portal: "Naukri" },
    { company: "Atlassian", role: "Senior React Developer", portal: "LinkedIn" },
    { company: "Adobe", role: "UI Architect", portal: "Indeed" },
    { company: "Salesforce", role: "Cloud Application Engineer", portal: "LinkedIn" },
    { company: "Oracle", role: "Principal Software Engineer", portal: "Indeed" },
    { company: "Stripe", role: "Payments Integration Engineer", portal: "LinkedIn" },
    { company: "InMobi", role: "AdTech Systems Developer", portal: "Naukri" },
    { company: "Freshworks", role: "Product Development Engineer", portal: "LinkedIn" },
    { company: "Zoho", role: "Platform Engineer", portal: "Indeed" },
    { company: "Paytm", role: "Fintech Backend Engineer", portal: "Naukri" },
    { company: "Infosys", role: "Senior Consultant Architect", portal: "Naukri" },
  ];

  const now = new Date();

  // Clear previous applications for clean state
  await prisma.application.deleteMany({});

  for (const client of staff.clients) {
    let count = 12;
    if (client.name.includes("Priya")) count = 20;
    else if (client.name.includes("Saran")) count = 18;
    else if (client.name.includes("Aarav")) count = 12;

    for (let i = 0; i < count; i++) {
      const comp = companies[i % companies.length];
      const appMinutesAgo = i * 22 + 15;
      const appDate = new Date(now.getTime() - appMinutesAgo * 60 * 1000);

      await prisma.application.create({
        data: {
          clientId: client.id,
          companyName: comp.company,
          jobTitle: client.targetRole || comp.role,
          portal: comp.portal,
          status: i === 0 ? "INTERVIEW" : i < 4 ? "REVIEWING" : "APPLIED",
          proofImageUrl: sampleProof,
          notes:
            "Application submitted via external portal with verified resume & candidate profile.",
          applicationDate: appDate,
        },
      });
    }
  }

  console.log("Successfully seeded 50 sample applications for Staff Dashboard!");
}

seedApplications()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
