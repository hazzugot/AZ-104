import { describe, it, expect } from "vitest";
import { parseTranscript, chunkCues, flatten } from "../transcripts/parser";

const SAMPLE_VTT = `WEBVTT

1
00:00:01.000 --> 00:00:04.500
Welcome to Azure storage accounts.

2
00:00:04.600 --> 00:00:09.200
A storage account provides a unique namespace for your data.

3
00:00:12.000 --> 00:00:16.000
Performance tiers include Standard and Premium.
`;

describe("transcript parser", () => {
  it("parses VTT into cues with timestamps", () => {
    const cues = parseTranscript(SAMPLE_VTT);
    expect(cues).toHaveLength(3);
    expect(cues[0]!.startSec).toBeCloseTo(1.0);
    expect(cues[0]!.text).toContain("Azure storage accounts");
  });

  it("flattens cues to plain text", () => {
    const flat = flatten(parseTranscript(SAMPLE_VTT));
    expect(flat).toMatch(/storage accounts/);
  });

  it("chunks cues respecting max character budget", () => {
    const cues = parseTranscript(SAMPLE_VTT);
    const chunks = chunkCues(cues, { maxChars: 80 });
    expect(chunks.length).toBeGreaterThan(1);
  });
});
