import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * `inline` drops the paragraph wrapper, for markdown that has to flow inside a
 * line of its own — a note on a list entry, say, where a block would break it
 * onto the next row.
 *
 * `skipTitle` drops the `# heading`, for pages where the card already shows a
 * title of its own.
 */
export default function Markdown({
  content,
  inline = false,
  skipTitle = false,
}: {
  content: string;
  inline?: boolean;
  skipTitle?: boolean;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        ...(inline ? { p: ({ children }) => <>{children}</> } : {}),
        h1: ({ children }) => (skipTitle ? null : <h2>{children}</h2>),
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
