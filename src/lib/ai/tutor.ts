import { prisma } from "../db";
import { stream } from "./client";
import { TUTOR_SYSTEM } from "./prompts";
import { retrieveGroundingContext } from "./rag";

export interface TutorTurnInput {
  threadId: string;
  userId: string;
  message: string;
  unitId?: string;
}

/**
 * Runs one tutor turn with streaming. Pulls thread history, anchors with
 * RAG context (current unit + semantically relevant blocks), and persists
 * both sides of the exchange.
 */
export async function* tutorTurn(input: TutorTurnInput): AsyncGenerator<string> {
  const thread = await prisma.tutorThread.findFirst({
    where: { id: input.threadId, userId: input.userId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
  });
  if (!thread) throw new Error("Thread not found");

  // Persist the user message first so the UI can render history on reload.
  await prisma.tutorMessage.create({
    data: { threadId: thread.id, role: "USER", content: input.message },
  });

  // Pull weak-area + per-unit context.
  const grounding = await retrieveGroundingContext({
    unitId: input.unitId,
    topic: input.message,
    k: 5,
    maxChars: 3500,
  });

  const weakAreas = await prisma.topicConfidence.findMany({
    where: { userId: input.userId, mastery: { lt: 0.5 } },
    select: { objective: true, mastery: true },
  });
  const weakSummary =
    weakAreas.length > 0
      ? `Learner weak areas (mastery <0.5): ${weakAreas
          .map((w) => `${w.objective} (${w.mastery.toFixed(2)})`)
          .join(", ")}`
      : "";

  const systemWithContext = [
    TUTOR_SYSTEM,
    weakSummary,
    grounding ? `Grounding context from Microsoft Learn:\n${grounding}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const history = thread.messages
    .filter((m) => m.role !== "SYSTEM")
    .map((m) => ({
      role: (m.role.toLowerCase() === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));
  history.push({ role: "user", content: input.message });

  let assembled = "";
  for await (const delta of stream({
    tier: "smart",
    system: systemWithContext,
    cacheSystem: true,
    temperature: 0.5,
    maxTokens: 1500,
    kind: "tutor_reply",
    messages: history,
  })) {
    assembled += delta;
    yield delta;
  }

  await prisma.tutorMessage.create({
    data: { threadId: thread.id, role: "ASSISTANT", content: assembled },
  });
  await prisma.tutorThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });
}
