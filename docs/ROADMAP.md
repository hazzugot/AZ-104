# Continuation Roadmap

The scaffold compiles a complete platform. To take it to production-ready,
work through the phases below in order. Each phase is independently shippable.

---

## Phase 0 — Local boot (≈ 30 min)

Verify everything wires together on your machine.

```bash
# Install
npm install

# Boot infra
docker compose up -d postgres redis

# Configure
cp .env.example .env
# Required edits: NEXTAUTH_SECRET (openssl rand -base64 32), ANTHROPIC_API_KEY

# Schema + seed
npx prisma migrate dev --name init
npx tsx prisma/seed.ts

# Dev server (terminal 1)
npm run dev

# Workers (terminal 2)
npm run worker

# Tests
npm test
```

Open http://localhost:3000. The seeded curriculum will appear at `/learn`
even before any scraping.

**Gotchas to fix at this stage**
- pgvector extension: if Prisma migrate complains, run `CREATE EXTENSION IF NOT EXISTS vector;` in psql first.
- If `next-auth` v5 beta is unstable on your Node version, pin to a stable beta in `package.json`.
- Create your first admin user manually: `INSERT INTO "User"` row, then `UPDATE "User" SET role = 'ADMIN' WHERE email = '...'`.

---

## Phase 1 — Content ingestion (1–2 days)

The scaffold has a scraper but no real Microsoft Learn data yet.

1. **Crawl the AZ-104 path**
   - In `prisma/seed.ts`, the `MODULES[*].sourceUrl` is currently absent. Add the canonical Microsoft Learn URL for each module:
     ```
     https://learn.microsoft.com/training/modules/<slug>/
     ```
   - From the admin panel (or via `tsx scripts/run-scraper.ts <slug> <url>`), trigger a scrape per module.
   - Verify `ContentBlock` rows populate. Check `ScrapeJob` for any failures.

2. **Generate embeddings**
   - Set `OPENAI_BASE_URL` + `OPENAI_API_KEY` (any provider — Azure OpenAI, Voyage, Together, Ollama).
   - The scraper worker auto-enqueues `embed-content-block` per block — make sure the worker is running.
   - Spot-check vector quality with a manual `retrieveGroundingContext({ topic: "NSG" })` in a REPL.

3. **Ingest transcripts** (optional but recommended)
   - Source VTT transcripts from your video library or Microsoft Learn captions.
   - POST `/api/transcripts` (instructor role) with `{ sourceUrl, rawVtt, unitId? }`.
   - Worker chain: ingest → summarise → embed chunks.

4. **Classify exam focus & generate flashcards**
   - For each unit, enqueue `classify-exam-focus` and `generate-flashcards` once content is in.
   - Review the AI output in the admin UI.

---

## Phase 2 — AI exam pool (1–2 days)

You want ~500 approved questions before opening to learners.

1. **Generate**
   - Loop: for each `(objective × difficulty)` pair, enqueue `generate-exam` with `count: 10, highQuality: true`.
   - Expected cost (Sonnet, ~3500 output tokens × 100 batches) ≈ $5–15.

2. **Review**
   - Build the admin review queue UI at `/admin/questions` (not yet scaffolded — see Phase 4).
   - For each NEEDS_REVIEW question, instructor approves/rejects/edits; the route handler is already wired (`/api/admin/review-question`).
   - Target: ≥80 approved questions per objective.

3. **Test exam quality**
   - Trigger a full timed mock. Sanity-check that the score distribution and per-objective coverage look right.

---

## Phase 3 — Auth & user flow (1 day)

The scaffold uses NextAuth credentials. Tighten before launch:

- Add an email-verification flow (Resend/Postmark + a one-time-link route).
- Add OAuth providers (`MicrosoftEntraID` is the right choice for AZ-104 audience). Provider config goes in `src/lib/auth.ts`.
- Build a registration page (`/register`) that bcrypt-hashes the password and creates the `User` row.
- Add password reset.
- Enforce email-verified gates on protected routes via `requireUser` extension.

---

## Phase 4 — Missing UI surfaces (2–3 days)

Pages that have routes/components but need scaffolding:

| Page | Effort | Notes |
|---|---|---|
| `/admin/questions` | M | List `reviewStatus: NEEDS_REVIEW`, editor for stem/options/explanation, approve/reject buttons calling `/api/admin/review-question`. |
| `/admin/users` | S | List, role change, deactivate. |
| `/admin/jobs` | S | BullMQ dashboards — recommend mounting `@bull-board/express` at `/admin/queues`. |
| `/learn/[…]/unit/[id]/lab` | M | Tabbed renderer for the existing `LabGuide` JSON (portal / CLI / PowerShell / Bicep / Terraform). |
| `/study-plan` | M | Read `StudyPlan.items`, render a calendar; "regenerate" button enqueues `build-study-plan`. |
| `/register` | S | Form → bcrypt hash → `prisma.user.create`. |
| Question review inline on exam result | S | After submission, show explanations + distractor rationale per item. |

---

## Phase 5 — Polish & observability (1–2 days)

- **Sentry**: install `@sentry/nextjs`, wire `instrumentation.ts` and a worker hook.
- **BullMQ events**: forward `failed` / `stalled` events to Sentry.
- **Rate-limit tuning**: replace `lib/rate-limit.ts` with `@upstash/ratelimit` on the edge for global limits.
- **Image OG**: add `app/opengraph-image.tsx` for social previews.
- **Sitemap / robots**: `app/sitemap.ts`, `app/robots.ts`.
- **Accessibility audit**: keyboard nav through exam runner, ARIA labels on flashcards, focus rings.
- **Mobile pass**: tighten tutor chat on small screens; verify exam runner side panel collapses cleanly.

---

## Phase 6 — Deploy (≈ half a day)

Follow [`docs/DEPLOYMENT.md`](DEPLOYMENT.md).

Pre-launch checklist:
- [ ] All migrations applied on prod DB
- [ ] `vector` extension confirmed
- [ ] Seed run on prod
- [ ] Admin user provisioned and verified
- [ ] Anthropic spend alert set at 2× expected monthly burn
- [ ] Sentry receiving events from both web and worker
- [ ] DB backup schedule active
- [ ] HTTPS + HSTS at the edge

---

## Phase 7 — Growth experiments (ongoing)

Once live, the architecture supports:

- **Spaced-repetition tuning**: A/B test SM-2 vs FSRS by routing 10% of new users to a different scheduler.
- **Prompt versions**: shadow-evaluate new exam prompts via the `PromptVersion` system; compare `qualityScore` deltas.
- **Personalised cadence**: vary `weeklyHours` recommendation per user based on observed throughput.
- **Multi-cert**: the schema is exam-agnostic — `LearningPath` can model AZ-204, AZ-305, etc. Only `ExamObjective` is AZ-104-specific (refactor to a per-path table when expanding).

---

## Preview

A static HTML preview of the UI lives at [`public/preview.html`](../public/preview.html).
Open it directly in any browser to see the dashboard, curriculum, exam runner,
flashcards, tutor, and admin views without booting the backend.
