/**
 * Server-side achievement evaluator.
 *
 * Achievements are derived from existing aggregate data (no extra schema):
 * we recompute them on dashboard load. This keeps the system stateless and
 * lets us add new badges without DB migrations.
 */
import { prisma } from "./db";
import type { LucideIcon } from "lucide-react";
import {
  Flame,
  Award,
  Trophy,
  Brain,
  Target,
  Zap,
  Map,
  Sparkles,
  Crown,
} from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  earnedAt?: Date;
  progress?: { current: number; target: number };
}

export async function evaluateAchievements(userId: string): Promise<Achievement[]> {
  const [user, attempts, completedUnits, masteredObjectives, flashcardReviews] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { streakDays: true } }),
      prisma.examAttempt.findMany({
        where: { userId, submittedAt: { not: null } },
        select: { passed: true, scaledScore: true, submittedAt: true },
      }),
      prisma.unitProgress.count({
        where: { userId, status: { in: ["COMPLETED", "MASTERED"] } },
      }),
      prisma.topicConfidence.count({ where: { userId, mastery: { gte: 0.85 } } }),
      prisma.flashcardReview.count({ where: { userId, repetitions: { gte: 3 } } }),
    ]);

  const streak = user?.streakDays ?? 0;
  const passingAttempts = attempts.filter((a) => a.passed);
  const bestScore = attempts.reduce((m, a) => Math.max(m, a.scaledScore ?? 0), 0);

  const list: Achievement[] = [
    {
      id: "first-steps",
      title: "First Steps",
      description: "Complete your first unit",
      icon: Map,
      earnedAt: completedUnits >= 1 ? new Date() : undefined,
      progress: { current: Math.min(completedUnits, 1), target: 1 },
    },
    {
      id: "streak-7",
      title: "Week Warrior",
      description: "Maintain a 7-day study streak",
      icon: Flame,
      earnedAt: streak >= 7 ? new Date() : undefined,
      progress: { current: Math.min(streak, 7), target: 7 },
    },
    {
      id: "streak-30",
      title: "Habit Forged",
      description: "30-day streak",
      icon: Zap,
      earnedAt: streak >= 30 ? new Date() : undefined,
      progress: { current: Math.min(streak, 30), target: 30 },
    },
    {
      id: "first-pass",
      title: "First Pass",
      description: "Pass your first practice exam (≥700)",
      icon: Award,
      earnedAt: passingAttempts.length >= 1 ? new Date() : undefined,
    },
    {
      id: "high-score",
      title: "High Achiever",
      description: "Score 900+ on a practice exam",
      icon: Trophy,
      earnedAt: bestScore >= 900 ? new Date() : undefined,
      progress: { current: Math.min(bestScore, 900), target: 900 },
    },
    {
      id: "consistent-pass",
      title: "Consistent",
      description: "Pass 5 practice exams",
      icon: Target,
      earnedAt: passingAttempts.length >= 5 ? new Date() : undefined,
      progress: { current: passingAttempts.length, target: 5 },
    },
    {
      id: "flashcard-veteran",
      title: "Card Sharp",
      description: "Drill 50 flashcards to 3+ repetitions",
      icon: Brain,
      earnedAt: flashcardReviews >= 50 ? new Date() : undefined,
      progress: { current: flashcardReviews, target: 50 },
    },
    {
      id: "objective-master",
      title: "Domain Master",
      description: "Reach 85%+ mastery on any objective",
      icon: Sparkles,
      earnedAt: masteredObjectives >= 1 ? new Date() : undefined,
    },
    {
      id: "all-objectives",
      title: "Polymath",
      description: "Master all 5 exam objectives",
      icon: Crown,
      earnedAt: masteredObjectives >= 5 ? new Date() : undefined,
      progress: { current: masteredObjectives, target: 5 },
    },
  ];

  return list;
}
