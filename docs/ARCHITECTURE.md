# Architecture

## High-level data flow

```
              ┌────────────────────────────────────────────────┐
              │                  Learners (web)                │
              └────────────────────────────────┬───────────────┘
                                               │
                                  Next.js App Router (SSR + Server Actions)
                                               │
                ┌──────────────┬───────────────┼───────────────┬──────────────┐
                ▼              ▼               ▼               ▼              ▼
        /learn (lessons) /practice (exams) /tutor (chat) /flashcards (SR) /dashboard
                │              │               │               │              │
                ▼              ▼               ▼               ▼              ▼
                            Prisma  ─────────────────────  PostgreSQL + pgvector
                              │                                  ▲
                              ▼                                  │
                       BullMQ producers ─────────► Redis ◄──── Workers process
                                                                 │
                                                                 ├─ Microsoft Learn scraper
                                                                 ├─ Transcript ingest + summary
                                                                 ├─ Embedding generation
                                                                 ├─ Exam item generation (Sonnet/Haiku)
                                                                 ├─ Flashcard generation
                                                                 └─ Adaptive recompute + study plans
                                                                 │
                                                                 ▼
                                                       Anthropic API (Claude)
```

## Design principles

1. **Separation of concerns.** Every cross-cutting capability lives behind a
   single module in `src/lib/`. HTTP routes and workers both depend on the same
   helpers; nothing important runs only in one place.
2. **Idempotent pipelines.** The scraper hashes upstream HTML and skips work
   when nothing has changed. Transcript ingestion upserts by source URL. Exam
   generation dedupes by stem prefix.
3. **Cost-tiered AI.** Haiku for cheap content workflows (classification,
   summarisation, exam generation, flashcards). Sonnet only for tutor replies
   and high-quality exam items requested via `highQuality: true`.
4. **Audit by default.** Every Anthropic call writes to `AIGeneration`. Every
   admin action writes to `AuditLog`. Both tables are immutable and indexed
   by (kind, createdAt) so the admin dashboard reads are cheap.
5. **RAG everywhere.** The tutor, exam generator, and summariser all use
   `retrieveGroundingContext` to anchor model output to scraped Microsoft Learn
   blocks (when embeddings are configured) or to keyword matches (fallback).
   This reduces hallucinations and gives the tutor real citations.

## Request lifecycles

### Practice exam build → submit
1. Learner POSTs `/api/exams/build` with `{ mode, title }`.
2. Rate-limit + RBAC checks. `buildExam` samples per-objective by AZ-104 weights
   (or weak-area-biased weights for that user). Missing items trigger a
   synchronous AI fill so the exam is always ready.
3. Server returns `examId`; client navigates to `/practice/[examId]`.
4. `ExamRunner` posts `/api/exams/attempt` to get `attemptId`, then renders
   the timer + question UI.
5. On submit, `/api/exams/submit` records every answer in `QuestionAttempt`,
   calls `scoreAttempt` (Microsoft 1-1000 scaled), enqueues
   `recompute-confidence`, and bumps the streak.
6. Result component shows per-objective breakdown and a PASS/FAIL banner.

### Tutor turn (streaming)
1. Client streams via `fetch` with a `ReadableStream` reader.
2. Server route opens an Anthropic stream from `tutorTurn`, which:
   - loads thread history (last 20 messages),
   - retrieves RAG context for the current unit + question topic,
   - injects weak-area summary,
   - applies prompt-cache breakpoints so the system prompt and grounding
     context are reused across turns within ~5 minutes.
3. Deltas are forwarded as text chunks. Final message + token usage are
   persisted to `TutorMessage` and `AIGeneration`.

### Scraping pipeline
1. Admin POST to `/api/scraper` enqueues `scrape-module` with
   `{ moduleId, sourceUrl }`.
2. Worker:
   - checks robots.txt (cached 1h),
   - fetches the module page (User-Agent set, jittered retry on 429/5xx),
   - extracts unit links,
   - fetches each unit page (rate-limit-aware),
   - decomposes HTML into `ContentBlock` rows,
   - upserts `Module` + `Unit` + `ContentBlock` based on content-hash
     comparison.
3. `embed-content-block` is enqueued for every new block (worker concurrency 4).
4. `classify-exam-focus` is enqueued per unit so the "Likely on Exam" badge
   is populated.
5. `generate-flashcards` may also be enqueued per unit.

## Failure handling

- BullMQ jobs use exponential backoff (`attempts: 5`, `delay: 2000ms`).
- Scraper has its own inner retry layer for transient 429/5xx before the
  BullMQ retry fires.
- The exam generator silently drops items that fail schema validation,
  preserving partial batches.
- Embedding calls degrade gracefully: if `OPENAI_API_KEY` is unset, RAG falls
  back to keyword search and the platform still functions.

## Security

- Auth: NextAuth credentials with bcrypt password hashing. JWT sessions.
- RBAC: `Role` enum on `User`. Server-side guards via
  `requireUser` / `requireRole`.
- Rate limiting: per-user fixed-window via Redis (`/lib/rate-limit.ts`).
  Use Upstash Ratelimit on Vercel Edge for global limits.
- Secrets are loaded from env vars; pino redaction prevents secrets in logs.
- Strict CSP-ish headers in `next.config.ts`.
- `AuditLog` records mutating admin actions with IP + UA.

## Vector search

- `ContentBlock.embedding` and `TranscriptChunk.embedding` are
  `vector(1536)` columns (pgvector).
- Cosine-distance queries (`<=>`) executed via `$queryRawUnsafe` because
  Prisma doesn't natively support vector operators yet.
- Embeddings are generated by any OpenAI-compatible endpoint (configurable),
  so this works with Azure OpenAI, Voyage, Together, Ollama, etc.
- Set `ENABLE_VECTOR_SEARCH=false` to force keyword fallback.
