import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { bumpStreak } from "@/lib/adaptive";

const Body = z.object({
  unitId: z.string().cuid(),
  percentRead: z.number().min(0).max(1),
  timeSpentSec: z.number().int().nonnegative(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "MASTERED"]).optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = Body.parse(await req.json());

  const status = body.status ?? (body.percentRead >= 0.95 ? "COMPLETED" : "IN_PROGRESS");

  const progress = await prisma.unitProgress.upsert({
    where: { userId_unitId: { userId: user.id, unitId: body.unitId } },
    create: {
      userId: user.id,
      unitId: body.unitId,
      percentRead: body.percentRead,
      timeSpentSec: body.timeSpentSec,
      status,
      lastViewedAt: new Date(),
    },
    update: {
      percentRead: Math.max(body.percentRead, 0),
      timeSpentSec: { increment: body.timeSpentSec },
      status,
      lastViewedAt: new Date(),
    },
  });
  await bumpStreak(user.id);
  return NextResponse.json(progress);
}
