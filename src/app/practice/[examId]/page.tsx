import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/exam-runner";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      items: {
        include: { question: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
  if (!exam) notFound();

  // Strip correct answers before sending to the client.
  const items = exam.items.map((it) => ({
    id: it.questionId,
    type: it.question.type,
    stem: it.question.stem,
    caseStudy: it.question.caseStudy,
    options: it.question.options as { id: string; text: string }[],
    multi: (it.question.correctIds as string[]).length > 1,
    objective: it.question.objective,
    difficulty: it.question.difficulty,
  }));

  return (
    <div>
      <Nav />
      <main className="container py-10">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {exam.mode === "TIMED" ? `${exam.durationMin} minutes · ${items.length} items` : `${items.length} items`}
        </p>
        <ExamRunner examId={exam.id} mode={exam.mode} durationMin={exam.durationMin} items={items} />
      </main>
    </div>
  );
}
