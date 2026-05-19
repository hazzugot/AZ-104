/**
 * Retrieval-Augmented Generation utilities.
 *
 * Strategy:
 *   1. Embeddings of ContentBlock + TranscriptChunk rows live in pgvector columns.
 *   2. `retrieveGroundingContext` performs an objective-scoped cosine search and
 *      concatenates the top-K snippets, trimmed to a character budget.
 *   3. Callers (tutor, exam generator, summariser) inject this as the "grounding
 *      context" portion of their prompt so the model is anchored to Microsoft
 *      Learn material rather than its parametric memory.
 *
 * The pgvector queries use raw SQL because Prisma's typed API does not yet
 * surface the `<=>` cosine distance operator.
 */
import { ExamObjective } from "@prisma/client";
import { prisma } from "../db";
import { logger } from "../logger";

export async function embedText(text: string): Promise<number[] | null> {
  // Default embedding path uses the OpenAI-compatible endpoint configured in
  // OPENAI_BASE_URL / OPENAI_API_KEY. Many providers (Azure OpenAI, Ollama,
  // Voyage, Together, etc.) expose this surface, which is why we don't pin to
  // Anthropic for embeddings.
  const baseUrl = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
  if (!baseUrl || !apiKey) return null;

  try {
    const r = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text.slice(0, 8000), model }),
    });
    if (!r.ok) {
      logger.warn({ status: r.status }, "embedding request failed");
      return null;
    }
    const json = (await r.json()) as { data: { embedding: number[] }[] };
    return json.data[0]?.embedding ?? null;
  } catch (err) {
    logger.warn({ err }, "embedText error");
    return null;
  }
}

export interface RetrievalOptions {
  objective?: ExamObjective;
  topic?: string;
  unitId?: string;
  k?: number;
  maxChars?: number;
}

/**
 * Returns concatenated grounding context for prompt injection.
 * Falls back to keyword search when embeddings are unavailable.
 */
export async function retrieveGroundingContext(opts: RetrievalOptions): Promise<string> {
  const k = opts.k ?? 6;
  const maxChars = opts.maxChars ?? 4000;
  const query = [opts.topic, opts.objective].filter(Boolean).join(" ");

  if (!process.env.ENABLE_VECTOR_SEARCH || process.env.ENABLE_VECTOR_SEARCH === "false") {
    return keywordFallback(query, opts.objective, k, maxChars);
  }

  const queryEmbedding = await embedText(query);
  if (!queryEmbedding) return keywordFallback(query, opts.objective, k, maxChars);

  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  try {
    const rows = await prisma.$queryRawUnsafe<
      { id: string; text: string; title: string; url: string | null }[]
    >(
      `
      SELECT cb.id, cb.text, u.title, u."sourceUrl" AS url
      FROM "ContentBlock" cb
      JOIN "Unit" u ON u.id = cb."unitId"
      JOIN "Module" m ON m.id = u."moduleId"
      WHERE cb.embedding IS NOT NULL
        ${opts.objective ? `AND m.objective = '${opts.objective}'::"ExamObjective"` : ""}
        ${opts.unitId ? `AND u.id = '${opts.unitId.replace(/'/g, "''")}'` : ""}
      ORDER BY cb.embedding <=> '${vectorLiteral}'::vector
      LIMIT ${k};
      `,
    );

    return assembleContext(rows, maxChars);
  } catch (err) {
    logger.warn({ err }, "vector search failed, falling back");
    return keywordFallback(query, opts.objective, k, maxChars);
  }
}

async function keywordFallback(
  query: string,
  objective: ExamObjective | undefined,
  k: number,
  maxChars: number,
): Promise<string> {
  if (!query) return "";
  const rows = await prisma.contentBlock.findMany({
    where: {
      text: { contains: query.split(" ")[0] ?? "", mode: "insensitive" },
      unit: objective ? { module: { objective } } : undefined,
    },
    include: { unit: true },
    take: k,
  });
  return assembleContext(
    rows.map((r) => ({
      id: r.id,
      text: r.text ?? "",
      title: r.unit.title,
      url: r.unit.sourceUrl,
    })),
    maxChars,
  );
}

function assembleContext(
  rows: { id: string; text: string; title: string; url: string | null }[],
  maxChars: number,
): string {
  let out = "";
  for (const r of rows) {
    const block = `[${r.title}${r.url ? ` — ${r.url}` : ""}]\n${r.text}\n\n`;
    if (out.length + block.length > maxChars) break;
    out += block;
  }
  return out.trim();
}
