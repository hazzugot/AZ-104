import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

const Body = z.object({ examId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const { examId } = Body.parse(await req.json());
  const attempt = await prisma.examAttempt.create({
    data: { userId: user.id, examId },
  });
  return NextResponse.json({ attemptId: attempt.id });
}
