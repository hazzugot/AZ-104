import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Check, X, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function AttemptReviewPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>;
}) {
  const { attemptId, examId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: true,
      questionAttempts: {
        include: { question: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!attempt || attempt.userId !== userId) notFound();

  const perObj = (attempt.perObjective as Record<string, { correct: number; total: number; percent: number }> | null) ?? {};
  const minutes = attempt.durationSec ? Math.floor(attempt.durationSec / 60) : 0;
  const seconds = attempt.durationSec ? attempt.durationSec % 60 : 0;

  return (
    <div>
      <Nav />
      <main className="container py-10 space-y-8">
        <header>
          <Link href={`/practice/${examId}`} className="text-sm text-muted-foreground hover:underline">
            ← {attempt.exam.title}
          </Link>
          <div className="mt-4 flex items-baseline gap-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Scaled score</div>
              <div className={`text-5xl font-bold ${attempt.passed ? "text-emerald-500" : "text-destructive"}`}>
                {attempt.scaledScore ?? "—"}
              </div>
              <div className="mt-1 text-sm">{attempt.passed ? "PASS" : "FAIL"} · pass = 700</div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Raw: {Math.round((attempt.rawPercent ?? 0) * 100)}%</div>
              <div>Duration: {minutes}m {seconds}s</div>
              <div>Submitted: {attempt.submittedAt?.toLocaleString() ?? "in progress"}</div>
            </div>
          </div>
        </header>

        <section>
          <h2 className="text-lg font-semibold mb-3">Per objective</h2>
          <div className="grid gap-2">
            {Object.entries(perObj).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-sm">
                  <span>{k.replace("_", " ").toLowerCase()}</span>
                  <span className="text-muted-foreground">{v.correct}/{v.total} · {Math.round(v.percent * 100)}%</span>
                </div>
                <div className="mt-1 h-2 rounded bg-secondary">
                  <div
                    className={`h-full rounded ${v.percent >= 0.7 ? "bg-emerald-500" : v.percent >= 0.5 ? "bg-amber-500" : "bg-destructive"}`}
                    style={{ width: `${v.percent * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Question-by-question</h2>
          <div className="space-y-4">
            {attempt.questionAttempts.map((qa, i) => {
              const q = qa.question;
              const correctIds = q.correctIds as string[];
              const selected = qa.selectedIds as string[];
              const options = q.options as { id: string; text: string }[];
              const dr = (q.distractorRationale as Record<string, string> | null) ?? {};
              const refs = (q.references as { title: string; url: string }[] | null) ?? [];
              return (
                <details
                  key={qa.id}
                  className={`rounded-lg border ${qa.isCorrect ? "border-emerald-500/30" : "border-destructive/30"}`}
                >
                  <summary className="cursor-pointer p-4 flex items-start gap-3">
                    <span className="mt-0.5">
                      {qa.isCorrect ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">
                        Q{i + 1} · {q.objective.replace("_", " ").toLowerCase()} · {q.difficulty.toLowerCase()}
                      </div>
                      <div className="mt-1 line-clamp-2 text-sm font-medium">{q.stem}</div>
                    </div>
                  </summary>
                  <div className="border-t p-4 space-y-3 text-sm">
                    {q.caseStudy && (
                      <div className="rounded-md bg-secondary p-3">{q.caseStudy}</div>
                    )}
                    <p className="font-medium">{q.stem}</p>
                    <ul className="space-y-1.5">
                      {options.map((o) => {
                        const isCorrect = correctIds.includes(o.id);
                        const wasSelected = selected.includes(o.id);
                        return (
                          <li
                            key={o.id}
                            className={`flex items-start gap-2 rounded-md border p-2.5 ${
                              isCorrect ? "border-emerald-500/40 bg-emerald-500/5" :
                              wasSelected ? "border-destructive/40 bg-destructive/5" : ""
                            }`}
                          >
                            <span className="font-mono text-xs mt-0.5">{o.id}.</span>
                            <span className="flex-1">{o.text}</span>
                            {isCorrect && <Check className="h-4 w-4 text-emerald-500" />}
                            {wasSelected && !isCorrect && <X className="h-4 w-4 text-destructive" />}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="rounded-md bg-azure-500/5 border border-azure-500/20 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-azure-600 dark:text-azure-500">
                        Explanation
                      </div>
                      <p className="mt-1">{q.explanation}</p>
                    </div>
                    {Object.keys(dr).length > 0 && (
                      <div className="rounded-md bg-secondary/50 p-3">
                        <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <AlertCircle className="h-3 w-3" /> Why other answers are wrong
                        </div>
                        <dl className="mt-2 space-y-1">
                          {Object.entries(dr).map(([k, v]) => (
                            <div key={k}>
                              <dt className="inline font-mono text-xs">{k}:</dt>{" "}
                              <dd className="inline text-muted-foreground">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                    {refs.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          References
                        </div>
                        <ul className="mt-1 space-y-0.5">
                          {refs.map((r) => (
                            <li key={r.url}>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-azure-500 underline"
                              >
                                {r.title} <ExternalLink className="h-3 w-3" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
