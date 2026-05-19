"use client";
import { useState } from "react";
import { toast } from "sonner";

interface Card {
  id: string;
  front: string;
  back: string;
  mnemonic?: string | null;
}

export function FlashcardDeck({ cards }: { cards: Card[] }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  if (done || idx >= cards.length) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h3 className="text-xl font-semibold">Session complete</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Cards re-scheduled per your grades. Come back tomorrow.
        </p>
      </div>
    );
  }

  const card = cards[idx]!;

  async function grade(g: number) {
    const r = await fetch("/api/flashcards/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flashcardId: card.id, grade: g }),
    });
    if (!r.ok) {
      toast.error("Grade failed");
      return;
    }
    setFlipped(false);
    if (idx + 1 >= cards.length) setDone(true);
    else setIdx((i) => i + 1);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 text-sm text-muted-foreground">
        Card {idx + 1} / {cards.length}
      </div>
      <div
        onClick={() => setFlipped((f) => !f)}
        className="min-h-[260px] cursor-pointer rounded-xl border-2 bg-card p-8 text-center shadow-sm"
      >
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {flipped ? "Answer" : "Question"}
        </div>
        <p className="mt-4 text-lg">{flipped ? card.back : card.front}</p>
        {flipped && card.mnemonic && (
          <p className="mt-6 text-sm italic text-muted-foreground">💡 {card.mnemonic}</p>
        )}
        <p className="mt-6 text-xs text-muted-foreground">click to flip</p>
      </div>
      {flipped && (
        <div className="mt-6 grid grid-cols-6 gap-2">
          {[
            { g: 0, label: "Blackout", color: "bg-red-500/80" },
            { g: 1, label: "Wrong", color: "bg-red-400/80" },
            { g: 2, label: "Hard", color: "bg-orange-400/80" },
            { g: 3, label: "OK", color: "bg-yellow-400/80" },
            { g: 4, label: "Good", color: "bg-emerald-400/80" },
            { g: 5, label: "Easy", color: "bg-emerald-600/80" },
          ].map((b) => (
            <button
              key={b.g}
              onClick={() => grade(b.g)}
              className={`rounded-md py-2 text-xs font-medium text-white ${b.color}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
