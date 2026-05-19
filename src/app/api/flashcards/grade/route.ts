import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/rbac";
import { gradeFlashcard } from "@/lib/spaced-repetition";

const Body = z.object({
  flashcardId: z.string().cuid(),
  grade: z.number().int().min(0).max(5),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = Body.parse(await req.json());
  const review = await gradeFlashcard(user.id, body.flashcardId, body.grade);
  return NextResponse.json({
    dueAt: review.dueAt,
    intervalDays: review.intervalDays,
    easeFactor: review.easeFactor,
  });
}
