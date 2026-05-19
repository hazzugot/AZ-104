/**
 * One-shot CLI: scrape an AZ-104 module page synchronously (no queue).
 * Useful for local development and seeding.
 *
 *   pnpm tsx scripts/run-scraper.ts <moduleSlug> <sourceUrl>
 */
import { prisma } from "../src/lib/db";
import { runScrape } from "../src/lib/scraper/microsoft-learn";

async function main() {
  const [slug, url] = process.argv.slice(2);
  if (!slug || !url) {
    console.error("Usage: tsx scripts/run-scraper.ts <moduleSlug> <sourceUrl>");
    process.exit(1);
  }
  const mod = await prisma.module.findUnique({ where: { slug } });
  if (!mod) {
    console.error(`Module '${slug}' not found. Run pnpm prisma:seed first.`);
    process.exit(1);
  }
  console.log(`Scraping ${url} → ${slug}...`);
  const result = await runScrape(mod.id, url);
  console.log("Done:", result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
