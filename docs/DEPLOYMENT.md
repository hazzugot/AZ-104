# Deployment

## Option A — Vercel + managed services (recommended)

| Component | Service |
|---|---|
| Web (Next.js) | Vercel |
| Postgres + pgvector | Neon, Supabase, or Vercel Postgres |
| Redis | Upstash |
| Workers | Railway, Fly.io, Render, or AWS ECS (Fargate) |
| Object storage (future) | S3 / Azure Blob |

### Steps

1. **Create databases**:
   - Neon/Supabase Postgres → enable `vector` extension (`CREATE EXTENSION vector;`).
   - Upstash Redis → copy the `REDIS_URL` and (optionally) the REST credentials.
2. **Configure Vercel**:
   - Import the repo. Framework: Next.js.
   - Add env vars from `.env.example`. Generate `NEXTAUTH_SECRET` with
     `openssl rand -base64 32`.
   - Set Node 20 as the runtime (Project Settings → Node.js Version).
3. **Database migration**:
   - From local: `DATABASE_URL=… npx prisma migrate deploy && npx tsx prisma/seed.ts`
4. **Worker deployment**:
   - Build the worker image: `docker build -f Dockerfile.worker -t az104-worker .`
   - Push to your registry and deploy with the same `DATABASE_URL`, `REDIS_URL`,
     `ANTHROPIC_API_KEY`. Auto-scale on `WORKER_CONCURRENCY` and replica count.

## Option B — Self-hosted with Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec web npx prisma migrate deploy
docker compose exec web npx tsx prisma/seed.ts
```

This boots Postgres (with pgvector), Redis, the Next.js web tier, and the
worker process on a single host. Suitable for staging or small-scale prod.

## Option C — Kubernetes

Use the same two images (`Dockerfile`, `Dockerfile.worker`). Run web as a
Deployment behind a Service + Ingress. Run worker as a separate Deployment
(or StatefulSet if you want sticky job-ID logging). Provide Postgres + Redis
via your operator of choice.

## Production checklist

- [ ] `DATABASE_URL` points to a managed Postgres with pgvector
- [ ] `NEXTAUTH_SECRET` is a strong random value (not the example)
- [ ] `ANTHROPIC_API_KEY` set; spend alert configured in Anthropic console
- [ ] Worker process is running and consuming all queues
- [ ] CDN / edge cache enabled for `/learn/*` static content
- [ ] Sentry DSN configured for both web and worker
- [ ] Backup schedule on Postgres (daily, 30-day retention minimum)
- [ ] Rate-limit thresholds (`/lib/rate-limit.ts`) tuned to your tier
- [ ] Admin user provisioned and `Role` set to `ADMIN` directly in DB
- [ ] HTTPS termination + HSTS at the edge (Vercel does this automatically)
