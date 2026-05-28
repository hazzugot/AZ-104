"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Brain, Target, FlaskConical, RotateCcw } from "lucide-react";

interface PlanItem {
  date: string;
  type: string;
  title: string;
  durationMin: number;
  objective?: string;
}

const ICONS: Record<string, typeof BookOpen> = {
  lesson: BookOpen,
  flashcards: Brain,
  practice_exam: Target,
  lab: FlaskConical,
  review: RotateCcw,
};

const ICON_BG: Record<string, string> = {
  lesson: "bg-azure-500/10 text-azure-500",
  flashcards: "bg-purple-500/10 text-purple-500",
  practice_exam: "bg-amber-500/10 text-amber-600",
  lab: "bg-emerald-500/10 text-emerald-600",
  review: "bg-rose-500/10 text-rose-500",
};

export function StudyPlanCalendar({ items }: { items: PlanItem[] }) {
  const grouped = useMemo(() => {
    const m = new Map<string, PlanItem[]>();
    for (const it of items) {
      const arr = m.get(it.date) ?? [];
      arr.push(it);
      m.set(it.date, arr);
    }
    return m;
  }, [items]);

  const dates = useMemo(() => Array.from(grouped.keys()).sort(), [grouped]);
  const [start, setStart] = useState(0);
  const visible = dates.slice(start, start + 7);

  if (!dates.length) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Next 7 days</h2>
        <div className="flex gap-2">
          <button
            disabled={start === 0}
            onClick={() => setStart((s) => Math.max(0, s - 7))}
            className="rounded-md border p-1.5 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            disabled={start + 7 >= dates.length}
            onClick={() => setStart((s) => s + 7)}
            className="rounded-md border p-1.5 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {visible.map((date) => {
          const day = grouped.get(date) ?? [];
          const total = day.reduce((a, b) => a + b.durationMin, 0);
          const d = new Date(date);
          return (
            <div key={date} className="rounded-lg border bg-card p-3 min-h-[200px]">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div className="text-lg font-semibold">{d.getDate()}</div>
              <div className="text-[10px] text-muted-foreground mb-3">{total} min</div>
              <ul className="space-y-1.5">
                {day.map((it, i) => {
                  const Icon = ICONS[it.type] ?? BookOpen;
                  return (
                    <li
                      key={i}
                      className={`rounded p-1.5 text-[11px] leading-tight ${ICON_BG[it.type] ?? "bg-secondary"}`}
                      title={it.title}
                    >
                      <div className="flex items-start gap-1">
                        <Icon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{it.title}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
