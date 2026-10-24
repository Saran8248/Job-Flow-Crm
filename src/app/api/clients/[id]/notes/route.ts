import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const notes = await prisma.clientNote.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch notes", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { content, authorName = "Staff" } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Note content cannot be empty" },
        { status: 400 }
      );
    }

    const note = await prisma.clientNote.create({
      data: {
        clientId: id,
        content: content.trim(),
        authorName,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create note", details: error.message },
      { status: 500 }
    );
  }
}
