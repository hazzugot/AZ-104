import { Nav } from "@/components/nav";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { StudyPlanCalendar } from "@/components/study-plan-calendar";
import { StudyPlanGenerator } from "@/components/study-plan-generator";

export default async function StudyPlanPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div>
        <Nav />
        <main className="container py-16 text-center">
          <p>
            <Link className="underline" href="/login">Sign in</Link> to generate a study plan.
          </p>
        </main>
      </div>
    );
  }
  const userId = (session.user as { id: string }).id;
  const plan = await prisma.studyPlan.findFirst({
    where: { userId, active: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <Nav />
      <main className="container py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Your study plan</h1>
          <p className="mt-1 text-muted-foreground">
            Personalised daily schedule biased toward your weak objectives. Recompute any time.
          </p>
        </header>

        <StudyPlanGenerator
          examDate={plan?.examDate ?? null}
          weeklyHours={plan?.weeklyHours ?? 8}
        />

        {plan ? (
          <StudyPlanCalendar items={plan.items as { date: string; type: string; title: string; durationMin: number; objective?: string }[]} />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No study plan yet. Set an exam date and click Generate.
          </div>
        )}
      </main>
    </div>
  );
}
