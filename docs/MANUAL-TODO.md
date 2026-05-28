# Manual TODO — what you need to do by hand

Everything below requires you (a human) because it touches credentials,
billing accounts, external services, or your own decisions. The code is
ready to receive these values; nothing needs to be re-coded.

---

## 1. GitHub housekeeping

- [ ] Open a PR from `claude/azure-elearning-platform-Whxr8` into `main` (or
      whatever default branch you choose).
- [ ] Decide on a license. Repo currently references MIT in `README.md` but
      there's no `LICENSE` file — add one (or change the README).
- [ ] Add a short repo description and topics (`az-104`, `nextjs`, `prisma`,
      `e-learning`, `azure`) on the GitHub repo settings page.

---

## 2. Vercel project setup

- [ ] Create a Vercel account if you don't have one.
- [ ] **Import the repo** at https://vercel.com/new.
- [ ] Framework preset: **Next.js** (auto-detected).
- [ ] Build command: leave as Vercel's default (`next build`). The
      `package.json` script already runs `prisma generate` before build.
- [ ] Set Node.js version to **20.x** in Project Settings → General.
- [ ] **Do not** deploy until env vars are added (next section) — the build
      will fail without `DATABASE_URL`.

---

## 3. Provision Postgres + pgvector

Pick one (free tiers):

- **Neon** (recommended for Vercel): https://neon.tech
  - Create project → copy the **pooled** connection string for app traffic
    and the **direct** connection for migrations.
  - In the Neon SQL Editor run: `CREATE EXTENSION IF NOT EXISTS vector;`
- **Supabase**: project → Database → Extensions → enable `vector`.
- **Vercel Postgres** (now Vercel-managed Neon): one-click attach from
  Project → Storage → Create.

Then:

- [ ] Add `DATABASE_URL` to Vercel env vars (Production, Preview,
      Development).
- [ ] From your laptop (one-time):
      ```bash
      DATABASE_URL="<direct-url>" npx prisma migrate deploy
      DATABASE_URL="<direct-url>" npx tsx prisma/seed.ts
      ```
      The seed populates 23 lessons, 75+ exam questions, 115+ flashcards,
      5 labs, and 20+ knowledge checks — enough to use the platform.

---

## 4. Provision Redis

Vercel doesn't ship a Redis. Options:

- **Upstash** (free tier, REST + native): https://upstash.com
- **Redis Cloud** (free tier): https://redis.com/try-free

- [ ] Add `REDIS_URL` to Vercel env vars.
- [ ] If using Upstash REST mode (recommended for edge):
      - Add `UPSTASH_REDIS_REST_URL`
      - Add `UPSTASH_REDIS_REST_TOKEN`

> Note: BullMQ workers (`src/lib/queue/workers.ts`) need a long-lived
> connection, which Vercel serverless does not provide. You have two
> choices:
> 1. **Skip workers for now.** Everything except the scraper and a few
>    queue-backed admin actions works fine. The AI exam generator runs
>    synchronously in API routes today.
> 2. **Deploy workers separately.** Railway (https://railway.app) or
>    Fly.io are the cheapest options. Build `Dockerfile.worker` and run it
>    pointing at the same Postgres + Redis.

---

## 5. Anthropic API key

- [ ] Create an account at https://console.anthropic.com.
- [ ] Add a billing method. The platform's design defaults to Claude
      Haiku for cheap tasks (summary, exam generation, classification) and
      Sonnet only for the tutor. Expect $5–30/month at moderate usage.
- [ ] Create an API key.
- [ ] Add `ANTHROPIC_API_KEY` to Vercel env vars.
- [ ] **Set a spend alert** in the Anthropic console at 2× your expected
      monthly burn — this protects against runaway loops.

The model identifiers in `.env.example` are already set:
- `ANTHROPIC_FAST_MODEL=claude-haiku-4-5-20251001`
- `ANTHROPIC_SMART_MODEL=claude-sonnet-4-6`

---

## 6. Embeddings provider (optional but recommended)

The RAG layer (semantic search across Microsoft Learn content) needs an
OpenAI-compatible embeddings endpoint. Any of these work:

- **OpenAI** — `https://api.openai.com/v1`, model
  `text-embedding-3-small` (~$0.02 per 1M tokens, very cheap)
- **Azure OpenAI** — your own deployment, same API shape
- **Voyage AI** — OpenAI-compatible
- **Ollama** locally — for development only

- [ ] Add `OPENAI_BASE_URL` and `OPENAI_API_KEY` to Vercel.
- [ ] Or set `ENABLE_VECTOR_SEARCH=false` to fall back to keyword search.

---

## 7. NextAuth secrets

- [ ] Generate a strong secret:
      ```bash
      openssl rand -base64 32
      ```
- [ ] Add as `NEXTAUTH_SECRET` to Vercel env vars.
- [ ] Add `NEXTAUTH_URL` matching your deployment URL (e.g.
      `https://az104.yourdomain.com`).

---

## 8. Create your admin account

After the first deploy succeeds:

- [ ] Browse to `/register` and create your account (any email).
- [ ] In the Neon/Supabase SQL editor, promote yourself to admin:
      ```sql
      UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
      ```
- [ ] Sign out and back in to pick up the new role from the JWT.
- [ ] `/admin` should now be accessible.

---

## 9. Custom domain (optional)

- [ ] In Vercel → Project → Domains, add your domain.
- [ ] Update DNS as instructed.
- [ ] Update `NEXTAUTH_URL` env var to the new domain and redeploy.

---

## 10. Microsoft Learn scraping (optional, when you want richer lesson bodies)

The seeded curriculum (23 units with full markdown bodies) is study-ready,
but the scraper pulls deeper Microsoft Learn content. To use it:

- [ ] Ensure the worker process is running (Phase 4 above).
- [ ] In the admin panel (or via API), POST to `/api/scraper` with
      `{ moduleId, sourceUrl }` per module.
- [ ] Verify `ContentBlock` rows populate and that `ScrapeJob` shows
      `COMPLETED`.
- [ ] Trust-but-verify: read 2-3 scraped units in the UI to confirm
      formatting is reasonable. If a unit fails, check the unit's
      `lastError` in `ScrapeJob`.

> ⚠️ **Respect rate limits.** The scraper already throttles to
> 1.5s/request and checks robots.txt, but don't aim it at non-AZ-104
> Microsoft Learn paths without permission.

---

## 11. Observability (recommended before going live)

- [ ] Create a **Sentry** project (free tier covers small workloads).
- [ ] Add `SENTRY_DSN` env var.
- [ ] Optional: enable Vercel Analytics (one click in dashboard).

---

## 12. Backups and data retention

- [ ] Neon/Supabase: confirm point-in-time recovery is enabled
      (Neon free tier has 7-day PITR; Supabase has daily backups).
- [ ] Decide a long-term archive policy — `pg_dump` weekly to S3 if you
      need >30-day retention.

---

## 13. Generate the first AI exam pool (optional)

Once Anthropic key is configured you can bulk-fill the question bank:

- [ ] As admin, go to `/admin/questions` to see the review queue.
- [ ] From a one-off script (or `psql`), enqueue 5–10 generations per
      `(objective × difficulty)`:
      ```sql
      -- example: trigger via API
      curl -X POST https://your-app/api/exams/build \
        -H "Cookie: <your-session>" \
        -d '{"mode":"WEAK_AREA","title":"AI seed batch","totalQuestions":50}'
      ```
- [ ] Review and approve the AI-generated items in `/admin/questions`.

Budget: ~$2–5 for ~50 Sonnet-quality questions.

---

## 14. Stuff you DON'T have to do

- ✗ Build any code — everything is committed.
- ✗ Configure Docker — not needed on Vercel; the `docker-compose.yml`
  is only for local dev.
- ✗ Set up CI manually — `.github/workflows/ci.yml` runs typecheck,
  lint, tests, and build on every push.
- ✗ Manually load curriculum, questions, or flashcards — `npx tsx
  prisma/seed.ts` handles all of it.

---

## Order of operations cheat sheet

1. Push branch to GitHub (already done).
2. Provision Neon (Postgres + pgvector).
3. Provision Upstash (Redis).
4. Anthropic key + spend alert.
5. (Optional) Embeddings provider.
6. Vercel: import repo, add all env vars, deploy.
7. Run migrations + seed from your laptop (one-off).
8. Register account → promote to ADMIN in SQL.
9. (Optional) Custom domain.
10. (Optional) Deploy worker on Railway/Fly for background jobs.
11. (Optional) Bulk AI-generate exam questions; review and approve.
