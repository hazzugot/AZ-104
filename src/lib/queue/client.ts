/**
 * BullMQ queue client. Queues are typed by name so producers and workers
 * stay in sync.
 */
import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

export type JobName =
  | "scrape-module"
  | "summarize-transcript"
  | "ingest-transcript"
  | "embed-content-block"
  | "classify-exam-focus"
  | "generate-flashcards"
  | "generate-exam"
  | "recompute-confidence"
  | "build-study-plan";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const queues: Record<JobName, Queue> = {
  "scrape-module": new Queue("scrape-module", { connection }),
  "summarize-transcript": new Queue("summarize-transcript", { connection }),
  "ingest-transcript": new Queue("ingest-transcript", { connection }),
  "embed-content-block": new Queue("embed-content-block", { connection }),
  "classify-exam-focus": new Queue("classify-exam-focus", { connection }),
  "generate-flashcards": new Queue("generate-flashcards", { connection }),
  "generate-exam": new Queue("generate-exam", { connection }),
  "recompute-confidence": new Queue("recompute-confidence", { connection }),
  "build-study-plan": new Queue("build-study-plan", { connection }),
};

export const queueEvents: Record<JobName, QueueEvents> = Object.fromEntries(
  Object.keys(queues).map((name) => [
    name,
    new QueueEvents(name, { connection: connection.duplicate() }),
  ]),
) as Record<JobName, QueueEvents>;

export async function enqueue<T = unknown>(
  name: JobName,
  data: T,
  opts: { delay?: number; priority?: number; jobId?: string } = {},
) {
  return queues[name].add(name, data, {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
    ...opts,
  });
}

export { connection };
