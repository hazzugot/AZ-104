/**
 * Adaptive learning engine.
 *
 * Tracks per-objective mastery via an exponentially-weighted moving average
 * over recent question performance, decayed daily. Surfaces:
 *   - Weak topics (mastery < 0.5) for remediation
 *   - Next recommended units (lowest-mastery objective, untouched units first)
 *   - Streak maintenance
 */
import { ExamObjective } from "@prisma/client";
import { prisma } from "./db";

const RECENT_WINDOW = 50;
const DECAY_PER_DAY = 0.02; // mastery decays 2%/day without reinforcement
const NEW_WEIGHT = 0.25;     // EWMA mixing factor

export async function recomputeConfidence(userId: string) {
  const objectives = Object.values(ExamObjective) as ExamObjective[];
  const updates = [];

  for (const objective of objectives) {
    const recent = await prisma.questionAttempt.findMany({
      where: { userId, question: { objective } },
      orderBy: { createdAt: "desc" },
      take: RECENT_WINDOW,
      select: { isCorrect: true, createdAt: true, confidence: true },
    });
    if (!recent.length) continue;

    const accuracy = recent.filter((r) => r.isCorrect).length / recent.length;
    const selfReport =
      recent.filter((r) => r.confidence != null).reduce((a, r) => a + (r.confidence ?? 0), 0) /
        (recent.filter((r) => r.confidence != null).length || 1) /
        5 || 0;

    const target = 0.7 * accuracy + 0.3 * selfReport;

    const existing = await prisma.topicConfidence.findUnique({
      where: { userId_objective: { userId, objective } },
    });
    const days = existing
      ? Math.max(0, (Date.now() - existing.lastDecay.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const decayed = (existing?.mastery ?? 0) * Math.max(0, 1 - DECAY_PER_DAY * days);
    const mastery = decayed * (1 - NEW_WEIGHT) + target * NEW_WEIGHT;

    updates.push(
      prisma.topicConfidence.upsert({
        where: { userId_objective: { userId, objective } },
        create: { userId, objective, mastery, lastDecay: new Date() },
        update: { mastery, lastDecay: new Date() },
      }),
    );
  }

  await prisma.$transaction(updates);
  return prisma.topicConfidence.findMany({ where: { userId } });
}

export interface Recommendation {
  unitId: string;
  reason: string;
  priority: number;
}

/** Surfaces the next units a learner should study to lift their weakest objectives. */
export async function recommendUnits(userId: string, limit = 5): Promise<Recommendation[]> {
  const confidence = await prisma.topicConfidence.findMany({
    where: { userId },
    orderBy: { mastery: "asc" },
  });

  if (!confidence.length) {
    // Cold start: walk the curriculum top-to-bottom.
    const units = await prisma.unit.findMany({
      orderBy: [{ module: { orderIndex: "asc" } }, { orderIndex: "asc" }],
      take: limit,
      include: { module: true },
    });
    return units.map((u, i) => ({
      unitId: u.id,
      reason: `Start with ${u.module.title}`,
      priority: limit - i,
    }));
  }

  const recs: Recommendation[] = [];
  for (const c of confidence) {
    if (c.mastery >= 0.85) continue;
    const unit = await prisma.unit.findFirst({
      where: {
        module: { objective: c.objective },
        progress: { none: { userId, status: "MASTERED" } },
      },
      orderBy: [{ module: { orderIndex: "asc" } }, { orderIndex: "asc" }],
    });
    if (unit) {
      recs.push({
        unitId: unit.id,
        reason: `Lift ${c.objective.replaceAll("_", " ").toLowerCase()} (mastery ${(c.mastery * 100).toFixed(0)}%)`,
        priority: 1 - c.mastery,
      });
    }
    if (recs.length >= limit) break;
  }
  return recs.sort((a, b) => b.priority - a.priority);
}

/**
 * Updates the learner's streak. Called on any learning action.
 * Streak preserved if last activity was yesterday, broken if older.
 */
export async function bumpStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const now = new Date();
  const last = user.lastActiveAt;
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((today.getTime() - lastDay.getTime()) / dayMs);

  let streakDays = user.streakDays;
  if (diffDays === 0) {
    // already counted today
  } else if (diffDays === 1) {
    streakDays += 1;
  } else {
    streakDays = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streakDays, lastActiveAt: now },
  });
  return streakDays;
}
