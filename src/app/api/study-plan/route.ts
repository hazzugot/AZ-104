import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/rbac";
import { buildStudyPlan } from "@/lib/study-plan";

const Body = z.object({
  examDate: z.string().optional(),
  weeklyHours: z.number().int().min(1).max(40).optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = Body.parse(await req.json());
  const plan = await buildStudyPlan({
    userId: user.id,
    examDate: body.examDate ? new Date(body.examDate) : undefined,
    weeklyHours: body.weeklyHours,
  });
  return NextResponse.json({ id: plan.id });
}
