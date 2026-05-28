import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { recommendUnits } from "@/lib/adaptive";
import { evaluateAchievements } from "@/lib/achievements";
import { AchievementGrid } from "@/components/achievement-grid";
import { ExamObjective } from "@prisma/client";
import Link from "next/link";

const OBJ_LABELS: Record<ExamObjective, string> = {
  IDENTITIES_GOVERNANCE: "Identity & Governance",
  STORAGE: "Storage",
  COMPUTE: "Compute",
  VIRTUAL_NETWORKING: "Virtual Networking",
  MONITORING_BACKUP: "Monitoring & Backup",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div>
        <Nav />
        <main className="container py-16 text-center">
          <p>
            Please{" "}
            <Link className="underline" href="/login">
              sign in
            </Link>{" "}
            to view your dashboard.
          </p>
        </main>
      </div>
    );
  }

  const userId = (session.user as { id: string }).id;
  const [confidence, recentAttempts, recommendations, dueFlashcards, streak, achievements] =
    await Promise.all([
      prisma.topicConfidence.findMany({ where: { userId } }),
      prisma.examAttempt.findMany({
        where: { userId, submittedAt: { not: null } },
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: { exam: true },
      }),
      recommendUnits(userId, 4),
      prisma.flashcardReview.count({ where: { userId, dueAt: { lte: new Date() } } }),
      prisma.user.findUnique({ where: { id: userId }, select: { streakDays: true } }),
      evaluateAchievements(userId),
    ]);

  const masteryByObj = new Map(confidence.map((c) => [c.objective, c.mastery]));

  return (
    <div>
      <Nav />
      <main className="container py-10 space-y-10">
        <div className="grid gap-6 md:grid-cols-3">
          <Stat label="Streak" value={`${streak?.streakDays ?? 0} days`} hint="Keep it going" />
          <Stat label="Cards due" value={String(dueFlashcards)} hint="Spaced repetition" />
          <Stat
            label="Overall mastery"
            value={`${Math.round(([...masteryByObj.values()].reduce((a, b) => a + b, 0) / Math.max(1, masteryByObj.size)) * 100)}%`}
            hint="Weighted across 5 objectives"
          />
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Mastery by exam objective</h2>
          <div className="space-y-3 rounded-lg border bg-card p-4">
            {(Object.keys(OBJ_LABELS) as ExamObjective[]).map((obj) => {
              const m = masteryByObj.get(obj) ?? 0;
              return (
                <div key={obj}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{OBJ_LABELS[obj]}</span>
                    <span className="text-muted-foreground">{Math.round(m * 100)}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded bg-secondary">
                    <div
                      className="h-full rounded bg-azure-500 transition-all"
                      style={{ width: `${m * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <AchievementGrid achievements={achievements} />

        <section>
          <h2 className="mb-4 text-lg font-semibold">Next up</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {recommendations.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You're caught up — try a timed practice exam.
              </p>
            )}
            {recommendations.map((r) => (
              <Link
                key={r.unitId}
                href={`/learn/unit/${r.unitId}`}
                className="rounded-lg border bg-card p-4 hover:bg-secondary"
              >
                <div className="text-sm font-medium">Continue studying</div>
                <div className="mt-1 text-xs text-muted-foreground">{r.reason}</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent practice exams</h2>
          <div className="rounded-lg border bg-card divide-y">
            {recentAttempts.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No attempts yet.{" "}
                <Link className="underline" href="/practice">
                  Take one now.
                </Link>
              </div>
            )}
            {recentAttempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <div className="font-medium">{a.exam.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.submittedAt?.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={a.passed ? "text-emerald-500" : "text-destructive"}>
                    {a.scaledScore ?? "—"} {a.passed ? "PASS" : "FAIL"}
                  </span>
                  <Link
                    className="rounded-md border px-3 py-1 hover:bg-secondary"
                    href={`/practice/${a.examId}/review/${a.id}`}
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
