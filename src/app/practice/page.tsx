import { Nav } from "@/components/nav";
import Link from "next/link";
import { prisma } from "@/lib/db";

const presets = [
  { mode: "TIMED", title: "Full timed mock (120 min, 50 q)", color: "bg-azure-500" },
  { mode: "STUDY", title: "Study mode (instant feedback)", color: "bg-emerald-500" },
  { mode: "WEAK_AREA", title: "Weak-area drill", color: "bg-amber-500" },
  { mode: "ADAPTIVE", title: "Adaptive difficulty", color: "bg-purple-500" },
];

export default async function PracticeIndex() {
  const recent = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return (
    <div>
      <Nav />
      <main className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight">Practice exams</h1>
        <p className="mt-2 text-muted-foreground">
          Generated with Claude Sonnet to match Microsoft's exam wording and
          difficulty distribution.
        </p>

        <section className="mt-8 grid gap-3 md:grid-cols-2">
          {presets.map((p) => (
            <form
              key={p.mode}
              action="/api/exams/build"
              method="post"
              className="rounded-lg border bg-card p-5"
            >
              <input type="hidden" name="mode" value={p.mode} />
              <input type="hidden" name="title" value={p.title} />
              <div className={`mb-3 inline-block rounded-full ${p.color} px-2 py-0.5 text-xs text-white`}>
                {p.mode.replace("_", " ").toLowerCase()}
              </div>
              <h3 className="font-semibold">{p.title}</h3>
              <button className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90">
                Start
              </button>
            </form>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Recent exams</h2>
          <ul className="divide-y rounded-lg border bg-card">
            {recent.map((e) => (
              <li key={e.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.mode} · {e.durationMin} min
                  </div>
                </div>
                <Link
                  href={`/practice/${e.id}`}
                  className="rounded-md border px-3 py-1 hover:bg-secondary"
                >
                  Start
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
