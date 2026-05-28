import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { QuestionReviewer } from "@/components/question-reviewer";

export default async function AdminQuestionsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!session?.user || (role !== Role.ADMIN && role !== Role.INSTRUCTOR)) {
    redirect("/login");
  }

  const pending = await prisma.examQuestion.findMany({
    where: { reviewStatus: "NEEDS_REVIEW" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { module: true },
  });

  const counts = await prisma.examQuestion.groupBy({
    by: ["reviewStatus"],
    _count: { _all: true },
  });

  return (
    <div>
      <Nav />
      <main className="container py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Question review queue</h1>
          <p className="mt-1 text-muted-foreground">
            AI-generated questions land here. Approve, reject, or edit before they enter the active exam pool.
          </p>
          <div className="mt-3 flex gap-3 text-sm">
            {counts.map((c) => (
              <span key={c.reviewStatus} className="rounded-full bg-secondary px-3 py-1">
                {c.reviewStatus.replace("_", " ").toLowerCase()}: {c._count._all}
              </span>
            ))}
          </div>
        </header>

        {pending.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            🎉 No questions waiting for review.
          </div>
        ) : (
          <QuestionReviewer
            questions={pending.map((q) => ({
              id: q.id,
              objective: q.objective,
              difficulty: q.difficulty,
              type: q.type,
              stem: q.stem,
              caseStudy: q.caseStudy,
              options: q.options as { id: string; text: string }[],
              correctIds: q.correctIds as string[],
              explanation: q.explanation,
              distractorRationale: (q.distractorRationale as Record<string, string> | null) ?? {},
              references: (q.references as { title: string; url: string }[] | null) ?? [],
              tags: q.tags,
              moduleTitle: q.module?.title ?? null,
            }))}
          />
        )}
      </main>
    </div>
  );
}
