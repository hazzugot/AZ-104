/**
 * BullMQ workers. Run as a separate process: `pnpm worker`.
 *
 * Each handler is intentionally thin — heavy logic lives in lib/{ai,scraper,...}
 * so workers and HTTP routes share the same code paths.
 */
import { Worker } from "bullmq";
import { connection } from "./client";
import { logger } from "../logger";
import { runScrape } from "../scraper/microsoft-learn";
import { ingestTranscript } from "../transcripts/ingest";
import {
  summarizeTranscript,
  classifyExamFocus,
  generateFlashcardsForUnit,
} from "../ai/summarizer";
import { generateExamQuestions, buildExam } from "../ai/exam-generator";
import { recomputeConfidence } from "../adaptive";
import { buildStudyPlan } from "../study-plan";
import { embedText } from "../ai/rag";
import { prisma } from "../db";

const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 4);

new Worker(
  "scrape-module",
  async (job) => {
    const { moduleId, sourceUrl } = job.data as { moduleId: string; sourceUrl: string };
    return runScrape(moduleId, sourceUrl);
  },
  { connection, concurrency: 2 },
);

new Worker(
  "ingest-transcript",
  async (job) => ingestTranscript(job.data),
  { connection, concurrency: 4 },
);

new Worker(
  "summarize-transcript",
  async (job) => summarizeTranscript((job.data as { transcriptId: string }).transcriptId),
  { connection, concurrency: 6 },
);

new Worker(
  "embed-content-block",
  async (job) => {
    const { blockId } = job.data as { blockId: string };
    const block = await prisma.contentBlock.findUnique({ where: { id: blockId } });
    if (!block?.text) return;
    const v = await embedText(block.text);
    if (!v) return;
    const lit = `[${v.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "ContentBlock" SET embedding = $1::vector WHERE id = $2`,
      lit,
      blockId,
    );
  },
  { connection, concurrency },
);

new Worker(
  "classify-exam-focus",
  async (job) => classifyExamFocus((job.data as { unitId: string }).unitId),
  { connection, concurrency: 4 },
);

new Worker(
  "generate-flashcards",
  async (job) => {
    const { unitId, count } = job.data as { unitId: string; count?: number };
    return generateFlashcardsForUnit(unitId, count);
  },
  { connection, concurrency: 3 },
);

new Worker(
  "generate-exam",
  async (job) => {
    const data = job.data as Parameters<typeof generateExamQuestions>[0] | { build: true; title: string; mode: "TIMED" | "STUDY" | "ADAPTIVE" | "WEAK_AREA" | "REVIEW"; userId?: string };
    if ("build" in data) return buildExam(data);
    return generateExamQuestions(data);
  },
  { connection, concurrency: 2 },
);

new Worker(
  "recompute-confidence",
  async (job) => recomputeConfidence((job.data as { userId: string }).userId),
  { connection, concurrency },
);

new Worker(
  "build-study-plan",
  async (job) => buildStudyPlan(job.data as { userId: string; examDate?: Date; weeklyHours?: number }),
  { connection, concurrency: 2 },
);

logger.info("workers up");
