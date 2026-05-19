import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

export async function POST() {
  const user = await requireUser();
  const thread = await prisma.tutorThread.create({
    data: { userId: user.id, title: "New tutor thread" },
  });
  return NextResponse.json({ threadId: thread.id });
}
