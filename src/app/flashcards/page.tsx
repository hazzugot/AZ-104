import { Nav } from "@/components/nav";
import { auth } from "@/lib/auth";
import { getDueFlashcards } from "@/lib/spaced-repetition";
import { FlashcardDeck } from "@/components/flashcard-deck";
import Link from "next/link";

export default async function FlashcardsPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div>
        <Nav />
        <main className="container py-10 text-center">
          <p>
            <Link className="underline" href="/login">Sign in</Link> to start your daily reviews.
          </p>
        </main>
      </div>
    );
  }
  const due = await getDueFlashcards((session.user as { id: string }).id, 25);

  return (
    <div>
      <Nav />
      <main className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
        <p className="mt-2 text-muted-foreground">
          {due.length} card{due.length === 1 ? "" : "s"} due. SM-2 spaced repetition.
        </p>
        <div className="mt-8">
          {due.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All caught up. New cards unlock as you study new units.
            </p>
          ) : (
            <FlashcardDeck
              cards={due.map((r) => ({
                id: r.flashcardId,
                front: r.flashcard.front,
                back: r.flashcard.back,
                mnemonic: r.flashcard.mnemonic,
              }))}
            />
          )}
        </div>
      </main>
    </div>
  );
}
