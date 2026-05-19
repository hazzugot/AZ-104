/**
 * SM-2 spaced-repetition scheduler.
 *
 * Grades:
 *   0 = complete blackout
 *   1 = wrong, but answer remembered on seeing it
 *   2 = wrong, easy to recall after
 *   3 = correct, hard
 *   4 = correct, hesitant
 *   5 = correct, perfect
 *
 * For grades < 3 the card is reset to interval 1 day.
 */
import { prisma } from "./db";

export interface SM2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
}

export function nextSM2(state: SM2State, grade: number, now: Date = new Date()): SM2State {
  const q = Math.max(0, Math.min(5, grade));
  let { easeFactor: ef, intervalDays: interval, repetitions: reps } = state;

  if (q < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  }

  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const due = new Date(now);
  due.setUTCDate(due.getUTCDate() + interval);

  return { easeFactor: ef, intervalDays: interval, repetitions: reps, dueAt: due };
}

export async function gradeFlashcard(userId: string, flashcardId: string, grade: number) {
  const review = await prisma.flashcardReview.findUnique({
    where: { userId_flashcardId: { userId, flashcardId } },
  });

  const current: SM2State = {
    easeFactor: review?.easeFactor ?? 2.5,
    intervalDays: review?.intervalDays ?? 0,
    repetitions: review?.repetitions ?? 0,
    dueAt: review?.dueAt ?? new Date(),
  };
  const next = nextSM2(current, grade);

  return prisma.flashcardReview.upsert({
    where: { userId_flashcardId: { userId, flashcardId } },
    create: {
      userId,
      flashcardId,
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueAt: next.dueAt,
      lastGrade: grade,
    },
    update: {
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueAt: next.dueAt,
      lastGrade: grade,
      reviewedAt: new Date(),
    },
  });
}

export async function getDueFlashcards(userId: string, limit = 20) {
  return prisma.flashcardReview.findMany({
    where: { userId, dueAt: { lte: new Date() } },
    orderBy: { dueAt: "asc" },
    take: limit,
    include: { flashcard: true },
  });
}
