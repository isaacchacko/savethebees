import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/**
 * Markdown for posts and pages. The content mixes in raw HTML (figures, footnote spans), so it is
 * parsed rather than escaped, and `$…$` is math. A leading `# heading` is dropped: the page shows
 * its title already.
 */
export default function Prose({ content }: { content: string }) {
  const body = content.replace(/^\s*#\s+.+\n/, "");
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
