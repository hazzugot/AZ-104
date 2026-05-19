"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface ExamItem {
  id: string;
  type: string;
  stem: string;
  caseStudy: string | null;
  options: { id: string; text: string }[];
  multi: boolean;
  objective: string;
  difficulty: string;
}

interface Props {
  examId: string;
  mode: string;
  durationMin: number;
  items: ExamItem[];
}

export function ExamRunner({ examId, mode, durationMin, items }: Props) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(durationMin * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const current = items[idx]!;
  const isTimed = mode === "TIMED";

  // Start attempt on mount.
  useEffect(() => {
    fetch("/api/exams/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examId }),
    })
      .then((r) => r.json())
      .then((d) => setAttemptId(d.attemptId))
      .catch(() => toast.error("Could not start attempt"));
  }, [examId]);

  // Timer.
  useEffect(() => {
    if (!isTimed || submitted) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          handleSubmit();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isTimed, submitted]);

  const toggleAnswer = (optionId: string) => {
    setAnswers((prev) => {
      const cur = prev[current.id] ?? [];
      if (current.multi) {
        return {
          ...prev,
          [current.id]: cur.includes(optionId) ? cur.filter((o) => o !== optionId) : [...cur, optionId],
        };
      }
      return { ...prev, [current.id]: [optionId] };
    });
  };

  async function handleSubmit() {
    if (!attemptId || submitted) return;
    setSubmitted(true);
    const r = await fetch("/api/exams/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, answers, confidence }),
    });
    if (!r.ok) {
      toast.error("Submit failed");
      setSubmitted(false);
      return;
    }
    setResult(await r.json());
  }

  if (result) {
    return <ExamResult result={result} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Question {idx + 1} / {items.length}
          </span>
          <span>
            {current.objective.replace("_", " ").toLowerCase()} · {current.difficulty.toLowerCase()}
          </span>
        </div>
        {current.caseStudy && (
          <div className="mb-4 rounded-md bg-secondary p-3 text-sm">{current.caseStudy}</div>
        )}
        <p className="whitespace-pre-line text-base font-medium">{current.stem}</p>
        <ul className="mt-6 space-y-2">
          {current.options.map((o) => {
            const selected = (answers[current.id] ?? []).includes(o.id);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => toggleAnswer(o.id)}
                  className={`w-full rounded-md border p-3 text-left text-sm hover:bg-secondary ${
                    selected ? "border-azure-500 bg-azure-50 dark:bg-azure-500/10" : ""
                  }`}
                >
                  <span className="mr-2 font-mono text-xs">{o.id}.</span>
                  {o.text}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between">
          <button
            disabled={idx === 0}
            onClick={() => setIdx((i) => i - 1)}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            onClick={() => {
              setFlagged((s) => {
                const n = new Set(s);
                n.has(current.id) ? n.delete(current.id) : n.add(current.id);
                return n;
              });
            }}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm"
          >
            <Flag className="h-4 w-4" /> {flagged.has(current.id) ? "Unflag" : "Flag"}
          </button>
          {idx < items.length - 1 ? (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitted}
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
            >
              Submit
            </button>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        {isTimed && (
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Time left</div>
            <div className={`mt-1 text-2xl font-mono ${remaining < 60 ? "text-destructive" : ""}`}>
              {formatDuration(remaining)}
            </div>
          </div>
        )}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Question map
          </div>
          <div className="grid grid-cols-8 gap-1">
            {items.map((it, i) => {
              const answered = (answers[it.id]?.length ?? 0) > 0;
              const isFlag = flagged.has(it.id);
              return (
                <button
                  key={it.id}
                  onClick={() => setIdx(i)}
                  className={`h-7 rounded text-xs ${
                    i === idx
                      ? "bg-azure-500 text-white"
                      : answered
                        ? "bg-emerald-500/20"
                        : "bg-secondary"
                  } ${isFlag ? "ring-2 ring-amber-500" : ""}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Confidence</div>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setConfidence({ ...confidence, [current.id]: n })}
                className={`h-7 w-7 rounded text-xs ${
                  confidence[current.id] === n ? "bg-azure-500 text-white" : "bg-secondary"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ExamResult({ result }: { result: unknown }) {
  const r = result as {
    scaledScore: number;
    passed: boolean;
    rawPercent: number;
    perObjective: Record<string, { correct: number; total: number; percent: number }>;
  };
  return (
    <div className="mx-auto max-w-xl rounded-lg border bg-card p-8 text-center">
      <div className={`text-5xl font-bold ${r.passed ? "text-emerald-500" : "text-destructive"}`}>
        {r.scaledScore}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        Scaled score · {r.passed ? "PASS" : "FAIL"} · {Math.round(r.rawPercent * 100)}% raw
      </div>
      <div className="mt-6 space-y-2 text-left">
        {Object.entries(r.perObjective).map(([k, v]) => (
          <div key={k}>
            <div className="flex items-center justify-between text-sm">
              <span>{k.replace("_", " ").toLowerCase()}</span>
              <span className="text-muted-foreground">
                {v.correct}/{v.total} · {Math.round(v.percent * 100)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded bg-secondary">
              <div className="h-full rounded bg-azure-500" style={{ width: `${v.percent * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
