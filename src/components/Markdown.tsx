import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * `inline` drops the paragraph wrapper, for markdown that has to flow inside a
 * line of its own — a note on a list entry, say, where a block would break it
 * onto the next row.
 */
export default function Markdown({
  content,
  inline = false,
}: {
  content: string;
  inline?: boolean;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        ...(inline ? { p: ({ children }) => <>{children}</> } : {}),
        h1: ({ children }) => <h2 style={{ marginTop: 0 }}>{children}</h2>,
        a: ({ href, children }) => {
          const external = href?.startsWith("http");
          return (
            <a
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
