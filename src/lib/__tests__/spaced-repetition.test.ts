import { describe, it, expect } from "vitest";
import { nextSM2 } from "../spaced-repetition";

describe("SM-2 scheduler", () => {
  it("first correct review schedules 1 day out", () => {
    const next = nextSM2(
      { easeFactor: 2.5, intervalDays: 0, repetitions: 0, dueAt: new Date() },
      4,
    );
    expect(next.intervalDays).toBe(1);
    expect(next.repetitions).toBe(1);
  });

  it("second correct review schedules 6 days out", () => {
    let s = nextSM2(
      { easeFactor: 2.5, intervalDays: 0, repetitions: 0, dueAt: new Date() },
      4,
    );
    s = nextSM2(s, 4);
    expect(s.intervalDays).toBe(6);
  });

  it("failure resets repetitions and interval", () => {
    const s = nextSM2(
      { easeFactor: 2.5, intervalDays: 15, repetitions: 4, dueAt: new Date() },
      1,
    );
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
  });

  it("ease factor cannot go below 1.3", () => {
    let s = { easeFactor: 1.3, intervalDays: 1, repetitions: 1, dueAt: new Date() };
    for (let i = 0; i < 5; i++) s = nextSM2(s, 0);
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});
