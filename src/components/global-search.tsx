"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X, BookOpen, Brain, Target, Loader2 } from "lucide-react";
import Link from "next/link";

interface SearchResults {
  units: { id: string; title: string; moduleTitle: string; href: string; snippet: string; objective: string }[];
  flashcards: { id: string; front: string; back: string; category: string | null }[];
  questions: { id: string; stem: string; objective: string; difficulty: string }[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  // Cmd/Ctrl-K opens the search palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (r.ok) setResults(await r.json());
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [q]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
        title="Search (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        Search
        <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono">⌘K</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 p-4 sm:p-12"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto max-w-2xl rounded-lg border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search lessons, flashcards, questions…"
                className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <button
                onClick={() => setOpen(false)}
                className="ml-2 rounded p-1 hover:bg-secondary"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!results && q.length < 2 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Type 2+ characters to search across all content.
                </div>
              )}
              {results && (
                <>
                  {results.units.length === 0 &&
                    results.flashcards.length === 0 &&
                    results.questions.length === 0 && (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No results for "{q}".
                      </div>
                    )}

                  {results.units.length > 0 && (
                    <Section icon={BookOpen} title="Lessons">
                      {results.units.map((u) => (
                        <Link
                          key={u.id}
                          href={u.href}
                          onClick={() => setOpen(false)}
                          className="block rounded-md p-2.5 text-sm hover:bg-secondary"
                        >
                          <div className="text-xs text-muted-foreground">{u.moduleTitle}</div>
                          <div className="font-medium">{u.title}</div>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {u.snippet}
                          </p>
                        </Link>
                      ))}
                    </Section>
                  )}

                  {results.flashcards.length > 0 && (
                    <Section icon={Brain} title="Flashcards">
                      {results.flashcards.map((f) => (
                        <div key={f.id} className="rounded-md p-2.5 text-sm">
                          <div className="font-medium">{f.front}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{f.back}</div>
                        </div>
                      ))}
                    </Section>
                  )}

                  {results.questions.length > 0 && (
                    <Section icon={Target} title="Practice questions">
                      {results.questions.map((qq) => (
                        <div key={qq.id} className="rounded-md p-2.5 text-sm">
                          <div className="text-xs text-muted-foreground">
                            {qq.objective.replace("_", " ").toLowerCase()} · {qq.difficulty.toLowerCase()}
                          </div>
                          <div className="line-clamp-2">{qq.stem}</div>
                        </div>
                      ))}
                    </Section>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Search;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-1 py-2">
      <div className="px-2 mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
