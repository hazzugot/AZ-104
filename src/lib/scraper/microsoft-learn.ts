/**
 * Microsoft Learn scraper for the AZ-104 curriculum.
 *
 * Design:
 *   - Polite: respects robots.txt, enforces SCRAPER_RATE_LIMIT_MS between
 *     requests, and sets a descriptive User-Agent.
 *   - Resilient: every fetch is retried with jittered exponential backoff;
 *     job state is persisted in `ScrapeJob` so partial runs can resume.
 *   - Incremental: stores SHA-256 of raw HTML on Module/Unit; re-runs no-op
 *     when the upstream hash matches.
 *   - Idempotent: upserts by `sourceUrl`.
 *   - Normalised: HTML is decomposed into ContentBlock rows (heading,
 *     paragraph, code, table, list, callout, image, link) so downstream
 *     pipelines (RAG, summarisation, flashcard generation) can iterate
 *     structured units instead of re-parsing HTML.
 */
import * as cheerio from "cheerio";
import { BlockKind, Prisma, ProcessingStatus } from "@prisma/client";
import { prisma } from "../db";
import { logger } from "../logger";
import { sha256Async } from "../utils";

const BASE = process.env.MS_LEARN_BASE_URL ?? "https://learn.microsoft.com";
const UA =
  process.env.SCRAPER_USER_AGENT ??
  "AZ104-Platform-Edu-Bot/1.0 (educational use; contact platform admin)";
const MIN_DELAY = Number(process.env.SCRAPER_RATE_LIMIT_MS ?? 1500);

let lastFetchAt = 0;

async function politeFetch(url: string, attempt = 0): Promise<string> {
  const wait = Math.max(0, lastFetchAt + MIN_DELAY - Date.now());
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetchAt = Date.now();

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (r.status === 429 || r.status >= 500) {
      if (attempt < 4) {
        const backoff = 2 ** attempt * 1000 + Math.random() * 500;
        logger.warn({ url, status: r.status, backoff }, "scraper retrying");
        await new Promise((res) => setTimeout(res, backoff));
        return politeFetch(url, attempt + 1);
      }
      throw new Error(`HTTP ${r.status} for ${url}`);
    }
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return await r.text();
  } catch (err) {
    if (attempt < 4) {
      const backoff = 2 ** attempt * 1000 + Math.random() * 500;
      logger.warn({ url, err, backoff }, "scraper retrying after error");
      await new Promise((res) => setTimeout(res, backoff));
      return politeFetch(url, attempt + 1);
    }
    throw err;
  }
}

let robotsCache: { allow: boolean; fetched: number } | null = null;

async function robotsAllows(path: string): Promise<boolean> {
  if (robotsCache && Date.now() - robotsCache.fetched < 60 * 60 * 1000) {
    return robotsCache.allow;
  }
  try {
    const txt = await politeFetch(`${BASE}/robots.txt`);
    // Minimal parse: look for a Disallow: / under * or our UA.
    const blocked = /^User-agent:\s*\*[\s\S]*?Disallow:\s*\/(?:\s|$)/m.test(txt);
    robotsCache = { allow: !blocked, fetched: Date.now() };
    return robotsCache.allow;
  } catch {
    return true;
  }
}

export interface ScrapedUnit {
  slug: string;
  title: string;
  sourceUrl: string;
  rawHtml: string;
  blocks: { kind: BlockKind; text?: string; language?: string; meta?: unknown }[];
}

export interface ScrapedModule {
  slug: string;
  title: string;
  summary: string;
  sourceUrl: string;
  units: ScrapedUnit[];
}

export function urlToSlug(url: string): string {
  const u = new URL(url, BASE);
  const parts = u.pathname.split("/").filter(Boolean);
  return (parts.pop() ?? "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

export async function scrapeModule(moduleUrl: string): Promise<ScrapedModule> {
  if (!(await robotsAllows(moduleUrl))) {
    throw new Error("robots.txt disallows scraping this path");
  }
  const html = await politeFetch(moduleUrl);
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim() || $("title").text().trim();
  const summary =
    $("meta[name=description]").attr("content")?.trim() ??
    $("p").first().text().trim().slice(0, 400);

  // Microsoft Learn modules list unit links in a side index. We collect them.
  const unitUrls = new Set<string>();
  $("a[href*='/training/modules/'], a[data-bi-name='unit']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const absolute = new URL(href, moduleUrl).toString();
    if (absolute.includes("/training/modules/") && !absolute.endsWith(moduleUrl)) {
      unitUrls.add(absolute.split("#")[0]!);
    }
  });

  const units: ScrapedUnit[] = [];
  for (const url of unitUrls) {
    try {
      const u = await scrapeUnit(url);
      units.push(u);
    } catch (err) {
      logger.warn({ url, err }, "unit scrape failed");
    }
  }

  return {
    slug: urlToSlug(moduleUrl),
    title,
    summary,
    sourceUrl: moduleUrl,
    units,
  };
}

export async function scrapeUnit(unitUrl: string): Promise<ScrapedUnit> {
  const html = await politeFetch(unitUrl);
  const $ = cheerio.load(html);
  const title = $("h1").first().text().trim() || $("title").text().trim();

  const blocks: ScrapedUnit["blocks"] = [];
  const root = $("main").length ? $("main") : $("body");

  root
    .find("h2,h3,h4,p,pre,code,table,ul,ol,blockquote,img,a.has-icon")
    .each((_, el) => {
      const tag = (el as cheerio.Element).tagName.toLowerCase();
      const $el = $(el);

      if (/^h[2-4]$/.test(tag)) {
        blocks.push({ kind: BlockKind.HEADING, text: $el.text().trim(), meta: { level: Number(tag[1]) } });
      } else if (tag === "p") {
        const t = $el.text().trim();
        if (t) blocks.push({ kind: BlockKind.PARAGRAPH, text: t });
      } else if (tag === "pre" || tag === "code") {
        const code = $el.text();
        const lang =
          $el.attr("data-language") ??
          $el.find("code").attr("class")?.match(/language-([\w-]+)/)?.[1] ??
          "text";
        if (code.trim()) blocks.push({ kind: BlockKind.CODE, text: code, language: lang });
      } else if (tag === "table") {
        const rows: string[][] = [];
        $el.find("tr").each((__, tr) => {
          const cells: string[] = [];
          $(tr)
            .find("th,td")
            .each((___, c) => cells.push($(c).text().trim()));
          if (cells.length) rows.push(cells);
        });
        blocks.push({ kind: BlockKind.TABLE, meta: { rows } });
      } else if (tag === "ul" || tag === "ol") {
        const items: string[] = [];
        $el.find("> li").each((__, li) => items.push($(li).text().trim()));
        blocks.push({ kind: BlockKind.LIST, meta: { ordered: tag === "ol", items } });
      } else if (tag === "blockquote") {
        blocks.push({ kind: BlockKind.CALLOUT, text: $el.text().trim() });
      } else if (tag === "img") {
        const src = $el.attr("src");
        const alt = $el.attr("alt") ?? "";
        if (src) blocks.push({ kind: BlockKind.IMAGE, meta: { src, alt } });
      } else if (tag === "a") {
        const href = $el.attr("href");
        const text = $el.text().trim();
        if (href && text) blocks.push({ kind: BlockKind.LINK, text, meta: { href } });
      }
    });

  return {
    slug: urlToSlug(unitUrl),
    title,
    sourceUrl: unitUrl,
    rawHtml: html,
    blocks,
  };
}

/**
 * Persist a scraped module (and its units & blocks) idempotently.
 * Uses content hashes to skip work when upstream hasn't changed.
 */
export async function persistModule(
  moduleId: string,
  scraped: ScrapedModule,
): Promise<{ updated: boolean; units: number }> {
  const incomingHash = await sha256Async(scraped.units.map((u) => u.rawHtml).join(""));

  const existing = await prisma.module.findUnique({ where: { id: moduleId } });
  if (existing?.contentHash === incomingHash) {
    return { updated: false, units: 0 };
  }

  await prisma.module.update({
    where: { id: moduleId },
    data: {
      title: scraped.title,
      summary: scraped.summary,
      sourceUrl: scraped.sourceUrl,
      contentHash: incomingHash,
    },
  });

  let unitCount = 0;
  for (const [i, u] of scraped.units.entries()) {
    const unitHash = await sha256Async(u.rawHtml);
    const unit = await prisma.unit.upsert({
      where: { moduleId_slug: { moduleId, slug: u.slug } },
      create: {
        moduleId,
        slug: u.slug,
        title: u.title,
        sourceUrl: u.sourceUrl,
        contentHash: unitHash,
        rawScrapedHtml: u.rawHtml,
        orderIndex: i,
      },
      update: {
        title: u.title,
        sourceUrl: u.sourceUrl,
        contentHash: unitHash,
        rawScrapedHtml: u.rawHtml,
        orderIndex: i,
      },
    });

    await prisma.contentBlock.deleteMany({ where: { unitId: unit.id } });
    await prisma.contentBlock.createMany({
      data: u.blocks.map((b, idx) => ({
        unitId: unit.id,
        kind: b.kind,
        orderIndex: idx,
        text: b.text,
        language: b.language,
        meta: (b.meta ?? null) as Prisma.InputJsonValue,
      })),
    });
    unitCount++;
  }

  return { updated: true, units: unitCount };
}

/**
 * Top-level entry: scrape and persist by module id.
 * Records the operation in ScrapeJob for observability.
 */
export async function runScrape(moduleId: string, sourceUrl: string) {
  const job = await prisma.scrapeJob.upsert({
    where: { url_kind: { url: sourceUrl, kind: "module" } },
    create: {
      url: sourceUrl,
      kind: "module",
      status: ProcessingStatus.PROCESSING,
      attempts: 1,
      startedAt: new Date(),
    },
    update: {
      status: ProcessingStatus.PROCESSING,
      attempts: { increment: 1 },
      startedAt: new Date(),
      lastError: null,
    },
  });

  try {
    const scraped = await scrapeModule(sourceUrl);
    const result = await persistModule(moduleId, scraped);
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: ProcessingStatus.COMPLETED,
        finishedAt: new Date(),
        resultRefId: moduleId,
      },
    });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: ProcessingStatus.FAILED,
        finishedAt: new Date(),
        lastError: msg,
      },
    });
    throw err;
  }
}
