/**
 * Lightweight Markdown renderer tuned for AZ-104 lesson content.
 * Avoids pulling a full markdown library — supports headings, paragraphs,
 * bold/italic/code, lists, tables, fenced code blocks, blockquotes, links.
 *
 * For richer content (footnotes, math, frontmatter) swap in `react-markdown`
 * + `remark-gfm` later; the interface stays the same.
 */
import { cn } from "@/lib/utils";

type Block =
  | { kind: "heading"; level: 2 | 3 | 4; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; lang: string; body: string }
  | { kind: "blockquote"; text: string }
  | { kind: "table"; rows: string[][] };

function parse(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;

    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced code
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        buf.push(lines[i]!);
        i++;
      }
      i++;
      blocks.push({ kind: "code", lang, body: buf.join("\n") });
      continue;
    }

    // Headings
    const heading = line.match(/^(#{2,4})\s+(.*)$/);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1]!.length as 2 | 3 | 4,
        text: heading[2]!,
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const buf = [line.slice(2)];
      i++;
      while (i < lines.length && lines[i]!.startsWith("> ")) {
        buf.push(lines[i]!.slice(2));
        i++;
      }
      blocks.push({ kind: "blockquote", text: buf.join(" ") });
      continue;
    }

    // Table — line starting with | and next line is separator
    if (line.startsWith("|") && lines[i + 1]?.match(/^\|\s*[-:|\s]+\|$/)) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.startsWith("|")) {
        if (!lines[i]!.match(/^\|\s*[-:|\s]+\|$/)) {
          const cells = lines[i]!.split("|").slice(1, -1).map((c) => c.trim());
          rows.push(cells);
        }
        i++;
      }
      blocks.push({ kind: "table", rows });
      continue;
    }

    // Lists
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i]!.match(/^[-*]\s+/)) {
        items.push(lines[i]!.replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i]!.match(/^\d+\.\s+/)) {
        items.push(lines[i]!.replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    // Paragraph (consume until blank line)
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i]!.trim() && !lines[i]!.match(/^([#>|\d-]|\*|```)/)) {
      buf.push(lines[i]!);
      i++;
    }
    blocks.push({ kind: "p", text: buf.join(" ") });
  }
  return blocks;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let buf = "";
  let i = 0;
  const flush = () => {
    if (buf) parts.push(buf);
    buf = "";
  };
  while (i < text.length) {
    if (text[i] === "`") {
      flush();
      const end = text.indexOf("`", i + 1);
      if (end === -1) {
        buf += text[i]!;
        i++;
        continue;
      }
      parts.push(
        <code key={parts.length} className="rounded bg-slate-900/10 dark:bg-slate-800 px-1 py-0.5 text-[0.9em]">
          {text.slice(i + 1, end)}
        </code>,
      );
      i = end + 1;
    } else if (text.slice(i, i + 2) === "**") {
      flush();
      const end = text.indexOf("**", i + 2);
      if (end === -1) {
        buf += text[i]!;
        i++;
        continue;
      }
      parts.push(<strong key={parts.length}>{text.slice(i + 2, end)}</strong>);
      i = end + 2;
    } else if (text[i] === "*" || text[i] === "_") {
      const marker = text[i]!;
      flush();
      const end = text.indexOf(marker, i + 1);
      if (end === -1) {
        buf += text[i]!;
        i++;
        continue;
      }
      parts.push(<em key={parts.length}>{text.slice(i + 1, end)}</em>);
      i = end + 1;
    } else if (text[i] === "[") {
      const close = text.indexOf("]", i + 1);
      if (close > 0 && text[close + 1] === "(") {
        const paren = text.indexOf(")", close + 2);
        if (paren > 0) {
          flush();
          parts.push(
            <a
              key={parts.length}
              href={text.slice(close + 2, paren)}
              className="text-azure-500 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {text.slice(i + 1, close)}
            </a>,
          );
          i = paren + 1;
          continue;
        }
      }
      buf += text[i]!;
      i++;
    } else {
      buf += text[i]!;
      i++;
    }
  }
  flush();
  return parts;
}

export function LessonMarkdown({ source, className }: { source: string; className?: string }) {
  const blocks = parse(source);
  return (
    <article className={cn("space-y-4 leading-relaxed", className)}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "heading": {
            const sizes = { 2: "text-2xl mt-8", 3: "text-xl mt-6", 4: "text-lg mt-4" };
            const Tag = (`h${b.level}`) as keyof JSX.IntrinsicElements;
            return (
              <Tag key={i} className={cn("font-semibold tracking-tight", sizes[b.level])}>
                {renderInline(b.text)}
              </Tag>
            );
          }
          case "p":
            return (
              <p key={i} className="text-base text-foreground">
                {renderInline(b.text)}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc pl-6 space-y-1">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal pl-6 space-y-1">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-md border bg-slate-900 p-4 text-sm text-slate-100"
                data-lang={b.lang}
              >
                <code>{b.body}</code>
              </pre>
            );
          case "blockquote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-azure-500 bg-azure-500/5 pl-4 py-2 italic"
              >
                {renderInline(b.text)}
              </blockquote>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-secondary">
                      {b.rows[0]?.map((c, j) => (
                        <th key={j} className="border px-3 py-2 text-left font-medium">
                          {renderInline(c)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.slice(1).map((row, ri) => (
                      <tr key={ri} className="odd:bg-card">
                        {row.map((cell, ci) => (
                          <td key={ci} className="border px-3 py-2">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </article>
  );
}
