import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const Body = z.object({
  questionId: z.string().cuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  edits: z
    .object({
      stem: z.string().optional(),
      explanation: z.string().optional(),
      qualityScore: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const reviewer = await requireRole(Role.ADMIN, Role.INSTRUCTOR);
  const body = Body.parse(await req.json());

  const updated = await prisma.examQuestion.update({
    where: { id: body.questionId },
    data: {
      reviewStatus: body.decision,
      stem: body.edits?.stem,
      explanation: body.edits?.explanation,
      qualityScore: body.edits?.qualityScore,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: reviewer.id,
      action: `question.${body.decision.toLowerCase()}`,
      target: body.questionId,
      meta: body.edits as never,
    },
  });

  return NextResponse.json({ id: updated.id, reviewStatus: updated.reviewStatus });
}
