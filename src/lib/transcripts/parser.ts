/**
 * Transcript parser + chunker.
 *
 * Accepts WebVTT or SRT (most caption sources). Produces:
 *   - Cleaned plain text with timestamps preserved per cue
 *   - Topic-aware chunks (~1500 chars, max 60s spans) for embedding & RAG
 *
 * Chunking strategy: cumulative window that closes either at the
 * character budget or when a topic-shift heuristic fires
 * (long pause + heading-like first sentence).
 */

export interface Cue {
  startSec: number;
  endSec: number;
  text: string;
}

const TIMESTAMP_RE =
  /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/;

export function parseTranscript(raw: string): Cue[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const cues: Cue[] = [];
  let current: Cue | null = null;
  for (const line of lines) {
    const m = line.match(TIMESTAMP_RE);
    if (m) {
      if (current) cues.push(current);
      const start = toSec(m[1]!, m[2]!, m[3]!, m[4]!);
      const end = toSec(m[5]!, m[6]!, m[7]!, m[8]!);
      current = { startSec: start, endSec: end, text: "" };
      continue;
    }
    if (!current) continue;
    if (line.trim() === "") {
      if (current.text) {
        cues.push(current);
        current = null;
      }
      continue;
    }
    if (/^WEBVTT/i.test(line) || /^\d+$/.test(line.trim())) continue;
    current.text += (current.text ? " " : "") + line.trim();
  }
  if (current?.text) cues.push(current);
  return cues;
}

function toSec(h: string, m: string, s: string, ms: string) {
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
}

export interface TranscriptChunkInput {
  orderIndex: number;
  startSec: number;
  endSec: number;
  text: string;
}

export function chunkCues(
  cues: Cue[],
  opts: { maxChars?: number; maxSpanSec?: number } = {},
): TranscriptChunkInput[] {
  const maxChars = opts.maxChars ?? 1500;
  const maxSpan = opts.maxSpanSec ?? 90;
  const chunks: TranscriptChunkInput[] = [];

  let buf: Cue[] = [];
  let chars = 0;
  let order = 0;

  const flush = () => {
    if (!buf.length) return;
    chunks.push({
      orderIndex: order++,
      startSec: buf[0]!.startSec,
      endSec: buf[buf.length - 1]!.endSec,
      text: buf.map((c) => c.text).join(" "),
    });
    buf = [];
    chars = 0;
  };

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i]!;
    const prev = cues[i - 1];
    const gap = prev ? cue.startSec - prev.endSec : 0;
    const isTopicShift = gap > 2.5 && /^[A-Z][^.!?]{0,80}[.!?]?$/.test(cue.text.trim());

    if (
      buf.length &&
      (chars + cue.text.length > maxChars ||
        cue.endSec - buf[0]!.startSec > maxSpan ||
        isTopicShift)
    ) {
      flush();
    }

    buf.push(cue);
    chars += cue.text.length + 1;
  }
  flush();
  return chunks;
}

export function flatten(cues: Cue[]): string {
  return cues.map((c) => c.text).join(" ");
}
