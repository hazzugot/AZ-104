import { z } from "zod";
import { ExamObjective, Difficulty, QuestionType, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { complete, extractJson } from "./client";
import {
  EXAM_QUESTION_SYSTEM,
  examQuestionUserPrompt,
} from "./prompts";
import { retrieveGroundingContext } from "./rag";
import { logger } from "../logger";

const GeneratedQuestion = z.object({
  type: z.nativeEnum(QuestionType),
  objective: z.nativeEnum(ExamObjective),
  difficulty: z.nativeEnum(Difficulty),
  stem: z.string().min(40),
  caseStudy: z.string().nullable().optional(),
  options: z
    .array(z.object({ id: z.string(), text: z.string().min(1) }))
    .min(2)
    .max(8),
  correctIds: z.array(z.string()).min(1),
  explanation: z.string().min(20),
  distractorRationale: z.record(z.string(), z.string()).optional().default({}),
  references: z
    .array(z.object({ title: z.string(), url: z.string().url() }))
    .optional()
    .default([]),
  tags: z.array(z.string()).optional().default([]),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestion>;

export interface GenerateOptions {
  objective: ExamObjective;
  difficulty?: Difficulty;
  type?: QuestionType;
  topic?: string;
  count?: number;
  moduleId?: string;
  /** When true, use Sonnet (smart) for higher-fidelity exam items. */
  highQuality?: boolean;
}

/**
 * Generates a batch of AZ-104 exam questions, validates them against the
 * schema, deduplicates by stem hash against the existing pool, and persists
 * approved items in NEEDS_REVIEW state for instructor sign-off.
 */
export async function generateExamQuestions(opts: GenerateOptions) {
  const count = Math.min(Math.max(opts.count ?? 5, 1), 20);
  const difficulty = opts.difficulty ?? Difficulty.MEDIUM;
  const type = opts.type ?? QuestionType.MULTIPLE_CHOICE;

  const grounding = await retrieveGroundingContext({
    objective: opts.objective,
    topic: opts.topic,
    maxChars: 4000,
  });

  const result = await complete({
    tier: opts.highQuality ? "smart" : "fast",
    system: EXAM_QUESTION_SYSTEM,
    cacheSystem: true,
    temperature: 0.6,
    maxTokens: 3500,
    kind: "exam_question",
    promptVersion: "exam_question_v1@1.0.0",
    messages: [
      {
        role: "user",
        content: examQuestionUserPrompt({
          objective: opts.objective,
          difficulty,
          type,
          topic: opts.topic,
          count,
          groundingContext: grounding,
        }),
      },
    ],
  });

  let parsed: unknown;
  try {
    parsed = extractJson(result.text);
  } catch (err) {
    logger.error({ err, raw: result.text.slice(0, 500) }, "exam JSON parse failed");
    throw new Error("Model returned invalid JSON");
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];
  const persisted = [];

  for (const raw of items) {
    const validated = GeneratedQuestion.safeParse(raw);
    if (!validated.success) {
      logger.warn({ issues: validated.error.issues }, "exam item failed schema");
      continue;
    }
    const q = validated.data;

    // Sanity check: every correctId must reference a real option.
    const optionIds = new Set(q.options.map((o) => o.id));
    if (!q.correctIds.every((c) => optionIds.has(c))) continue;

    // Deduplicate by normalised stem.
    const stemKey = q.stem.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 200);
    const existing = await prisma.examQuestion.findFirst({
      where: { stem: { startsWith: stemKey.slice(0, 80) } },
      select: { id: true },
    });
    if (existing) continue;

    const created = await prisma.examQuestion.create({
      data: {
        moduleId: opts.moduleId,
        objective: q.objective,
        type: q.type,
        difficulty: q.difficulty,
        stem: q.stem,
        caseStudy: q.caseStudy ?? null,
        options: q.options as unknown as Prisma.InputJsonValue,
        correctIds: q.correctIds as unknown as Prisma.InputJsonValue,
        explanation: q.explanation,
        distractorRationale: q.distractorRationale as unknown as Prisma.InputJsonValue,
        references: q.references as unknown as Prisma.InputJsonValue,
        tags: q.tags,
        source: "AI_GENERATED",
        reviewStatus: "NEEDS_REVIEW",
        promptVersion: "exam_question_v1@1.0.0",
      },
    });
    persisted.push(created);
  }

  return { generated: items.length, persisted: persisted.length, items: persisted };
}

/**
 * Builds a full practice exam by sampling questions per objective using
 * official AZ-104 weights. Falls back to AI generation for objectives short
 * on approved items.
 */
export async function buildExam(opts: {
  title: string;
  mode: "TIMED" | "STUDY" | "ADAPTIVE" | "WEAK_AREA" | "REVIEW";
  totalQuestions?: number;
  userId?: string;
}) {
  const total = opts.totalQuestions ?? 50;

  const weights: Record<ExamObjective, number> = {
    [ExamObjective.IDENTITIES_GOVERNANCE]: 0.225,
    [ExamObjective.STORAGE]: 0.175,
    [ExamObjective.COMPUTE]: 0.225,
    [ExamObjective.VIRTUAL_NETWORKING]: 0.175,
    [ExamObjective.MONITORING_BACKUP]: 0.125,
  };
  // Renormalise weights to sum to 1.
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(weights) as ExamObjective[]) weights[k] /= sum;

  // Weak-area mode: bias toward objectives where the user's mastery is lowest.
  if (opts.mode === "WEAK_AREA" && opts.userId) {
    const conf = await prisma.topicConfidence.findMany({
      where: { userId: opts.userId },
    });
    const masteryByObj = new Map(conf.map((c) => [c.objective, c.mastery]));
    let acc = 0;
    for (const k of Object.keys(weights) as ExamObjective[]) {
      const m = masteryByObj.get(k) ?? 0.3;
      weights[k] = 1 - m; // weaker -> more questions
      acc += weights[k];
    }
    for (const k of Object.keys(weights) as ExamObjective[]) weights[k] /= acc;
  }

  const exam = await prisma.exam.create({
    data: {
      title: opts.title,
      mode: opts.mode,
      durationMin: opts.mode === "TIMED" ? 120 : 0,
      objectiveWeights: weights as unknown as Prisma.InputJsonValue,
    },
  });

  let order = 0;
  for (const objective of Object.keys(weights) as ExamObjective[]) {
    const target = Math.round(weights[objective]! * total);
    const pool = await prisma.examQuestion.findMany({
      where: { objective, reviewStatus: "APPROVED" },
      take: target * 3,
      orderBy: { qualityScore: "desc" },
    });

    // Top up if the approved pool is too thin.
    let picks = pool.sort(() => Math.random() - 0.5).slice(0, target);
    if (picks.length < target) {
      const result = await generateExamQuestions({
        objective,
        count: target - picks.length,
        highQuality: true,
      });
      picks = picks.concat(result.items);
    }

    for (const q of picks) {
      await prisma.examItem.create({
        data: { examId: exam.id, questionId: q.id, orderIndex: order++ },
      });
    }
  }

  return exam;
}

/**
 * Scores a submitted exam attempt using the Microsoft scaled-score convention
 * (1-1000 with 700 to pass).
 */
export async function scoreAttempt(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      questionAttempts: { include: { question: true } },
      exam: true,
    },
  });
  if (!attempt) throw new Error("Attempt not found");

  const perObjective: Record<string, { correct: number; total: number }> = {};
  let correct = 0;
  for (const qa of attempt.questionAttempts) {
    const obj = qa.question.objective;
    perObjective[obj] ??= { correct: 0, total: 0 };
    perObjective[obj]!.total++;
    if (qa.isCorrect) {
      correct++;
      perObjective[obj]!.correct++;
    }
  }
  const total = attempt.questionAttempts.length || 1;
  const rawPercent = correct / total;
  // Linear map: 0%→1, 100%→1000. Microsoft uses an item-response-theory scale;
  // this is a faithful approximation for practice.
  const scaledScore = Math.round(1 + rawPercent * 999);
  const passed = scaledScore >= (attempt.exam.passingScore ?? 700);

  const perObjectivePct: Record<string, { correct: number; total: number; percent: number }> = {};
  for (const [k, v] of Object.entries(perObjective)) {
    perObjectivePct[k] = { ...v, percent: v.total ? v.correct / v.total : 0 };
  }

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      submittedAt: new Date(),
      scaledScore,
      rawPercent,
      passed,
      perObjective: perObjectivePct as unknown as Prisma.InputJsonValue,
      durationSec: attempt.submittedAt
        ? Math.floor((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
        : Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000),
    },
  });

  return { scaledScore, passed, rawPercent, perObjective: perObjectivePct };
}
