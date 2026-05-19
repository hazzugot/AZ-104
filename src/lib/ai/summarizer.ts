import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { complete, extractJson } from "./client";
import {
  SUMMARIZE_TRANSCRIPT_SYSTEM,
  summarizeTranscriptUserPrompt,
  EXAM_FOCUS_CLASSIFIER_SYSTEM,
  FLASHCARD_SYSTEM,
} from "./prompts";
import { logger } from "../logger";

const TranscriptSummary = z.object({
  summary: z.string(),
  takeaways: z.array(z.string()),
  examHints: z.array(z.string()),
  glossary: z.array(z.object({ term: z.string(), definition: z.string() })),
  commandReferences: z
    .array(
      z.object({
        tool: z.enum(["az", "powershell", "bicep", "terraform"]),
        snippet: z.string(),
        purpose: z.string(),
      }),
    )
    .optional()
    .default([]),
});

/**
 * Cleans + summarises a transcript record. Idempotent: re-running on a
 * COMPLETED row just overwrites the derived fields.
 */
export async function summarizeTranscript(transcriptId: string) {
  const t = await prisma.transcript.findUnique({
    where: { id: transcriptId },
    include: { unit: true },
  });
  if (!t) throw new Error("Transcript not found");

  await prisma.transcript.update({
    where: { id: transcriptId },
    data: { status: "PROCESSING" },
  });

  const cleaned = stripFiller(t.rawText);

  try {
    const result = await complete({
      tier: "fast",
      system: SUMMARIZE_TRANSCRIPT_SYSTEM,
      cacheSystem: true,
      temperature: 0.3,
      maxTokens: 2000,
      kind: "transcript_summary",
      refTable: "Transcript",
      refId: t.id,
      messages: [
        {
          role: "user",
          content: summarizeTranscriptUserPrompt(cleaned, t.unit?.title),
        },
      ],
    });
    const parsed = TranscriptSummary.parse(extractJson(result.text));
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        cleanedText: cleaned,
        summary: parsed.summary,
        takeaways: parsed as unknown as Prisma.InputJsonValue,
        status: "COMPLETED",
      },
    });
    return parsed;
  } catch (err) {
    logger.error({ err, transcriptId }, "transcript summarization failed");
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { status: "FAILED" },
    });
    throw err;
  }
}

/**
 * Common spoken filler that adds no learning value. Kept conservative —
 * we never want to drop technical terminology.
 */
const FILLER = [
  /\b(um|uh|er|ah|like)\b/gi,
  /\b(you know|kind of|sort of)\b/gi,
  /\bbasically\b/gi,
  /\bso,?\s+/gi,
  /\s{2,}/g,
];

export function stripFiller(text: string): string {
  let out = text;
  for (const re of FILLER) out = out.replace(re, " ");
  return out.replace(/\s+/g, " ").trim();
}

/**
 * AI-driven exam focus classification.
 * Marks units that are high-probability AZ-104 exam content for visual flagging.
 */
export async function classifyExamFocus(unitId: string) {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { module: true, blocks: { orderBy: { orderIndex: "asc" }, take: 30 } },
  });
  if (!unit) throw new Error("Unit not found");

  const corpus = unit.blocks
    .map((b) => b.text)
    .filter(Boolean)
    .join("\n")
    .slice(0, 6000);

  const result = await complete({
    tier: "fast",
    system: EXAM_FOCUS_CLASSIFIER_SYSTEM,
    kind: "exam_focus_classify",
    refTable: "Unit",
    refId: unit.id,
    temperature: 0.2,
    maxTokens: 800,
    messages: [
      {
        role: "user",
        content: `Module: ${unit.module.title}\nUnit: ${unit.title}\n\nContent:\n${corpus}\n\nClassify per the schema.`,
      },
    ],
  });

  const parsed = extractJson<{
    likelyOnExam: boolean;
    likelyExamScore: number;
    reasoning: string;
    examTraps: string[];
    memorize: string[];
  }>(result.text);

  await prisma.unit.update({
    where: { id: unit.id },
    data: {
      likelyOnExam: parsed.likelyOnExam,
      likelyExamScore: parsed.likelyExamScore,
      commonMistakes: parsed.examTraps.join("\n• "),
      examTips: parsed.memorize.join("\n• "),
    },
  });

  return parsed;
}

const FlashcardBatch = z.array(
  z.object({
    front: z.string(),
    back: z.string(),
    mnemonic: z.string().optional(),
    category: z.string().optional(),
    difficulty: z.number().min(1).max(5).optional(),
  }),
);

/**
 * Generates flashcards for a unit by extracting atomic facts from its content.
 */
export async function generateFlashcardsForUnit(unitId: string, count = 8) {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { module: true, blocks: { orderBy: { orderIndex: "asc" }, take: 40 } },
  });
  if (!unit) throw new Error("Unit not found");

  const body = unit.blocks
    .map((b) => b.text)
    .filter(Boolean)
    .join("\n")
    .slice(0, 5000);

  const result = await complete({
    tier: "fast",
    system: FLASHCARD_SYSTEM,
    kind: "flashcard_generation",
    refTable: "Unit",
    refId: unit.id,
    temperature: 0.4,
    maxTokens: 1800,
    messages: [
      {
        role: "user",
        content: `Generate ${count} flashcards for AZ-104 learners studying:\nModule: ${unit.module.title}\nUnit: ${unit.title}\n\nSource material:\n${body}\n\nReturn a JSON array.`,
      },
    ],
  });

  const cards = FlashcardBatch.parse(extractJson(result.text));
  const created = await prisma.$transaction(
    cards.map((c) =>
      prisma.flashcard.create({
        data: {
          unitId: unit.id,
          moduleId: unit.moduleId,
          front: c.front,
          back: c.back,
          mnemonic: c.mnemonic,
          category: c.category ?? unit.module.title,
          difficulty: c.difficulty ?? 2,
          source: "AI_GENERATED",
        },
      }),
    ),
  );
  return created;
}
