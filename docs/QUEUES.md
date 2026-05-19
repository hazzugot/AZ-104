# Queues & Background Jobs

All long-running or AI-bound work runs in BullMQ workers. The web tier
enqueues jobs and returns immediately; results land in Postgres where the
UI picks them up on the next render.

## Queues

| Name | Purpose | Concurrency | Typical latency |
|---|---|---|---|
| `scrape-module` | Microsoft Learn scraper for one module + its units | 2 | 30s–3m |
| `ingest-transcript` | Parse + persist VTT/SRT, generate chunks + embeddings | 4 | 5–30s |
| `summarize-transcript` | Claude Haiku summary, takeaways, glossary | 6 | 3–8s |
| `embed-content-block` | Single block → embedding column | 4 | <1s |
| `classify-exam-focus` | Marks unit as likely-on-exam, traps, memorize list | 4 | 3–6s |
| `generate-flashcards` | Atomic-fact flashcards from a unit | 3 | 5–10s |
| `generate-exam` | Generate AZ-104 questions or build a full exam | 2 | 8–60s |
| `recompute-confidence` | Per-objective mastery refresh for a user | high | <1s |
| `build-study-plan` | Daily plan generator | 2 | 1–3s |

## Retry policy

Every queue uses:

```ts
attempts: 5
backoff: { type: "exponential", delay: 2000 }
removeOnComplete: 100
removeOnFail: 500
```

Scraper requests have an inner retry layer (jittered exponential, 4 attempts)
before BullMQ's outer retry, because transient 429s from Microsoft Learn are
common and shouldn't burn the queue retry budget.

## Producers

- Web `/api/scraper`, `/api/transcripts`, `/api/exams/submit` enqueue from
  user actions.
- The scraper worker chains `embed-content-block` and `classify-exam-focus`
  after persisting blocks.
- A cron (or Vercel scheduled function) can enqueue nightly
  `recompute-confidence` jobs for active users to keep mastery values fresh.

## Observability

- BullMQ exposes `Worker.on("failed" / "completed" / "stalled")` events —
  forward these to logs and Sentry.
- `ScrapeJob` and `Transcript.status` give domain-level state independent of
  BullMQ internals.
- `AIGeneration` rows capture every Anthropic call from a worker, including
  cost, latency, and ref to the produced entity.

## Scaling

- Horizontal: run more `Dockerfile.worker` replicas; each opens its own
  Redis connection pool.
- Vertical: bump `WORKER_CONCURRENCY` per replica.
- Backpressure: web routes never `await` queue completion (except exam
  generation, which is fast enough to be synchronous in the request path).
- Cost ceiling: if monthly Anthropic spend approaches budget, the admin
  dashboard exposes a kill switch (set `ENABLE_AI_EXAM_GENERATION=false`) and
  the exam builder falls back to APPROVED-only sampling.
