"use client";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function TutorChat() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tutor/thread", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setThreadId(d.threadId));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || !threadId || streaming) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const r = await fetch("/api/tutor/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: text }),
      });
      if (!r.ok || !r.body) throw new Error("stream failed");

      const reader = r.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: (copy[copy.length - 1]?.content ?? "") + chunk,
          };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "_(connection lost)_" };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="grid h-[70vh] grid-rows-[1fr_auto] rounded-lg border bg-card">
      <div className="overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Try: "Explain the difference between Azure Load Balancer and Application Gateway."
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg p-3 text-sm ${
              m.role === "user"
                ? "ml-auto bg-azure-500 text-white"
                : "bg-secondary"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content || (streaming ? "…" : "")}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about AZ-104..."
          disabled={streaming}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
