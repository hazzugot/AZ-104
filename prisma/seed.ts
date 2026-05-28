/**
 * Seed the AZ-104 platform with the canonical curriculum, a curated exam
 * question bank, flashcards, and lab guides. Safe to re-run — every write
 * uses upsert semantics.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { CURRICULUM } from "./data/curriculum";
import { QUESTIONS } from "./data/questions";
import { FLASHCARDS } from "./data/flashcards";
import { LABS } from "./data/labs";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Seeding AZ-104 platform content");

  // ── Learning Path ────────────────────────────────────────────────────
  const path = await prisma.learningPath.upsert({
    where: { slug: "az-104" },
    create: {
      slug: "az-104",
      title: "AZ-104: Microsoft Azure Administrator",
      description:
        "Official AZ-104 exam track. Identity & governance, storage, compute, networking, monitoring.",
      sourceUrl: "https://learn.microsoft.com/training/courses/az-104t00",
      orderIndex: 0,
    },
    update: {},
  });
  console.log(`  ✓ Learning Path: ${path.title}`);

  // ── Modules + Units ─────────────────────────────────────────────────
  let modCount = 0;
  let unitCount = 0;
  let kcCount = 0;
  for (const [mi, m] of CURRICULUM.entries()) {
    const mod = await prisma.module.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        title: m.title,
        summary: m.summary,
        objective: m.objective,
        level: m.level,
        examWeight: m.examWeight,
        orderIndex: mi,
        pathId: path.id,
        sourceUrl: m.sourceUrl,
      },
      update: {
        title: m.title,
        summary: m.summary,
        examWeight: m.examWeight,
        orderIndex: mi,
        pathId: path.id,
        sourceUrl: m.sourceUrl,
        level: m.level,
      },
    });
    modCount++;

    for (const [ui, u] of m.units.entries()) {
      const unit = await prisma.unit.upsert({
        where: { moduleId_slug: { moduleId: mod.id, slug: u.slug } },
        create: {
          moduleId: mod.id,
          slug: u.slug,
          title: u.title,
          kind: u.kind,
          orderIndex: ui,
          estimatedMin: u.estimatedMin,
          bodyMarkdown: u.bodyMarkdown,
          examTips: u.examTips,
          commonMistakes: u.commonMistakes,
          realWorldUseCases: u.realWorldUseCases,
          keyTerms: u.keyTerms as unknown as Prisma.InputJsonValue,
          likelyOnExam: u.likelyOnExam ?? false,
          likelyExamScore: u.likelyExamScore ?? 0,
        },
        update: {
          title: u.title,
          kind: u.kind,
          orderIndex: ui,
          estimatedMin: u.estimatedMin,
          bodyMarkdown: u.bodyMarkdown,
          examTips: u.examTips,
          commonMistakes: u.commonMistakes,
          realWorldUseCases: u.realWorldUseCases,
          keyTerms: u.keyTerms as unknown as Prisma.InputJsonValue,
          likelyOnExam: u.likelyOnExam ?? false,
          likelyExamScore: u.likelyExamScore ?? 0,
        },
      });
      unitCount++;

      // Knowledge checks (replace, not merge)
      if (u.knowledgeChecks?.length) {
        await prisma.knowledgeCheck.deleteMany({ where: { unitId: unit.id } });
        for (const kc of u.knowledgeChecks) {
          await prisma.knowledgeCheck.create({
            data: {
              unitId: unit.id,
              prompt: kc.prompt,
              options: kc.options as unknown as Prisma.InputJsonValue,
              explanation: kc.explanation,
              difficulty: kc.difficulty ?? 2,
            },
          });
          kcCount++;
        }
      }
    }
  }
  console.log(`  ✓ ${modCount} modules, ${unitCount} units, ${kcCount} knowledge checks`);

  // ── Lab Guides ───────────────────────────────────────────────────────
  let labCount = 0;
  for (const lab of LABS) {
    const mod = await prisma.module.findUnique({ where: { slug: lab.moduleSlug } });
    if (!mod) continue;
    const unit = await prisma.unit.findUnique({
      where: { moduleId_slug: { moduleId: mod.id, slug: lab.unitSlug } },
    });
    if (!unit) continue;

    await prisma.labGuide.upsert({
      where: { unitId: unit.id },
      create: {
        unitId: unit.id,
        title: lab.title,
        objective: lab.objective,
        steps: lab.steps as unknown as Prisma.InputJsonValue,
        prerequisites: lab.prerequisites,
        cleanupSteps: lab.cleanupSteps,
        estimatedMin: lab.estimatedMin,
      },
      update: {
        title: lab.title,
        objective: lab.objective,
        steps: lab.steps as unknown as Prisma.InputJsonValue,
        prerequisites: lab.prerequisites,
        cleanupSteps: lab.cleanupSteps,
        estimatedMin: lab.estimatedMin,
      },
    });
    labCount++;
  }
  console.log(`  ✓ ${labCount} lab guides`);

  // ── Exam Questions ───────────────────────────────────────────────────
  let qCount = 0;
  for (const q of QUESTIONS) {
    const stemKey = q.stem.slice(0, 80);
    const exists = await prisma.examQuestion.findFirst({
      where: { stem: { startsWith: stemKey } },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.examQuestion.create({
      data: {
        objective: q.objective,
        type: q.type,
        difficulty: q.difficulty,
        stem: q.stem,
        caseStudy: q.caseStudy,
        options: q.options as unknown as Prisma.InputJsonValue,
        correctIds: q.correctIds as unknown as Prisma.InputJsonValue,
        explanation: q.explanation,
        distractorRationale: q.distractorRationale as unknown as Prisma.InputJsonValue,
        references: q.references as unknown as Prisma.InputJsonValue,
        tags: q.tags,
        source: "EXPERT_AUTHORED",
        reviewStatus: "APPROVED",
        qualityScore: 0.9,
      },
    });
    qCount++;
  }
  console.log(`  ✓ ${qCount} new exam questions seeded (total: ${await prisma.examQuestion.count()})`);

  // ── Flashcards ───────────────────────────────────────────────────────
  let fcCount = 0;
  for (const f of FLASHCARDS) {
    const mod = await prisma.module.findUnique({ where: { slug: f.moduleSlug } });
    if (!mod) continue;
    const unit = f.unitSlug
      ? await prisma.unit.findUnique({
          where: { moduleId_slug: { moduleId: mod.id, slug: f.unitSlug } },
        })
      : null;
    const exists = await prisma.flashcard.findFirst({
      where: { front: f.front, moduleId: mod.id },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.flashcard.create({
      data: {
        moduleId: mod.id,
        unitId: unit?.id,
        front: f.front,
        back: f.back,
        mnemonic: f.mnemonic,
        category: f.category,
        difficulty: f.difficulty,
        source: "CURATED",
      },
    });
    fcCount++;
  }
  console.log(`  ✓ ${fcCount} new flashcards seeded (total: ${await prisma.flashcard.count()})`);

  // ── Prompt versions ──────────────────────────────────────────────────
  await prisma.promptVersion.upsert({
    where: { name_version: { name: "exam_question_v1", version: "1.0.0" } },
    create: {
      name: "exam_question_v1",
      version: "1.0.0",
      template: "see src/lib/ai/prompts.ts (EXAM_QUESTION_SYSTEM + few-shot)",
      active: true,
    },
    update: {},
  });

  console.log("✓ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
