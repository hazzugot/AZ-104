import { BlockKind, type ContentBlock } from "@prisma/client";

export function ContentBlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((b) => {
        switch (b.kind) {
          case BlockKind.HEADING: {
            const level = ((b.meta as { level?: number } | null)?.level ?? 2) as 2 | 3 | 4;
            const Tag = (`h${level}`) as keyof JSX.IntrinsicElements;
            return <Tag key={b.id}>{b.text}</Tag>;
          }
          case BlockKind.PARAGRAPH:
            return <p key={b.id}>{b.text}</p>;
          case BlockKind.CODE:
            return (
              <pre key={b.id} className="overflow-x-auto rounded-md bg-slate-900 p-3 text-slate-100">
                <code data-language={b.language ?? "text"}>{b.text}</code>
              </pre>
            );
          case BlockKind.LIST: {
            const meta = b.meta as { ordered?: boolean; items?: string[] } | null;
            const Tag = meta?.ordered ? "ol" : "ul";
            return (
              <Tag key={b.id}>
                {(meta?.items ?? []).map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </Tag>
            );
          }
          case BlockKind.TABLE: {
            const meta = b.meta as { rows?: string[][] } | null;
            return (
              <div key={b.id} className="overflow-x-auto">
                <table>
                  <tbody>
                    {(meta?.rows ?? []).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (ri === 0 ? <th key={ci}>{cell}</th> : <td key={ci}>{cell}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          case BlockKind.CALLOUT:
            return (
              <blockquote key={b.id} className="border-l-4 border-azure-500 pl-4 italic">
                {b.text}
              </blockquote>
            );
          case BlockKind.LINK: {
            const meta = b.meta as { href?: string } | null;
            return (
              <p key={b.id}>
                <a href={meta?.href} target="_blank" rel="noopener noreferrer">
                  {b.text}
                </a>
              </p>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
