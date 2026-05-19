import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { scoreAttempt } from "@/lib/ai/exam-generator";
import { enqueue } from "@/lib/queue/client";
import { bumpStreak } from "@/lib/adaptive";

const Body = z.object({
  attemptId: z.string().cuid(),
  answers: z.record(z.string(), z.array(z.string())),
  confidence: z.record(z.string(), z.number().int().min(1).max(5)).optional().default({}),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = Body.parse(await req.json());

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: body.attemptId },
    include: { exam: { include: { items: true } } },
  });
  if (!attempt || attempt.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  for (const item of attempt.exam.items) {
    const q = await prisma.examQuestion.findUnique({ where: { id: item.questionId } });
    if (!q) continue;
    const selected = body.answers[item.questionId] ?? [];
    const correct = q.correctIds as string[];
    const isCorrect =
      selected.length === correct.length && selected.every((s) => correct.includes(s));
    await prisma.questionAttempt.create({
      data: {
        userId: user.id,
        attemptId: attempt.id,
        questionId: q.id,
        selectedIds: selected,
        isCorrect,
        confidence: body.confidence[item.questionId],
      },
    });
  }

  const result = await scoreAttempt(attempt.id);

  // Fire-and-forget downstream updates.
  await enqueue("recompute-confidence", { userId: user.id });
  await bumpStreak(user.id);

  return NextResponse.json(result);
}
