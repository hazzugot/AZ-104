"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function StudyPlanGenerator({
  examDate,
  weeklyHours,
}: {
  examDate: Date | null;
  weeklyHours: number;
}) {
  const router = useRouter();
  const [date, setDate] = useState(
    examDate ? new Date(examDate).toISOString().slice(0, 10) : "",
  );
  const [hours, setHours] = useState(weeklyHours);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate: date || undefined, weeklyHours: hours }),
      });
      if (!r.ok) throw new Error();
      toast.success("Study plan generated");
      router.refresh();
    } catch {
      toast.error("Could not generate plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 grid gap-4 md:grid-cols-3 items-end">
      <div>
        <label htmlFor="examDate" className="text-xs uppercase tracking-wide text-muted-foreground">
          Exam date
        </label>
        <input
          id="examDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="hours" className="text-xs uppercase tracking-wide text-muted-foreground">
          Hours per week
        </label>
        <input
          id="hours"
          type="number"
          min={1}
          max={40}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        disabled={loading}
        onClick={generate}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Generate
      </button>
    </div>
  );
}
