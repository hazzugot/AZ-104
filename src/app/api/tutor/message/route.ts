import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { tutorTurn } from "@/lib/ai/tutor";

const Body = z.object({
  threadId: z.string().cuid(),
  message: z.string().min(1).max(4000),
  unitId: z.string().cuid().optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const rl = await rateLimit(`tutor:${user.id}`, 60, 60);
  if (!rl.ok) return new Response("rate_limited", { status: 429 });

  const body = Body.parse(await req.json());

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of tutorTurn({
          threadId: body.threadId,
          userId: user.id,
          message: body.message,
          unitId: body.unitId,
        })) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
