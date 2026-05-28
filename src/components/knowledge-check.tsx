"use client";
import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  rationale?: string;
}

interface Check {
  id: string;
  prompt: string;
  options: Option[];
  explanation: string;
  difficulty: number;
}

export function KnowledgeChecks({ checks }: { checks: Check[] }) {
  if (!checks.length) return null;
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold">Knowledge check</h2>
        <p className="text-sm text-muted-foreground">
          Try these before moving on. Instant feedback, no scoring penalty.
        </p>
      </header>
      {checks.map((c, i) => (
        <KnowledgeCheckItem key={c.id} index={i + 1} check={c} />
      ))}
    </section>
  );
}

function KnowledgeCheckItem({ index, check }: { index: number; check: Check }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const isMulti = check.options.filter((o) => o.isCorrect).length > 1;

  function toggle(id: string) {
    if (submitted) return;
    const next = new Set(selected);
    if (isMulti) {
      next.has(id) ? next.delete(id) : next.add(id);
    } else {
      next.clear();
      next.add(id);
    }
    setSelected(next);
  }

  function reset() {
    setSelected(new Set());
    setSubmitted(false);
  }

  const correctIds = new Set(check.options.filter((o) => o.isCorrect).map((o) => o.id));
  const allCorrect =
    submitted &&
    selected.size === correctIds.size &&
    [...selected].every((s) => correctIds.has(s));

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Question {index} · difficulty {check.difficulty}
        </div>
        {submitted && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-secondary"
          >
            <RotateCcw className="h-3 w-3" /> Retry
          </button>
        )}
      </div>
      <p className="mt-2 text-sm font-medium">{check.prompt}</p>
      {isMulti && (
        <p className="mt-1 text-xs text-muted-foreground">Select all that apply.</p>
      )}

      <ul className="mt-3 space-y-1.5">
        {check.options.map((o) => {
          const isSelected = selected.has(o.id);
          const reveal = submitted;
          let cls = "border-border";
          if (reveal && o.isCorrect) cls = "border-emerald-500/50 bg-emerald-500/5";
          else if (reveal && isSelected && !o.isCorrect) cls = "border-destructive/50 bg-destructive/5";
          else if (isSelected) cls = "border-azure-500 bg-azure-500/5";
          return (
            <li key={o.id}>
              <button
                onClick={() => toggle(o.id)}
                disabled={submitted}
                className={`w-full rounded-md border p-2.5 text-left text-sm transition-colors ${cls} ${
                  submitted ? "cursor-default" : "hover:bg-secondary"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono text-xs mt-0.5">{o.id}.</span>
                  <span className="flex-1">{o.text}</span>
                  {reveal && o.isCorrect && <Check className="h-4 w-4 text-emerald-500" />}
                  {reveal && isSelected && !o.isCorrect && <X className="h-4 w-4 text-destructive" />}
                </div>
                {reveal && o.rationale && !o.isCorrect && (
                  <div className="mt-1.5 ml-5 text-xs text-muted-foreground italic">
                    {o.rationale}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={selected.size === 0}
          className="mt-3 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          Check answer
        </button>
      ) : (
        <div
          className={`mt-3 rounded-md p-3 text-sm ${
            allCorrect ? "bg-emerald-500/10" : "bg-amber-500/10"
          }`}
        >
          <div className="font-semibold">
            {allCorrect ? "✓ Correct" : "Not quite — review the explanation"}
          </div>
          <p className="mt-1 text-muted-foreground">{check.explanation}</p>
        </div>
      )}
    </div>
  );
}
