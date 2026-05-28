"use client";
import { useState } from "react";
import { Globe, Terminal, Workflow, Boxes, Layers, CheckCircle2, AlertCircle } from "lucide-react";

interface Step {
  title: string;
  description: string;
  portal?: string;
  cli?: string;
  powershell?: string;
  bicep?: string;
  terraform?: string;
  validation?: string;
  troubleshooting?: string;
}

const TABS = [
  { key: "portal", label: "Portal", Icon: Globe },
  { key: "cli", label: "Azure CLI", Icon: Terminal },
  { key: "powershell", label: "PowerShell", Icon: Workflow },
  { key: "bicep", label: "Bicep", Icon: Boxes },
  { key: "terraform", label: "Terraform", Icon: Layers },
] as const;

export function LabGuide({
  title,
  objective,
  prerequisites,
  cleanupSteps,
  steps,
}: {
  title: string;
  objective: string;
  prerequisites?: string | null;
  cleanupSteps?: string | null;
  steps: Step[];
}) {
  const [tool, setTool] = useState<(typeof TABS)[number]["key"]>("cli");

  const availableTabs = TABS.filter((t) => steps.some((s) => (s as never)[t.key]));

  return (
    <section className="rounded-lg border bg-card p-5">
      <header>
        <h2 className="text-lg font-semibold">Lab walkthrough: {title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{objective}</p>
      </header>

      {prerequisites && (
        <div className="mt-4 rounded-md bg-secondary p-3 text-sm">
          <span className="font-medium">Prerequisites: </span>
          {prerequisites}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-1 border-b">
        {availableTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTool(t.key)}
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm ${
              tool === t.key
                ? "border-azure-500 text-azure-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <ol className="mt-5 space-y-4">
        {steps.map((s, i) => {
          const code = (s as never)[tool] as string | undefined;
          return (
            <li key={i} className="rounded-md border p-4">
              <div className="flex items-baseline gap-3">
                <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-azure-500 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                </div>
              </div>

              {code && (
                <pre className="mt-3 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
                  <code>{code}</code>
                </pre>
              )}

              {!code && tool !== "portal" && (
                <p className="mt-3 text-xs italic text-muted-foreground">
                  No {tool} variant for this step. Try another tab.
                </p>
              )}

              {s.validation && (
                <div className="mt-3 flex items-start gap-2 rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium">Validate: </span>
                    {s.validation}
                  </span>
                </div>
              )}

              {s.troubleshooting && (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium">If it fails: </span>
                    {s.troubleshooting}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {cleanupSteps && (
        <div className="mt-5 rounded-md bg-rose-500/5 border border-rose-500/20 p-3 text-sm">
          <span className="font-medium text-rose-600 dark:text-rose-400">Cleanup: </span>
          {cleanupSteps}
        </div>
      )}
    </section>
  );
}
