import { Nav } from "@/components/nav";
import { prisma } from "@/lib/db";
import { ExamObjective } from "@prisma/client";
import Link from "next/link";

/**
 * Official AZ-104 skills measured outline, cross-linked to platform content.
 * Source: Microsoft AZ-104 Exam Skills Outline.
 */
const BLUEPRINT: Record<ExamObjective, { title: string; weight: string; topics: string[] }> = {
  IDENTITIES_GOVERNANCE: {
    title: "Manage Azure identities and governance",
    weight: "20-25%",
    topics: [
      "Manage users and groups (create, dynamic, B2B guests)",
      "Manage access to Azure resources (RBAC, custom roles, locks)",
      "Manage Microsoft Entra ID tenants (P1 vs P2 features, branding, custom domains)",
      "Manage Azure subscriptions and governance (management groups, Cost Management, Azure Policy)",
    ],
  },
  STORAGE: {
    title: "Implement and manage storage",
    weight: "15-20%",
    topics: [
      "Configure storage accounts (kinds, performance, replication)",
      "Configure Azure Blob Storage (containers, tiers, lifecycle, soft delete, immutability)",
      "Configure Azure Files (Standard/Premium, identity, File Sync)",
      "Manage data movement (AzCopy, Storage Explorer, Data Box, Import/Export)",
    ],
  },
  COMPUTE: {
    title: "Deploy and manage Azure compute resources",
    weight: "20-25%",
    topics: [
      "Automate deployment of resources by using ARM templates and Bicep",
      "Create and configure virtual machines (sizes, disks, extensions, availability)",
      "Configure Azure App Service and Azure Container Instances/Apps",
      "Configure and manage Azure Kubernetes Service (AKS)",
    ],
  },
  VIRTUAL_NETWORKING: {
    title: "Implement and manage virtual networking",
    weight: "15-20%",
    topics: [
      "Configure VNets and subnets (peering, address spaces, IP)",
      "Configure secure access (NSGs, ASGs, service endpoints, private endpoints)",
      "Configure load balancing (Azure LB, Application Gateway, Front Door)",
      "Configure name resolution (Private DNS zones, conditional forwarding)",
      "Monitor and troubleshoot virtual networking (Network Watcher, NSG flow logs, Connection Monitor)",
      "Integrate on-prem networks (VPN Gateway, ExpressRoute)",
    ],
  },
  MONITORING_BACKUP: {
    title: "Monitor and maintain Azure resources",
    weight: "10-15%",
    topics: [
      "Monitor resources by using Azure Monitor (metrics, log analytics, alerts, action groups)",
      "Implement backup and recovery (Recovery Services Vault, Azure Backup, Site Recovery)",
    ],
  },
};

export default async function ExamBlueprintPage() {
  // Cross-reference each objective with content depth so learners see how
  // much study material is available per skill area.
  const stats = await Promise.all(
    (Object.keys(BLUEPRINT) as ExamObjective[]).map(async (obj) => {
      const [units, questions, flashcards] = await Promise.all([
        prisma.unit.count({ where: { module: { objective: obj } } }),
        prisma.examQuestion.count({ where: { objective: obj, reviewStatus: "APPROVED" } }),
        prisma.flashcard.count({ where: { module: { objective: obj } } }),
      ]);
      return { obj, units, questions, flashcards };
    }),
  );

  return (
    <div>
      <Nav />
      <main className="container py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AZ-104 exam blueprint</h1>
          <p className="mt-2 text-muted-foreground">
            Official skills measured outline, cross-linked to platform content.
            Use this to estimate how much of each domain you have covered.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Source:{" "}
            <a
              href="https://learn.microsoft.com/credentials/certifications/exams/az-104/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Microsoft AZ-104 certification page
            </a>
            . Skill weights are Microsoft-published ranges and can be revised.
          </p>
        </header>

        <div className="space-y-6">
          {stats.map(({ obj, units, questions, flashcards }) => {
            const b = BLUEPRINT[obj];
            return (
              <section key={obj} className="rounded-lg border bg-card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-xl font-semibold">{b.title}</h2>
                  <div className="text-sm text-muted-foreground">
                    Exam weight: <span className="font-mono">{b.weight}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
                  <ul className="space-y-2 text-sm">
                    {b.topics.map((t) => (
                      <li key={t} className="flex gap-2">
                        <span className="text-azure-500">▸</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-md bg-secondary/50 p-3 text-xs space-y-1">
                    <div className="font-semibold uppercase tracking-wide text-muted-foreground">
                      Content coverage
                    </div>
                    <div className="flex justify-between">
                      <span>Units</span>
                      <span className="font-mono">{units}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved questions</span>
                      <span className="font-mono">{questions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flashcards</span>
                      <span className="font-mono">{flashcards}</span>
                    </div>
                    <Link
                      href={`/practice?objective=${obj}`}
                      className="mt-2 block rounded-md bg-primary px-2 py-1 text-center text-primary-foreground"
                    >
                      Drill this objective
                    </Link>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
