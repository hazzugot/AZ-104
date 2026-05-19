import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Sparkles } from "lucide-react";

const objLabels: Record<string, string> = {
  IDENTITIES_GOVERNANCE: "Identity & Governance",
  STORAGE: "Storage",
  COMPUTE: "Compute",
  VIRTUAL_NETWORKING: "Virtual Networking",
  MONITORING_BACKUP: "Monitoring & Backup",
};

export default async function LearnPage() {
  const modules = await prisma.module.findMany({
    orderBy: { orderIndex: "asc" },
    include: { _count: { select: { units: true } } },
  });

  return (
    <div>
      <Nav />
      <main className="container py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Curriculum</h1>
          <p className="mt-2 text-muted-foreground">
            Five exam objectives. Sourced from the official Microsoft Learn AZ-104 path.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={`/learn/${m.slug}`}
              className="group rounded-lg border bg-card p-5 hover:border-azure-500"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>{objLabels[m.objective]}</span>
                <span>{Math.round(m.examWeight * 100)}% of exam</span>
              </div>
              <h2 className="mt-2 font-semibold group-hover:text-azure-500">{m.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.summary}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{m._count.units} units</span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI-enhanced
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
