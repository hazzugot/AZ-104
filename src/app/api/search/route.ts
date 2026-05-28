import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

const Query = z.object({ q: z.string().min(2).max(120) });

/**
 * Cross-content search.
 * Pure SQL ILIKE for now — when pgvector is populated, swap in cosine
 * similarity (see src/lib/ai/rag.ts) for a semantic layer.
 */
export async function GET(req: NextRequest) {
  await requireUser();
  const url = new URL(req.url);
  const parsed = Query.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }
  const q = parsed.data.q;
  const like = `%${q}%`;

  const [units, flashcards, questions] = await Promise.all([
    prisma.unit.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { bodyMarkdown: { contains: q, mode: "insensitive" } },
          { examTips: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { module: true },
      take: 8,
    }),
    prisma.flashcard.findMany({
      where: {
        OR: [
          { front: { contains: q, mode: "insensitive" } },
          { back: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
    }),
    prisma.examQuestion.findMany({
      where: {
        reviewStatus: "APPROVED",
        OR: [
          { stem: { contains: q, mode: "insensitive" } },
          { explanation: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    units: units.map((u) => ({
      id: u.id,
      title: u.title,
      moduleTitle: u.module.title,
      href: `/learn/${u.module.slug}/${u.slug}`,
      snippet: extractSnippet(u.bodyMarkdown ?? u.title, q),
      objective: u.module.objective,
    })),
    flashcards: flashcards.map((f) => ({
      id: f.id,
      front: f.front,
      back: f.back,
      category: f.category,
    })),
    questions: questions.map((qq) => ({
      id: qq.id,
      stem: qq.stem.slice(0, 200),
      objective: qq.objective,
      difficulty: qq.difficulty,
    })),
  });

  // Suppress unused warning in environments that still reference `like` historically.
  void like;
}

function extractSnippet(text: string, q: string, radius = 80): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return text.slice(0, 160) + (text.length > 160 ? "…" : "");
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}
