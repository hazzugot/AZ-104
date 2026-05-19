/**
 * Sanity test for the SM-2 scheduler. Run: `pnpm tsx scripts/test-spaced-repetition.ts`.
 */
import { nextSM2 } from "../src/lib/spaced-repetition";

let state = { easeFactor: 2.5, intervalDays: 0, repetitions: 0, dueAt: new Date() };
const grades = [4, 5, 4, 3, 5, 5, 5];
for (const g of grades) {
  state = nextSM2(state, g);
  console.log(
    `grade=${g} → interval=${state.intervalDays}d ef=${state.easeFactor.toFixed(2)} reps=${state.repetitions} due=${state.dueAt.toISOString().slice(0, 10)}`,
  );
}
