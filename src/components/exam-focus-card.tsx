import { AlertTriangle, Target } from "lucide-react";

export function ExamFocusCard({
  score,
  tips,
  mistakes,
}: {
  score: number;
  tips: string | null;
  mistakes: string | null;
}) {
  return (
    <div className="rounded-lg border-2 border-amber-500/40 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          Likely on the exam
        </h3>
        <span className="ml-auto text-xs text-amber-700/70">
          {(score * 100).toFixed(0)}% confidence
        </span>
      </div>
      {tips && (
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Memorize
          </div>
          <p className="mt-1 whitespace-pre-line text-sm">{tips}</p>
        </div>
      )}
      {mistakes && (
        <div className="mt-3 rounded-md bg-destructive/5 p-3">
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-destructive">
            <AlertTriangle className="h-3 w-3" /> Common traps
          </div>
          <p className="mt-1 whitespace-pre-line text-sm">{mistakes}</p>
        </div>
      )}
    </div>
  );
}
