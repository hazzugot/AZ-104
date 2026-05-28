"use client";
import { useState } from "react";
import { Check, X, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ReviewableQuestion {
  id: string;
  objective: string;
  difficulty: string;
  type: string;
  stem: string;
  caseStudy: string | null;
  options: { id: string; text: string }[];
  correctIds: string[];
  explanation: string;
  distractorRationale: Record<string, string>;
  references: { title: string; url: string }[];
  tags: string[];
  moduleTitle: string | null;
}

export function QuestionReviewer({ questions }: { questions: ReviewableQuestion[] }) {
  const [idx, setIdx] = useState(0);
  const [edited, setEdited] = useState<Partial<ReviewableQuestion>>({});
  const [remaining, setRemaining] = useState(questions);

  const q = remaining[idx];
  if (!q) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        ✓ Review queue cleared. Refresh to load the next batch.
      </div>
    );
  }

  const merged = { ...q, ...edited };

  async function decide(decision: "APPROVED" | "REJECTED") {
    const r = await fetch("/api/admin/review-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: q.id,
        decision,
        edits: {
          stem: edited.stem,
          explanation: edited.explanation,
          qualityScore: decision === "APPROVED" ? 0.85 : undefined,
        },
      }),
    });
    if (!r.ok) {
      toast.error("Save failed");
      return;
    }
    toast.success(decision === "APPROVED" ? "Approved" : "Rejected");
    setRemaining((rem) => rem.filter((_, i) => i !== idx));
    setEdited({});
    setIdx((i) => Math.min(i, remaining.length - 2));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {idx + 1} / {remaining.length} pending
          </span>
          <span>
            {q.objective} · {q.difficulty} · {q.type}
            {q.moduleTitle ? ` · ${q.moduleTitle}` : ""}
          </span>
        </div>

        {q.caseStudy && (
          <div className="mb-4 rounded-md bg-secondary p-3 text-sm">{q.caseStudy}</div>
        )}

        <label className="block text-xs uppercase tracking-wide text-muted-foreground">Stem</label>
        <textarea
          value={merged.stem}
          onChange={(e) => setEdited({ ...edited, stem: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
        />

        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Options</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {merged.options.map((o) => {
              const isCorrect = merged.correctIds.includes(o.id);
              return (
                <li
                  key={o.id}
                  className={`flex items-start gap-2 rounded-md border p-2 ${
                    isCorrect ? "border-emerald-500/50 bg-emerald-500/5" : ""
                  }`}
                >
                  <span className="font-mono text-xs mt-0.5">{o.id}.</span>
                  <span className="flex-1">{o.text}</span>
                  {isCorrect && <Check className="h-4 w-4 text-emerald-500" />}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4">
          <label className="block text-xs uppercase tracking-wide text-muted-foreground">
            Explanation
          </label>
          <textarea
            value={merged.explanation}
            onChange={(e) => setEdited({ ...edited, explanation: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
          />
        </div>

        {Object.keys(merged.distractorRationale).length > 0 && (
          <div className="mt-4 rounded-md bg-secondary/50 p-3 text-sm">
            <div className="font-medium">Distractor rationale</div>
            <dl className="mt-2 space-y-1">
              {Object.entries(merged.distractorRationale).map(([k, v]) => (
                <div key={k}>
                  <dt className="inline font-mono text-xs">{k}:</dt>{" "}
                  <dd className="inline text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {merged.references.length > 0 && (
          <div className="mt-4 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">References</div>
            <ul className="mt-2 space-y-1">
              {merged.references.map((r) => (
                <li key={r.url}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-azure-500"
                  >
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            disabled={idx === 0}
            onClick={() => setIdx((i) => i - 1)}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => decide("REJECTED")}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" /> Reject
            </button>
            <button
              onClick={() => decide("APPROVED")}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1.5 text-sm text-white hover:bg-emerald-600"
            >
              <Save className="h-4 w-4" /> Approve
            </button>
          </div>
          <button
            disabled={idx >= remaining.length - 1}
            onClick={() => setIdx((i) => i + 1)}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Skip <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border bg-card p-4 text-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Tags</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {q.tags.map((t) => (
              <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Reviewer checklist</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Stem describes a realistic scenario</li>
            <li>Exactly one correct answer (or N for multi-response)</li>
            <li>Distractors are plausible, not throwaways</li>
            <li>Explanation cites Microsoft documentation</li>
            <li>Objective tag is accurate</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
