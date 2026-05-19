import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExamFocusCard } from "@/components/exam-focus-card";
import { ContentBlockRenderer } from "@/components/content-block-renderer";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ moduleSlug: string; unitSlug: string }>;
}) {
  const { moduleSlug, unitSlug } = await params;
  const mod = await prisma.module.findUnique({ where: { slug: moduleSlug } });
  if (!mod) notFound();
  const unit = await prisma.unit.findUnique({
    where: { moduleId_slug: { moduleId: mod.id, slug: unitSlug } },
    include: {
      blocks: { orderBy: { orderIndex: "asc" } },
      labGuide: true,
      knowledgeChecks: true,
    },
  });
  if (!unit) notFound();

  const keyTerms = (unit.keyTerms as { term: string; definition: string }[] | null) ?? [];

  return (
    <div>
      <Nav />
      <main className="container grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
        <article className="space-y-6">
          <header>
            <Link
              href={`/learn/${moduleSlug}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← {mod.title}
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{unit.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              {unit.kind.toLowerCase()} · {unit.estimatedMin} min
            </div>
          </header>

          <section className="prose prose-slate dark:prose-invert max-w-none">
            {unit.bodyMarkdown ? (
              <div dangerouslySetInnerHTML={{ __html: unit.bodyMarkdown }} />
            ) : (
              <ContentBlockRenderer blocks={unit.blocks} />
            )}
          </section>

          {unit.labGuide && (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold">Lab walkthrough: {unit.labGuide.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{unit.labGuide.objective}</p>
              <ol className="mt-4 space-y-3 text-sm">
                {((unit.labGuide.steps as { title: string; description: string }[]) ?? []).map(
                  (s, i) => (
                    <li key={i} className="rounded-md border p-3">
                      <div className="font-medium">
                        Step {i + 1}: {s.title}
                      </div>
                      <p className="mt-1 text-muted-foreground">{s.description}</p>
                    </li>
                  ),
                )}
              </ol>
            </section>
          )}

          {unit.knowledgeChecks.length > 0 && (
            <section>
              <h2 className="font-semibold">Knowledge check</h2>
              <ul className="mt-3 space-y-3">
                {unit.knowledgeChecks.map((k) => (
                  <li key={k.id} className="rounded-lg border bg-card p-4 text-sm">
                    <p className="font-medium">{k.prompt}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <aside className="space-y-4">
          {unit.likelyOnExam && (
            <ExamFocusCard
              score={unit.likelyExamScore}
              tips={unit.examTips}
              mistakes={unit.commonMistakes}
            />
          )}
          {keyTerms.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold">Key terms</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {keyTerms.map((t) => (
                  <div key={t.term}>
                    <dt className="font-medium">{t.term}</dt>
                    <dd className="text-muted-foreground">{t.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {unit.realWorldUseCases && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold">Real-world scenarios</h3>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                {unit.realWorldUseCases}
              </p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
