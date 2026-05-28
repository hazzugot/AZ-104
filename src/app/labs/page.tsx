import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FlaskConical, Clock, Layers, Terminal, Workflow } from "lucide-react";

const objLabels: Record<string, string> = {
  IDENTITIES_GOVERNANCE: "Identity & Governance",
  STORAGE: "Storage",
  COMPUTE: "Compute",
  VIRTUAL_NETWORKING: "Virtual Networking",
  MONITORING_BACKUP: "Monitoring & Backup",
};

export default async function LabsIndex() {
  // All units that have a lab guide attached.
  const units = await prisma.unit.findMany({
    where: { labGuide: { isNot: null } },
    include: { module: true, labGuide: true },
    orderBy: [{ module: { orderIndex: "asc" } }, { orderIndex: "asc" }],
  });

  return (
    <div>
      <Nav />
      <main className="container py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Hands-on labs</h1>
          <p className="mt-2 text-muted-foreground">
            Step-by-step Azure walkthroughs with portal, CLI, PowerShell, Bicep, and Terraform
            variants. Each lab includes validation checks and troubleshooting cues.
          </p>
        </header>

        {units.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No labs available yet. Run <code className="bg-secondary px-1 rounded">npx tsx prisma/seed.ts</code> to populate them.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {units.map((u) => {
              const steps = (u.labGuide?.steps as { title: string }[] | null) ?? [];
              return (
                <Link
                  key={u.id}
                  href={`/learn/${u.module.slug}/${u.slug}`}
                  className="group rounded-lg border bg-card p-5 hover:border-azure-500 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                    <span>{objLabels[u.module.objective]}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {u.labGuide?.estimatedMin ?? u.estimatedMin} min
                    </span>
                  </div>
                  <h2 className="mt-2 font-semibold group-hover:text-azure-500">
                    <FlaskConical className="inline h-4 w-4 mr-2 text-emerald-500" />
                    {u.labGuide?.title ?? u.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {u.labGuide?.objective}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {steps.length} steps
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Terminal className="h-3 w-3" /> CLI
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Workflow className="h-3 w-3" /> PowerShell
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
