import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCandidateAuth } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCandidateAuth();
  if (auth.error || !auth.client) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const client = await prisma.client.findUnique({
    where: { id: auth.client.id },
    select: {
      id: true,
      name: true,
      email: true,
      targetRole: true,
      currentStage: true,
      portalEnabled: true,
      staff: {
        select: {
          name: true,
          role: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ candidate: client });
}
