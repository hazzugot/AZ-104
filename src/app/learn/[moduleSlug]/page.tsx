import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlaskConical, BookOpen, AlertTriangle } from "lucide-react";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const mod = await prisma.module.findUnique({
    where: { slug: moduleSlug },
    include: { units: { orderBy: { orderIndex: "asc" } } },
  });
  if (!mod) notFound();

  return (
    <div>
      <Nav />
      <main className="container py-10">
        <Link href="/learn" className="text-sm text-muted-foreground hover:underline">
          ← Curriculum
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{mod.title}</h1>
        <p className="mt-2 text-muted-foreground">{mod.summary}</p>

        <ul className="mt-8 space-y-2">
          {mod.units.map((u, idx) => (
            <li key={u.id}>
              <Link
                href={`/learn/${mod.slug}/${u.slug}`}
                className="flex items-center justify-between rounded-lg border bg-card p-4 hover:border-azure-500"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-medium">{u.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {u.kind.toLowerCase()} · {u.estimatedMin} min
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.likelyOnExam && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" /> Likely on exam
                    </span>
                  )}
                  {u.kind === "LAB" ? (
                    <FlaskConical className="h-4 w-4 text-azure-500" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
