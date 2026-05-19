/**
 * Seeds the AZ-104 platform with the canonical exam objective taxonomy and
 * a small starter set of curated modules/units so the UI is functional before
 * the Microsoft Learn scraper has run.
 */
import { PrismaClient, ExamObjective, UnitKind, ContentLevel } from "@prisma/client";

const prisma = new PrismaClient();

const MODULES = [
  {
    slug: "manage-azure-identities-governance",
    title: "Manage Azure identities and governance",
    summary:
      "Microsoft Entra ID, users, groups, licenses, external identities, RBAC, subscriptions, and Azure Policy.",
    objective: ExamObjective.IDENTITIES_GOVERNANCE,
    examWeight: 0.225,
    units: [
      { slug: "microsoft-entra-id", title: "Microsoft Entra ID fundamentals", kind: UnitKind.LESSON },
      { slug: "users-and-groups", title: "Manage users and groups", kind: UnitKind.LESSON },
      { slug: "rbac", title: "Azure role-based access control", kind: UnitKind.LESSON },
      { slug: "azure-policy", title: "Azure Policy and governance", kind: UnitKind.LESSON },
      { slug: "lab-assign-roles", title: "Lab: Assign Azure roles", kind: UnitKind.LAB },
    ],
  },
  {
    slug: "implement-manage-storage",
    title: "Implement and manage storage",
    summary:
      "Storage accounts, blob/file/queue services, access tiers, lifecycle, AzCopy, Azure Files, Azure File Sync.",
    objective: ExamObjective.STORAGE,
    examWeight: 0.175,
    units: [
      { slug: "storage-accounts", title: "Create and configure storage accounts", kind: UnitKind.LESSON },
      { slug: "blob-storage", title: "Azure Blob Storage", kind: UnitKind.LESSON },
      { slug: "azure-files", title: "Azure Files and File Sync", kind: UnitKind.LESSON },
      { slug: "lab-azcopy", title: "Lab: Move data with AzCopy", kind: UnitKind.LAB },
    ],
  },
  {
    slug: "deploy-manage-compute",
    title: "Deploy and manage Azure compute resources",
    summary:
      "Virtual machines, scale sets, availability, App Service, container instances, AKS.",
    objective: ExamObjective.COMPUTE,
    examWeight: 0.225,
    units: [
      { slug: "vms", title: "Provision virtual machines", kind: UnitKind.LESSON },
      { slug: "vmss", title: "Virtual Machine Scale Sets", kind: UnitKind.LESSON },
      { slug: "app-service", title: "Azure App Service", kind: UnitKind.LESSON },
      { slug: "aks", title: "Azure Kubernetes Service overview", kind: UnitKind.LESSON },
      { slug: "lab-deploy-vm", title: "Lab: Deploy a VM with availability zones", kind: UnitKind.LAB },
    ],
  },
  {
    slug: "implement-manage-virtual-networking",
    title: "Implement and manage virtual networking",
    summary:
      "VNets, subnets, NSGs, routing, peering, VPN/ExpressRoute, public IPs, DNS, load balancers, Application Gateway.",
    objective: ExamObjective.VIRTUAL_NETWORKING,
    examWeight: 0.175,
    units: [
      { slug: "vnets", title: "Virtual networks and subnets", kind: UnitKind.LESSON },
      { slug: "nsg", title: "Network Security Groups", kind: UnitKind.LESSON },
      { slug: "load-balancer", title: "Azure Load Balancer", kind: UnitKind.LESSON },
      { slug: "vpn-er", title: "VPN Gateway and ExpressRoute", kind: UnitKind.LESSON },
    ],
  },
  {
    slug: "monitor-maintain-azure",
    title: "Monitor and maintain Azure resources",
    summary:
      "Azure Monitor, Log Analytics, alerts, Application Insights, Azure Backup, Site Recovery.",
    objective: ExamObjective.MONITORING_BACKUP,
    examWeight: 0.125,
    units: [
      { slug: "azure-monitor", title: "Azure Monitor and Log Analytics", kind: UnitKind.LESSON },
      { slug: "alerts", title: "Alerts and action groups", kind: UnitKind.LESSON },
      { slug: "backup", title: "Azure Backup", kind: UnitKind.LESSON },
      { slug: "asr", title: "Azure Site Recovery", kind: UnitKind.LESSON },
    ],
  },
];

async function main() {
  console.log("Seeding AZ-104 curriculum taxonomy...");

  const path = await prisma.learningPath.upsert({
    where: { slug: "az-104" },
    create: {
      slug: "az-104",
      title: "AZ-104: Microsoft Azure Administrator",
      description:
        "Official AZ-104 exam track. Covers identity & governance, storage, compute, networking, and monitoring.",
      sourceUrl: "https://learn.microsoft.com/training/courses/az-104t00",
      orderIndex: 0,
    },
    update: {},
  });

  for (const [i, m] of MODULES.entries()) {
    const mod = await prisma.module.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        title: m.title,
        summary: m.summary,
        objective: m.objective,
        level: ContentLevel.INTERMEDIATE,
        examWeight: m.examWeight,
        orderIndex: i,
        pathId: path.id,
      },
      update: {
        title: m.title,
        summary: m.summary,
        examWeight: m.examWeight,
        orderIndex: i,
        pathId: path.id,
      },
    });

    for (const [j, u] of m.units.entries()) {
      await prisma.unit.upsert({
        where: { moduleId_slug: { moduleId: mod.id, slug: u.slug } },
        create: {
          moduleId: mod.id,
          slug: u.slug,
          title: u.title,
          kind: u.kind,
          orderIndex: j,
        },
        update: { title: u.title, orderIndex: j, kind: u.kind },
      });
    }
  }

  // Seed prompt versions used by the generation pipeline.
  await prisma.promptVersion.upsert({
    where: { name_version: { name: "exam_question_v1", version: "1.0.0" } },
    create: {
      name: "exam_question_v1",
      version: "1.0.0",
      template: "see src/lib/ai/prompts.ts",
      active: true,
    },
    update: {},
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
