import { ExamObjective, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { recomputeConfidence } from "./adaptive";

export interface StudyPlanItem {
  date: string; // ISO date
  type: "lesson" | "flashcards" | "practice_exam" | "lab" | "review";
  refId?: string;
  title: string;
  durationMin: number;
  objective?: ExamObjective;
}

/**
 * Builds a daily study plan from now until the exam date, biased toward
 * the learner's weakest objectives.
 */
export async function buildStudyPlan(input: {
  userId: string;
  examDate?: Date;
  weeklyHours?: number;
}) {
  const weeklyHours = input.weeklyHours ?? 8;
  const minutesPerDay = (weeklyHours * 60) / 7;
  const examDate = input.examDate ?? new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const daysUntil = Math.max(
    7,
    Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  const confidence = await recomputeConfidence(input.userId);
  const masteryByObj = new Map(confidence.map((c) => [c.objective, c.mastery]));

  // Weight each objective by gap-to-mastery; default to AZ-104 official weight.
  const officialWeights: Record<ExamObjective, number> = {
    IDENTITIES_GOVERNANCE: 0.225,
    STORAGE: 0.175,
    COMPUTE: 0.225,
    VIRTUAL_NETWORKING: 0.175,
    MONITORING_BACKUP: 0.125,
  };
  const weights: Record<string, number> = {};
  let sum = 0;
  for (const obj of Object.keys(officialWeights) as ExamObjective[]) {
    const gap = 1 - (masteryByObj.get(obj) ?? 0.3);
    weights[obj] = officialWeights[obj] * (0.4 + gap);
    sum += weights[obj]!;
  }
  for (const k of Object.keys(weights)) weights[k] /= sum;

  // Pull all units & modules ordered by curriculum.
  const modules = await prisma.module.findMany({
    include: { units: { orderBy: { orderIndex: "asc" } } },
    orderBy: { orderIndex: "asc" },
  });

  // Round-robin units per objective, day by day.
  const itemsByObj: Record<string, { unitId: string; title: string }[]> = {};
  for (const m of modules) {
    itemsByObj[m.objective] ??= [];
    for (const u of m.units) {
      itemsByObj[m.objective]!.push({ unitId: u.id, title: `${m.title} → ${u.title}` });
    }
  }

  const plan: StudyPlanItem[] = [];
  for (let d = 0; d < daysUntil; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    let remainingMin = minutesPerDay;

    // Mix-in: one practice exam every 7 days starting day 7.
    if (d > 0 && d % 7 === 0) {
      plan.push({
        date: date.toISOString().slice(0, 10),
        type: "practice_exam",
        title: "Weekly timed practice exam",
        durationMin: 90,
      });
      remainingMin -= 30; // we count practice exams separately from daily target
    }

    while (remainingMin > 10) {
      const obj = pickWeighted(weights);
      const queue = itemsByObj[obj] ?? [];
      const next = queue.shift();
      if (!next) {
        delete weights[obj];
        if (!Object.keys(weights).length) break;
        continue;
      }
      plan.push({
        date: date.toISOString().slice(0, 10),
        type: "lesson",
        refId: next.unitId,
        title: next.title,
        durationMin: 25,
        objective: obj as ExamObjective,
      });
      // Pair each lesson with a flashcard drill.
      plan.push({
        date: date.toISOString().slice(0, 10),
        type: "flashcards",
        title: `Flashcards: ${next.title}`,
        durationMin: 10,
        objective: obj as ExamObjective,
      });
      remainingMin -= 35;
    }
  }

  // Final-week intensive review.
  for (let d = Math.max(0, daysUntil - 5); d < daysUntil; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    plan.push({
      date: date.toISOString().slice(0, 10),
      type: "review",
      title: "Spaced repetition + weak-area drill",
      durationMin: 45,
    });
  }

  return prisma.studyPlan.upsert({
    where: { id: (await activePlanId(input.userId)) ?? "__none__" },
    create: {
      userId: input.userId,
      examDate,
      weeklyHours,
      items: plan as unknown as Prisma.InputJsonValue,
      active: true,
    },
    update: {
      examDate,
      weeklyHours,
      items: plan as unknown as Prisma.InputJsonValue,
    },
  });
}

async function activePlanId(userId: string): Promise<string | null> {
  const p = await prisma.studyPlan.findFirst({
    where: { userId, active: true },
    select: { id: true },
  });
  return p?.id ?? null;
}

function pickWeighted(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const sum = entries.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * sum;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[0]![0];
}
