import { prisma } from "../db";
import { embedText } from "../ai/rag";
import { stripFiller } from "../ai/summarizer";
import { parseTranscript, chunkCues, flatten } from "./parser";
import { logger } from "../logger";

export interface IngestInput {
  sourceUrl: string;
  rawVtt: string;
  unitId?: string;
  videoTitle?: string;
  language?: string;
}

/**
 * Ingest a single transcript: persist, chunk, embed.
 * Summarisation runs as a separate queue job (summarizer.summarizeTranscript).
 */
export async function ingestTranscript(input: IngestInput) {
  const cues = parseTranscript(input.rawVtt);
  if (!cues.length) throw new Error("Transcript contained no cues");

  const flat = flatten(cues);
  const cleaned = stripFiller(flat);

  const transcript = await prisma.transcript.create({
    data: {
      sourceUrl: input.sourceUrl,
      unitId: input.unitId,
      videoTitle: input.videoTitle,
      language: input.language ?? "en",
      rawText: flat,
      cleanedText: cleaned,
      status: "PENDING",
    },
  });

  const chunks = chunkCues(cues);
  for (const ch of chunks) {
    const created = await prisma.transcriptChunk.create({
      data: {
        transcriptId: transcript.id,
        orderIndex: ch.orderIndex,
        startSec: ch.startSec,
        endSec: ch.endSec,
        text: ch.text,
      },
    });
    const embedding = await embedText(ch.text);
    if (embedding) {
      // Raw SQL because Prisma doesn't yet expose a typed setter for vector columns.
      const vec = `[${embedding.join(",")}]`;
      await prisma
        .$executeRawUnsafe(
          `UPDATE "TranscriptChunk" SET embedding = $1::vector WHERE id = $2`,
          vec,
          created.id,
        )
        .catch((err) => logger.warn({ err }, "embedding update failed"));
    }
  }

  return transcript;
}
