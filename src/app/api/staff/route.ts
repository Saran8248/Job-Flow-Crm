import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
      },
    });
    return NextResponse.json({ staff });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch staff list", details: error.message },
      { status: 500 }
    );
  }
}
