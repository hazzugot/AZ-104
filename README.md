# AZ-104 Platform

Production-grade e-learning platform for the **Microsoft AZ-104 (Azure
Administrator)** certification. Combines Microsoft Learn curriculum, AI-generated
practice exams, adaptive study plans, and a context-aware AI tutor.

> Status: scaffold complete. All subsystems have real, working implementations.
> Install dependencies, configure `.env`, and run `pnpm prisma migrate dev &&
> pnpm prisma:seed && pnpm dev` to boot the platform locally.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript** strict mode
- **TailwindCSS** + **shadcn/ui** conventions
- **PostgreSQL** with **pgvector** for semantic search / RAG
- **Prisma** ORM with audited schema
- **Redis** caching + **BullMQ** background workers
- **Anthropic Claude** (Haiku for cheap/fast, Sonnet for deep reasoning) behind
  an OpenAI-compatible abstraction
- **NextAuth v5** credentials + Prisma adapter, RBAC roles
- **Docker** compose for local stack, **Vercel**-ready for serverless

## Architecture

```
┌──────────────┐   ┌──────────────────────┐
│ Next.js (SSR)│──▶│  /api routes (RBAC,  │
│ App Router   │   │  rate limit, audit)  │
└──────┬───────┘   └─────┬────────────────┘
       │ Server Comp.    │
       ▼                 ▼
   Prisma ───────▶ PostgreSQL (pgvector)
                       ▲
                       │ embeddings / writes
   BullMQ ◀── Redis ──▶ Workers (scraper,
                       │  summariser, exam
                       │  generator, embedder,
                       │  study plan builder)
                       │
   Anthropic SDK ◀─────┘
   (Haiku + Sonnet)
```

## Subsystems

| Area | Module | Notes |
|---|---|---|
| AI client | [`src/lib/ai/client.ts`](src/lib/ai/client.ts) | Tier-based (fast/smart), prompt-caching, cost audit |
| Prompts | [`src/lib/ai/prompts.ts`](src/lib/ai/prompts.ts) | Microsoft-style exam tone, few-shot, versioned |
| Exam generator | [`src/lib/ai/exam-generator.ts`](src/lib/ai/exam-generator.ts) | Schema-validated, deduped, NEEDS_REVIEW gating |
| Tutor (streaming) | [`src/lib/ai/tutor.ts`](src/lib/ai/tutor.ts) | RAG-grounded, weak-area aware |
| Summariser | [`src/lib/ai/summarizer.ts`](src/lib/ai/summarizer.ts) | Transcripts, flashcards, exam-focus classifier |
| RAG | [`src/lib/ai/rag.ts`](src/lib/ai/rag.ts) | pgvector cosine + keyword fallback |
| Scraper | [`src/lib/scraper/microsoft-learn.ts`](src/lib/scraper/microsoft-learn.ts) | Polite, hashed, incremental, idempotent |
| Transcripts | [`src/lib/transcripts/`](src/lib/transcripts/) | VTT/SRT parser, topic-aware chunker |
| Queue | [`src/lib/queue/`](src/lib/queue/) | BullMQ producers + worker process |
| Adaptive | [`src/lib/adaptive.ts`](src/lib/adaptive.ts) | EWMA mastery + decay, recommendations |
| Spaced repetition | [`src/lib/spaced-repetition.ts`](src/lib/spaced-repetition.ts) | SM-2 with unit tests |
| Study plan | [`src/lib/study-plan.ts`](src/lib/study-plan.ts) | Weight-biased daily schedule |
| Auth/RBAC | [`src/lib/auth.ts`](src/lib/auth.ts), [`src/lib/rbac.ts`](src/lib/rbac.ts) | NextAuth v5 + Role guards |

## Getting started

```bash
# 1. Install
npm install

# 2. Boot deps (Postgres + Redis)
docker compose up -d postgres redis

# 3. Configure
cp .env.example .env
# Edit ANTHROPIC_API_KEY, NEXTAUTH_SECRET, etc.

# 4. Migrate + seed
npx prisma migrate dev
npx tsx prisma/seed.ts

# 5. Run dev server
npm run dev

# 6. (optional) Workers in another terminal
npm run worker
```

## Deployment

- **Vercel**: deploy `web` directly. Use Vercel Postgres + Upstash Redis, or
  managed Postgres (Neon, Supabase) + Upstash. Add `ANTHROPIC_API_KEY` and
  `NEXTAUTH_SECRET` to project env. Workers run separately (Railway, Fly,
  Render, ECS) using `Dockerfile.worker`.
- **Self-hosted**: `docker compose up --build` boots web + worker + Postgres +
  Redis on one host.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for details.

## Cost optimisation

- Default model is Haiku for summarisation, classification, exam generation
  (~6× cheaper than Sonnet). Tutor uses Sonnet for quality.
- System prompts and curriculum context are sent with `cache_control: ephemeral`
  so repeated tutor turns and exam generations only pay full input cost once
  per ~5 minutes per breakpoint.
- All Anthropic calls are persisted in `AIGeneration` with token + cost
  attribution, surfaced in the admin dashboard.
- Background generation runs through BullMQ so a single expensive call never
  blocks a user request.

## Observability

- Structured `pino` logs with redaction of secrets.
- `AuditLog` table records sensitive admin actions.
- `ScrapeJob` and `AIGeneration` tables provide pipeline-level introspection.
- Hook up Sentry by setting `SENTRY_DSN` (wire-up TODO in `instrumentation.ts`).

## Testing

```bash
npm test
```

Unit tests cover the SM-2 scheduler and transcript parser. Integration tests
should be added per route as the platform matures.

## Further reading

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design and data flow
- [`docs/ERD.md`](docs/ERD.md) — entity-relationship diagram
- [`docs/PROMPTS.md`](docs/PROMPTS.md) — prompt engineering strategy
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel + Docker deployment
- [`docs/QUEUES.md`](docs/QUEUES.md) — job architecture, retries, observability

## License

MIT.
