import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { enqueue } from "@/lib/queue/client";

const Body = z.object({
  moduleId: z.string().cuid(),
  sourceUrl: z.string().url().refine((u) => u.startsWith("https://learn.microsoft.com/"), {
    message: "URL must be on learn.microsoft.com",
  }),
});

export async function POST(req: NextRequest) {
  await requireRole(Role.ADMIN, Role.INSTRUCTOR);
  const body = Body.parse(await req.json());
  const job = await enqueue("scrape-module", body);
  return NextResponse.json({ jobId: job.id });
}
