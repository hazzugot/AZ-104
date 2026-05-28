import type { Achievement } from "@/lib/achievements";

export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  const earnedCount = achievements.filter((a) => a.earnedAt).length;
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Achievements</h2>
        <span className="text-xs text-muted-foreground">
          {earnedCount} / {achievements.length} earned
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 md:grid-cols-9 gap-2">
        {achievements.map((a) => {
          const earned = !!a.earnedAt;
          const Icon = a.icon;
          const pct = a.progress
            ? Math.min(100, (a.progress.current / a.progress.target) * 100)
            : earned
              ? 100
              : 0;
          return (
            <div
              key={a.id}
              title={`${a.title} — ${a.description}${a.progress && !earned ? ` (${a.progress.current}/${a.progress.target})` : ""}`}
              className={`relative flex flex-col items-center justify-center rounded-lg border p-3 transition-all ${
                earned
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-dashed border-muted bg-muted/30 opacity-60 hover:opacity-100"
              }`}
            >
              <Icon
                className={`h-6 w-6 ${
                  earned ? "text-amber-500" : "text-muted-foreground"
                }`}
              />
              <div className="mt-1 text-[10px] text-center leading-tight">
                {a.title}
              </div>
              {!earned && a.progress && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted">
                  <div
                    className="h-full bg-amber-500/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
