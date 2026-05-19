/**
 * Provider-agnostic AI client.
 *
 * The platform standardises on Anthropic Claude (Haiku for cheap/fast tasks,
 * Sonnet for high-quality reasoning) but exposes an OpenAI-compatible
 * interface so swapping providers later requires no caller changes.
 */
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../db";
import { logger } from "../logger";

export type ModelTier = "fast" | "smart";

const FAST_MODEL = process.env.ANTHROPIC_FAST_MODEL ?? "claude-haiku-4-5-20251001";
const SMART_MODEL = process.env.ANTHROPIC_SMART_MODEL ?? "claude-sonnet-4-6";

// Approximate per-1M-token pricing for usage accounting. Update as Anthropic
// adjusts pricing — only used for internal cost dashboards.
const PRICING: Record<string, { inUsdPerMTok: number; outUsdPerMTok: number }> = {
  [FAST_MODEL]: { inUsdPerMTok: 1.0, outUsdPerMTok: 5.0 },
  [SMART_MODEL]: { inUsdPerMTok: 3.0, outUsdPerMTok: 15.0 },
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CompleteOptions {
  tier?: ModelTier;
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
  /** Free-form label for cost accounting (e.g. "exam_question", "tutor_reply"). */
  kind: string;
  promptVersion?: string;
  refTable?: string;
  refId?: string;
  /**
   * Prompt-caching control. Marks `system` as a cache breakpoint so repeated
   * lessons / curriculum context don't pay full input cost on every call.
   */
  cacheSystem?: boolean;
}

export interface CompleteResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
}

export async function complete(opts: CompleteOptions): Promise<CompleteResult> {
  const model = opts.tier === "smart" ? SMART_MODEL : FAST_MODEL;
  const started = Date.now();

  const systemBlocks = opts.system
    ? [
        {
          type: "text" as const,
          text: opts.system,
          ...(opts.cacheSystem ? { cache_control: { type: "ephemeral" as const } } : {}),
        },
      ]
    : undefined;

  let resp;
  try {
    resp = await anthropic.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.4,
      system: systemBlocks as never,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    });
  } catch (err) {
    logger.error({ err, model, kind: opts.kind }, "anthropic call failed");
    throw err;
  }

  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");

  const usage = resp.usage;
  const pricing = PRICING[model] ?? { inUsdPerMTok: 0, outUsdPerMTok: 0 };
  const costUsd =
    (usage.input_tokens / 1_000_000) * pricing.inUsdPerMTok +
    (usage.output_tokens / 1_000_000) * pricing.outUsdPerMTok;
  const latencyMs = Date.now() - started;

  // Fire-and-forget audit — we never block the caller on logging.
  prisma.aIGeneration
    .create({
      data: {
        kind: opts.kind,
        model,
        promptVersion: opts.promptVersion,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        costUsd,
        latencyMs,
        refTable: opts.refTable,
        refId: opts.refId,
      },
    })
    .catch((e) => logger.warn({ err: e }, "failed to log AIGeneration"));

  return {
    text,
    model,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    costUsd,
    latencyMs,
  };
}

/**
 * Streamed completion for the tutor chat UI. Yields incremental text deltas.
 */
export async function* stream(opts: CompleteOptions): AsyncGenerator<string> {
  const model = opts.tier === "smart" ? SMART_MODEL : FAST_MODEL;
  const systemBlocks = opts.system
    ? [
        {
          type: "text" as const,
          text: opts.system,
          ...(opts.cacheSystem ? { cache_control: { type: "ephemeral" as const } } : {}),
        },
      ]
    : undefined;

  const s = anthropic.messages.stream({
    model,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.4,
    system: systemBlocks as never,
    messages: opts.messages,
  });

  for await (const event of s) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
  const final = await s.finalMessage();
  const usage = final.usage;
  const pricing = PRICING[model] ?? { inUsdPerMTok: 0, outUsdPerMTok: 0 };
  const costUsd =
    (usage.input_tokens / 1_000_000) * pricing.inUsdPerMTok +
    (usage.output_tokens / 1_000_000) * pricing.outUsdPerMTok;
  prisma.aIGeneration
    .create({
      data: {
        kind: opts.kind,
        model,
        promptVersion: opts.promptVersion,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        costUsd,
        latencyMs: 0,
      },
    })
    .catch(() => undefined);
}

/**
 * Parse the first JSON object/array out of an LLM reply that may include
 * surrounding prose or ```json fences.
 */
export function extractJson<T = unknown>(text: string): T {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fence?.[1] ?? text).trim();
  // Find balanced JSON: scan for first `{` or `[` and matching close.
  const start = candidate.search(/[{[]/);
  if (start === -1) throw new Error("No JSON found in model output");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i]!;
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        return JSON.parse(candidate.slice(start, i + 1)) as T;
      }
    }
  }
  throw new Error("Unbalanced JSON in model output");
}
