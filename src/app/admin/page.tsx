import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function AdminPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!session?.user || (role !== Role.ADMIN && role !== Role.INSTRUCTOR)) {
    redirect("/login");
  }

  const [pendingQuestions, scrapeJobs, aiSpend, userCount, transcripts] = await Promise.all([
    prisma.examQuestion.count({ where: { reviewStatus: "NEEDS_REVIEW" } }),
    prisma.scrapeJob.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.aIGeneration.aggregate({
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
    }),
    prisma.user.count(),
    prisma.transcript.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div>
      <Nav />
      <main className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <Tile label="Users" value={String(userCount)} />
          <Tile
            label="Questions pending review"
            value={String(pendingQuestions)}
            href="/admin/questions"
          />
          <Tile label="Transcripts pending" value={String(transcripts)} />
          <Tile
            label="AI spend (30d)"
            value={`$${(aiSpend._sum.costUsd ?? 0).toFixed(2)}`}
            hint={`${aiSpend._sum.inputTokens ?? 0} in / ${aiSpend._sum.outputTokens ?? 0} out tokens`}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Recent scrape jobs</h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="p-3">URL</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {scrapeJobs.map((j) => (
                  <tr key={j.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{j.url}</td>
                    <td className="p-3">{j.status}</td>
                    <td className="p-3">{j.attempts}</td>
                    <td className="p-3">{(j.finishedAt ?? j.startedAt ?? j.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </>
  );
  if (href) {
    return (
      <a href={href} className="rounded-lg border bg-card p-5 hover:border-azure-500 transition-colors">
        {inner}
      </a>
    );
  }
  return <div className="rounded-lg border bg-card p-5">{inner}</div>;
}
