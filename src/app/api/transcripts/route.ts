import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { enqueue } from "@/lib/queue/client";

const Body = z.object({
  sourceUrl: z.string().url(),
  rawVtt: z.string().min(50),
  unitId: z.string().cuid().optional(),
  videoTitle: z.string().optional(),
  language: z.string().optional(),
});

export async function POST(req: NextRequest) {
  await requireRole(Role.ADMIN, Role.INSTRUCTOR);
  const body = Body.parse(await req.json());
  const job = await enqueue("ingest-transcript", body);
  return NextResponse.json({ jobId: job.id });
}
